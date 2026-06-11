/**
 * @file ScannerScreen.js
 * @description Camera-based math problem scanner. Allows users to take a photo
 * or select from gallery, crop the image with a draggable rectangular overlay,
 * then send the cropped image to the configured AI provider for step-by-step solving.
 *
 * @requires expo-camera (CameraView)
 * @requires expo-image-picker
 * @requires expo-image-manipulator (manipulateAsync for cropping)
 * @requires expo-media-library (save camera photos to device gallery)
 * @requires ../services/aiService
 * @requires ../components/MathRenderer
 *
 * @changelog
 * - Initial implementation with hardcoded Anthropic API key
 * - Fixed expo-file-system Base64 encoding crash — switched to native base64
 *   from camera takePictureAsync and ImagePicker
 * - Migrated to async isApiKeySet() after Settings-based config was added
 * - Added 3-second polling interval to refresh API key warning after saving
 * - Updated warning text to direct users to Settings tab
 * - Attempted expo-image-manipulator integration for crop; reverted due to
 *   ImageManipulator crash on Expo Go — now uses simple base64 directly
 * - Added crop screen: after capturing/selecting an image, a rectangular crop
 *   overlay lets the user drag and resize the crop area before sending to AI.
 *   Camera photos are automatically saved to the device gallery.
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
  ActivityIndicator, Image, TextInput, Keyboard, PanResponder, Dimensions,
} from 'react-native';
// useSafeAreaInsets provides the bottom inset to clear the gesture navigation bar
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
// manipulateAsync performs the actual pixel crop; SaveFormat sets output encoding
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
// MediaLibrary saves camera-captured photos to the device gallery
import * as MediaLibrary from 'expo-media-library';
import { solveFromImage, solveFromText, isApiKeySet } from '../services/aiService';
// toLatex converts a math.js expression to a LaTeX string for the KaTeX preview
import { toLatex } from '../services/mathSolver';
import MathRenderer from '../components/MathRenderer';
import MathDisplay, { exprToLatex } from '../components/MathDisplay';
import MathKeyboard from '../components/MathKeyboard';

// ── Crop overlay constants ───────────────────────────────────────────────
// Minimum crop rectangle size in display pixels (prevents zero-area crops)
const MIN_CROP = 60;
// Touch distance threshold for detecting corner handle drags vs body drags
const CORNER_HIT_RADIUS = 30;

/** Clamps a value between min and max (inclusive). */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Scanner screen component. Provides camera and gallery access for
 * photographing math problems, a crop overlay for framing the region of
 * interest, and submission to AI for solving.
 * @returns {React.ReactElement}
 */
export default function ScannerScreen() {
  // Bottom inset ensures scroll content never hides behind the gesture nav bar
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  // 'scan' shows the camera/gallery UI; 'ai-solve' shows the text input UI
  const [mode, setMode] = useState('scan');
  // showCamera is separate from mode so the camera overlay can be dismissed
  // without switching the outer scan/ai-solve tab back to 'ai-solve'
  const [showCamera, setShowCamera] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState(null);
  const cameraRef = useRef(null);
  const [apiKeySet, setApiKeySet] = useState(true);

  // For AI Solve mode
  const [expression, setExpression] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  // showMathKeyboard controls the scientific keyboard for the expression field
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);

  // ── Crop screen state ──────────────────────────────────────────────────
  // When true, the crop overlay is shown instead of the scan/camera view
  const [showCrop, setShowCrop] = useState(false);
  // Source image data passed from camera/gallery into the crop screen
  // Shape: { uri, base64, mimeType, fromCamera, imgW, imgH }
  const [cropSource, setCropSource] = useState(null);
  // Crop rectangle in display-space coordinates { x, y, w, h }
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // ── Crop gesture refs ──────────────────────────────────────────────────
  // Refs mirror the crop rectangle and display dimensions so PanResponder
  // callbacks (created once via useMemo) always read the latest values
  // instead of capturing stale closures.
  const cropRef = useRef({
    rect: { x: 0, y: 0, w: 0, h: 0 },
    display: { w: 0, h: 0 },
  });
  // Snapshot of the crop rect at gesture start, plus the detected drag mode
  const dragStartRef = useRef({ x: 0, y: 0, w: 0, h: 0, mode: 'move' });

  // Poll API key status every 3 seconds so the warning banner disappears
  // automatically once the user saves their key in Settings — no manual refresh needed
  React.useEffect(() => {
    isApiKeySet().then(setApiKeySet);
    const interval = setInterval(() => isApiKeySet().then(setApiKeySet), 3000);
    // Clear the interval when the screen unmounts to avoid state updates on
    // an unmounted component
    return () => clearInterval(interval);
  }, []);

  // ── Crop PanResponder ──────────────────────────────────────────────────
  // A single PanResponder handles both moving and corner-resizing the crop
  // rectangle. The touch location at onPanResponderGrant determines whether
  // the user tapped near a corner (resize) or inside the body (move).
  const cropPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const r = cropRef.current.rect;

      // Check proximity to each corner handle to pick the resize mode
      const corners = {
        'resize-tl': [r.x, r.y],
        'resize-tr': [r.x + r.w, r.y],
        'resize-bl': [r.x, r.y + r.h],
        'resize-br': [r.x + r.w, r.y + r.h],
      };

      let hitMode = 'move';
      let minDist = CORNER_HIT_RADIUS;
      for (const [name, [cx, cy]] of Object.entries(corners)) {
        const dist = Math.sqrt((locationX - cx) ** 2 + (locationY - cy) ** 2);
        if (dist < minDist) {
          minDist = dist;
          hitMode = name;
        }
      }

      // Snapshot the current rect and drag mode so onPanResponderMove can
      // calculate deltas from a stable starting point
      dragStartRef.current = { ...r, mode: hitMode };
    },
    onPanResponderMove: (_, gesture) => {
      const s = dragStartRef.current;
      const d = cropRef.current.display;
      let newRect;

      switch (s.mode) {
        case 'move':
          // Translate the entire rectangle, clamped to display bounds
          newRect = {
            x: clamp(s.x + gesture.dx, 0, d.w - s.w),
            y: clamp(s.y + gesture.dy, 0, d.h - s.h),
            w: s.w,
            h: s.h,
          };
          break;

        case 'resize-br':
          // Bottom-right corner: origin stays, width/height grow toward BR
          newRect = {
            x: s.x, y: s.y,
            w: clamp(s.w + gesture.dx, MIN_CROP, d.w - s.x),
            h: clamp(s.h + gesture.dy, MIN_CROP, d.h - s.y),
          };
          break;

        case 'resize-tl': {
          // Top-left corner: origin moves, opposite corner stays fixed
          const dx = clamp(gesture.dx, -s.x, s.w - MIN_CROP);
          const dy = clamp(gesture.dy, -s.y, s.h - MIN_CROP);
          newRect = { x: s.x + dx, y: s.y + dy, w: s.w - dx, h: s.h - dy };
          break;
        }

        case 'resize-tr': {
          // Top-right corner: top edge moves, left edge stays
          const dy = clamp(gesture.dy, -s.y, s.h - MIN_CROP);
          newRect = {
            x: s.x,
            y: s.y + dy,
            w: clamp(s.w + gesture.dx, MIN_CROP, d.w - s.x),
            h: s.h - dy,
          };
          break;
        }

        case 'resize-bl': {
          // Bottom-left corner: left edge moves, top edge stays
          const dx = clamp(gesture.dx, -s.x, s.w - MIN_CROP);
          newRect = {
            x: s.x + dx, y: s.y,
            w: s.w - dx,
            h: clamp(s.h + gesture.dy, MIN_CROP, d.h - s.y),
          };
          break;
        }

        default:
          return;
      }

      // Update both the ref (for next gesture frame) and state (for re-render)
      cropRef.current.rect = newRect;
      setCropRect(newRect);
    },
  }), []);

  // ── Crop helpers ───────────────────────────────────────────────────────

  /**
   * Calculates display dimensions for the image (fit within screen bounds
   * while maintaining aspect ratio) and the initial crop rectangle.
   * Called by both takePicture and pickImage to transition into the crop screen.
   *
   * @param {object} source - { uri, base64, mimeType, fromCamera, imgW, imgH }
   */
  const initCrop = (source) => {
    // Display the image at full available width, preserving aspect ratio.
    // No max-height cap — the crop screen is scrollable so tall images are fine.
    const screenW = Dimensions.get('window').width;
    const maxW = screenW - 32;
    const imgAspect = source.imgW / source.imgH;
    const dispW = maxW;
    const dispH = maxW / imgAspect;

    // Initial crop covers ~80% of the displayed image, centred
    const margin = Math.min(dispW, dispH) * 0.1;
    const initRect = {
      x: margin,
      y: margin,
      w: dispW - margin * 2,
      h: dispH - margin * 2,
    };

    // Sync refs so PanResponder reads correct values immediately
    cropRef.current = { rect: initRect, display: { w: dispW, h: dispH } };

    setCropSource(source);
    setCropRect(initRect);
    setShowCrop(true);
  };

  /**
   * Confirms the crop: maps display-space crop coordinates to actual image
   * pixels, performs the crop via expo-image-manipulator, then sends the
   * result to the AI solver.
   */
  const confirmCrop = async () => {
    if (!cropSource) return;

    const { w: dispW, h: dispH } = cropRef.current.display;
    const r = cropRef.current.rect;

    // Map display coordinates to actual image pixel coordinates
    const scaleX = cropSource.imgW / dispW;
    const scaleY = cropSource.imgH / dispH;

    setShowCrop(false);
    setLoading(true);
    setSolution(null);

    try {
      // Crop the image to the selected region
      const result = await manipulateAsync(
        cropSource.uri,
        [{
          crop: {
            originX: Math.round(r.x * scaleX),
            originY: Math.round(r.y * scaleY),
            width: Math.round(r.w * scaleX),
            height: Math.round(r.h * scaleY),
          },
        }],
        { base64: true, format: SaveFormat.JPEG, compress: 0.8 },
      );

      // Show the cropped image as preview
      setImage(result.uri);
      // Send the cropped base64 data to the AI solver
      await processBase64(result.base64, 'image/jpeg');
    } catch (e) {
      Alert.alert('Crop Error', 'Failed to crop image: ' + e.message);
      // Fall back to the uncropped image so the user's photo isn't wasted
      setImage(cropSource.uri);
      await processBase64(cropSource.base64, cropSource.mimeType);
    }

    setLoading(false);
  };

  /** Cancels the crop and returns to the scan view, discarding the capture. */
  const cancelCrop = () => {
    setShowCrop(false);
    setCropSource(null);
  };

  // ── Camera & Gallery handlers ──────────────────────────────────────────

  /**
   * Captures a photo using the device camera, saves the original to the
   * device gallery, then opens the crop screen for region selection.
   */
  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      // base64:true requests the raw data alongside the URI so we don't need
      // a separate file-read step (expo-file-system caused crashes on some devices)
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setShowCamera(false);

      // Save the original camera photo to the device gallery
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        }
      } catch (saveErr) {
        // Non-fatal: gallery save failure shouldn't block the crop/solve flow
        console.warn('Could not save to gallery:', saveErr.message);
      }

      // Open the crop screen instead of processing the image immediately
      initCrop({
        uri: photo.uri,
        base64: photo.base64,
        mimeType: 'image/jpeg',
        fromCamera: true,
        imgW: photo.width,
        imgH: photo.height,
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to take picture: ' + e.message);
    }
  };

  /**
   * Opens the device gallery for image selection, then transitions to
   * the crop screen. Gallery picks are not saved again (already in gallery).
   */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true, // same reason as camera — avoids a separate file read
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Open the crop screen — no gallery save needed for picks
      initCrop({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: 'image/jpeg',
        fromCamera: false,
        imgW: asset.width,
        imgH: asset.height,
      });
    }
  };

  /**
   * Sends base64 image data to the configured AI provider for solving.
   * @param {string} base64 - Base64-encoded image data.
   * @param {string} mimeType - MIME type (e.g., 'image/jpeg').
   */
  const processBase64 = async (base64, mimeType) => {
    // Guard against attempting a network call when there is no API key —
    // avoids a cryptic network error being shown to the user
    if (!(await isApiKeySet())) {
      Alert.alert('API Key Required', 'Go to the Settings tab to configure your AI provider.');
      return;
    }
    if (!base64) {
      Alert.alert('Error', 'Could not get image data. Try again.');
      return;
    }
    setLoading(true);
    setSolution(null);
    try {
      const res = await solveFromImage(base64, mimeType);
      if (res.success) {
        setSolution(res.solution);
      } else {
        Alert.alert('Error', res.error);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to process image: ' + e.message);
    }
    setLoading(false);
  };

  /**
   * Solves an expression using AI with a custom instruction prompt.
   * Combines expression + aiPrompt into one message so the AI knows what
   * operation the user wants — sending a bare expression with no instruction
   * often produces generic or unhelpful responses.
   */
  const solveAI = async () => {
    if (!expression.trim()) {
      Alert.alert('Error', 'Please enter an expression');
      return;
    }
    if (!(await isApiKeySet())) {
      Alert.alert('API Key Required', 'Go to the Settings tab to configure your AI provider.');
      return;
    }
    setLoading(true);
    setSolution(null);
    try {
      let message = '';
      if (aiPrompt.trim()) {
        // Structured format makes it unambiguous to the AI what is the formula
        // vs what is the instruction
        message = `Expression: ${expression}\n\nInstruction: ${aiPrompt.trim()}`;
      } else {
        message = expression;
      }
      const res = await solveFromText(message);
      if (res.success) {
        setSolution(res.solution);
      } else {
        Alert.alert('Error', res.error);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to solve: ' + e.message);
    }
    setLoading(false);
  };

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════

  // AI Solve mode UI — rendered as an early return so the camera-related state
  // (showCamera, permission) is never evaluated for this branch.
  // Root View wraps ScrollView + MathKeyboard so the keyboard sits outside the
  // scroll area (same pattern as SolverScreen).
  if (mode === 'ai-solve') {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
        <ScrollView
          style={s.container}
          // When the math keyboard is open use tight padding; otherwise leave
          // generous room above the system keyboard for the prompt field
          contentContainerStyle={{ paddingBottom: showMathKeyboard ? 20 : 300 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <View style={s.modeRow}>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'scan' && s.modeBtnActive]}
              onPress={() => setMode('scan')}
            >
              <Text style={[s.modeBtnText, mode === 'scan' && s.modeBtnTextActive]}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'ai-solve' && s.modeBtnActive]}
              onPress={() => setMode('ai-solve')}
            >
              <Text style={[s.modeBtnText, mode === 'ai-solve' && s.modeBtnTextActive]}>Text Solve</Text>
            </TouchableOpacity>
          </View>

          {/* Expression field uses the scientific MathKeyboard, matching SolverScreen */}
          <Text style={s.label}>Expression:</Text>
          <TouchableOpacity
            style={s.exprInputBtn}
            onPress={() => { setShowMathKeyboard(true); Keyboard.dismiss(); }}
          >
            <Text style={[s.inputText, !expression && { color: '#555' }]}>
              {expression || 'Tap to enter expression...'}
            </Text>
          </TouchableOpacity>

          {/* Live KaTeX preview — same pattern as SolverScreen */}
          {expression.length > 0 && (() => {
            const latex = toLatex(expression);
            return (
              <>
                <Text style={s.label}>Preview:</Text>
                <View style={s.previewBox}>
                  {latex
                    ? <MathRenderer content={`$${latex}$`} compact />
                    : <MathDisplay latex={exprToLatex(expression)} style={{ height: 44 }} />
                  }
                </View>
              </>
            );
          })()}

          {/* Prompt field uses the regular system keyboard.
              onFocus hides the math keyboard so both keyboards don't show at once. */}
          <Text style={s.label}>What should the AI do?</Text>
          <TextInput
            style={s.aiPromptInput}
            value={aiPrompt}
            onChangeText={setAiPrompt}
            placeholder="e.g. Integrate this, Find the limit as x→0, Solve step by step..."
            placeholderTextColor="#555"
            multiline
            textAlignVertical="top"
            onFocus={() => setShowMathKeyboard(false)}
          />

          <TouchableOpacity style={s.solveBtn} onPress={solveAI} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.solveBtnText}>Solve</Text>}
          </TouchableOpacity>

          {/* AI prompt suggestions — tap to fill the instruction field */}
          <Text style={s.exLabel}>Common instructions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {[
              { label: 'Integrate', text: 'Integrate this expression step by step' },
              { label: 'Derivative', text: 'Find the derivative and simplify' },
              { label: 'Limit →0', text: 'Find the limit as x approaches 0' },
              { label: 'Limit →∞', text: 'Find the limit as x approaches infinity' },
              { label: 'Optimize', text: 'Find all critical points, classify each as min/max, and find inflection points' },
              { label: 'Explain', text: 'Explain what this expression represents and its key properties' },
            ].map(item => (
              <TouchableOpacity key={item.label} style={s.aiSugBtn} onPress={() => setAiPrompt(item.text)}>
                <Text style={s.aiSugBtnText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {solution && (
            <View style={s.solutionBox}>
              <Text style={s.solutionTitle}>Solution</Text>
              <MathRenderer content={solution} />
            </View>
          )}
        </ScrollView>

        {/* Scientific keyboard overlay — outside the ScrollView so it pins to the
            bottom of the screen rather than scrolling with content */}
        {showMathKeyboard && (
          <View>
            <View style={s.kbHeader}>
              <Text style={s.kbLabel}>Expression</Text>
              <TouchableOpacity onPress={() => setShowMathKeyboard(false)}>
                <Text style={s.kbDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <MathKeyboard
              value={expression}
              onChangeText={setExpression}
              onHint={(msg) => Alert.alert('Tip', msg)}
              layout="ai-solve"
            />
          </View>
        )}
      </View>
    );
  }

  // ── Crop screen ────────────────────────────────────────────────────────
  // Shown after the user captures or selects an image. Displays the image
  // with a draggable/resizable rectangular crop overlay. The user adjusts
  // the crop area then taps "Crop & Send" to submit to AI.
  if (showCrop && cropSource) {
    // Calculate displayed image dimensions (fit screen width, preserve aspect ratio).
    // No max-height cap — a ScrollView wraps the content so tall images remain
    // fully visible and the action buttons stay reachable by scrolling.
    const screenW = Dimensions.get('window').width;
    const maxW = screenW - 32;
    const imgAspect = cropSource.imgW / cropSource.imgH;
    const dispW = maxW;
    const dispH = maxW / imgAspect;

    return (
      <View style={s.cropContainer}>
        {/* ScrollView makes the crop screen scrollable so that tall/portrait
            images don't push the action buttons off the bottom of the screen */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title bar */}
          <View style={s.cropTitleBar}>
            <Text style={s.cropTitle}>Crop Image</Text>
            <Text style={s.cropHint}>Drag to move, drag corners to resize</Text>
          </View>

          {/* Image + crop overlay area */}
          <View style={[s.cropImageArea, { width: dispW, height: dispH }]}>
            {/* Layer 1: The source image */}
            <Image
              source={{ uri: cropSource.uri }}
              style={{ width: dispW, height: dispH, borderRadius: 8 }}
              resizeMode="cover"
            />

            {/* Layer 2: Semi-transparent dark overlay outside the crop rectangle.
                Four separate views form the border around the clear crop window. */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {/* Top overlay */}
              <View style={[s.cropOverlay, { top: 0, left: 0, right: 0, height: cropRect.y }]} />
              {/* Bottom overlay */}
              <View style={[s.cropOverlay, { bottom: 0, left: 0, right: 0, height: dispH - cropRect.y - cropRect.h }]} />
              {/* Left overlay */}
              <View style={[s.cropOverlay, { top: cropRect.y, left: 0, width: cropRect.x, height: cropRect.h }]} />
              {/* Right overlay */}
              <View style={[s.cropOverlay, { top: cropRect.y, right: 0, width: dispW - cropRect.x - cropRect.w, height: cropRect.h }]} />
            </View>

            {/* Layer 3: Crop rectangle border and corner handles (visual only) */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {/* Crop border */}
              <View style={[s.cropBorder, {
                left: cropRect.x, top: cropRect.y,
                width: cropRect.w, height: cropRect.h,
              }]} />

              {/* Rule-of-thirds grid lines inside the crop area */}
              <View style={[s.cropGridH, { left: cropRect.x, top: cropRect.y + cropRect.h / 3, width: cropRect.w }]} />
              <View style={[s.cropGridH, { left: cropRect.x, top: cropRect.y + (cropRect.h * 2) / 3, width: cropRect.w }]} />
              <View style={[s.cropGridV, { left: cropRect.x + cropRect.w / 3, top: cropRect.y, height: cropRect.h }]} />
              <View style={[s.cropGridV, { left: cropRect.x + (cropRect.w * 2) / 3, top: cropRect.y, height: cropRect.h }]} />

              {/* Corner handles — white circles at each corner for resize affordance */}
              {[
                [cropRect.x, cropRect.y],                         // TL
                [cropRect.x + cropRect.w, cropRect.y],            // TR
                [cropRect.x, cropRect.y + cropRect.h],            // BL
                [cropRect.x + cropRect.w, cropRect.y + cropRect.h], // BR
              ].map(([cx, cy], i) => (
                <View key={i} style={[s.cropCorner, { left: cx - 10, top: cy - 10 }]} />
              ))}
            </View>

            {/* Layer 4: Transparent touch surface — captures all pan gestures.
                Sits on top so it receives touches before any visual layer. */}
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
              {...cropPanResponder.panHandlers}
            />
          </View>

          {/* Bottom action buttons — inside the ScrollView so they're always
              reachable even when the image is taller than the screen */}
          <View style={s.cropBtnRow}>
            <TouchableOpacity style={s.cropCancelBtn} onPress={cancelCrop}>
              <Text style={s.cropCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cropConfirmBtn} onPress={confirmCrop}>
              <Text style={s.cropConfirmText}>Crop & Send</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  /*
   * Camera view — this block is guarded by `if (showCamera)` so it only
   * renders when the user has explicitly tapped "Take Photo". Without this
   * guard the CameraView would mount immediately on screen load, blocking the
   * default scan UI entirely and making "From Gallery" unreachable.
   */
  if (showCamera) {
    // Check permission only when the camera is actually about to be shown;
    // requesting early would trigger the OS prompt before the user asks for it
    if (!permission?.granted) {
      return (
        <View style={s.container}>
          <Text style={s.text}>Camera permission is needed to scan problems.</Text>
          <TouchableOpacity style={s.btn} onPress={requestPermission}>
            <Text style={s.btnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        {/* Overlay sits above the live preview — scan frame guides the user */}
        <View style={s.cameraControlsOverlay}>
          <View style={s.scanFrame} />
          <Text style={s.scanHint}>Position the math problem inside the frame</Text>
          <View style={s.cameraControls}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCamera(false)}>
              <Text style={s.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.captureBtn} onPress={takePicture}>
              <View style={s.captureBtnInner} />
            </TouchableOpacity>
            {/* Spacer keeps the shutter button visually centred between Cancel and nothing */}
            <View style={{ width: 80 }} />
          </View>
        </View>
      </View>
    );
  }

  // Default scan view — shown when showCamera is false and mode is 'scan'
  return (
    // paddingBottom includes insets.bottom so content clears the gesture nav bar
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'scan' && s.modeBtnActive]}
          onPress={() => setMode('scan')}
        >
          <Text style={[s.modeBtnText, mode === 'scan' && s.modeBtnTextActive]}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'ai-solve' && s.modeBtnActive]}
          onPress={() => setMode('ai-solve')}
        >
          <Text style={[s.modeBtnText, mode === 'ai-solve' && s.modeBtnTextActive]}>Text Solve</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.title}>Math Scanner</Text>
      <Text style={s.subtitle}>Take a photo of a calculus problem and AI will solve it step by step.</Text>
      <View style={s.btnRow}>
        {/* setShowCamera(true) triggers the camera branch on next render */}
        <TouchableOpacity style={s.btn} onPress={() => setShowCamera(true)}>
          <Text style={s.btnIcon}>📸</Text>
          <Text style={s.btnText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { backgroundColor: '#0f3460' }]} onPress={pickImage}>
          <Text style={s.btnIcon}>🖼️</Text>
          <Text style={s.btnText}>From Gallery</Text>
        </TouchableOpacity>
      </View>
      {image && (
        <View style={s.imageContainer}>
          <Image source={{ uri: image }} style={s.previewImage} resizeMode="contain" />
          <TouchableOpacity style={s.retakeBtn} onPress={() => { setImage(null); setSolution(null); }}>
            <Text style={s.retakeBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading && (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={s.loadingText}>AI is solving your problem...</Text>
        </View>
      )}
      {solution && (
        <View style={s.solutionBox}>
          <Text style={s.solutionTitle}>Solution</Text>
          <MathRenderer content={solution} />
        </View>
      )}
      {/* API key warning — shown below the solution (if any) so it doesn't
          block the UI; it disappears automatically once the key is saved */}
      {!apiKeySet && (
        <View style={s.warningBox}>
          <Text style={s.warningTitle}>⚠️ API Key Not Set</Text>
          <Text style={s.warningText}>
            Go to the Settings tab to configure your AI provider and API key.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  modeRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#0f3460' },
  modeBtnActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  label: { color: '#888', fontSize: 13, marginBottom: 4, fontWeight: '600' },
  // TouchableOpacity that opens the scientific keyboard — mirrors SolverScreen's inputBtn
  exprInputBtn: { backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460', minHeight: 48, justifyContent: 'center' },
  inputText: { color: '#fff', fontSize: 15 },
  // KaTeX preview box below the expression input
  previewBox: { backgroundColor: '#0d1b2a', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460' },
  // Regular TextInput for the free-text AI instruction (uses system keyboard)
  aiPromptInput: { backgroundColor: '#16213e', color: '#fff', borderRadius: 10, padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#0f3460', marginBottom: 10, minHeight: 70, lineHeight: 20 },
  // Header bar above the scientific keyboard
  kbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#16213e' },
  kbLabel: { color: '#888', fontSize: 13 },
  kbDone: { color: '#e94560', fontSize: 15, fontWeight: '700' },
  solveBtn: { backgroundColor: '#e94560', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  solveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  exLabel: { color: '#555', fontSize: 11, marginBottom: 6 },
  aiSugBtn: { backgroundColor: '#1a2a4e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: '#0f3460' },
  aiSugBtnText: { color: '#7aa2f7', fontSize: 12, fontWeight: '600' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 20 },
  text: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  btn: { flex: 1, backgroundColor: '#e94560', borderRadius: 12, padding: 20, alignItems: 'center' },
  btnIcon: { fontSize: 28, marginBottom: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  imageContainer: { marginBottom: 16 },
  previewImage: { width: '100%', height: 250, borderRadius: 12, backgroundColor: '#16213e' },
  retakeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  retakeBtnText: { color: '#fff', fontSize: 13 },
  loadingBox: { alignItems: 'center', paddingVertical: 30 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  solutionBox: { backgroundColor: '#16213e', borderRadius: 12, padding: 16 },
  solutionTitle: { color: '#e94560', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  warningBox: { backgroundColor: '#2a1a1a', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#e94560' },
  warningTitle: { color: '#e94560', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  warningText: { color: '#ccc', fontSize: 13, lineHeight: 22 },
  cameraControlsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 300, height: 200, borderWidth: 2, borderColor: '#e94560', borderRadius: 12 },
  scanHint: { color: '#fff', marginTop: 16, fontSize: 14, textShadowColor: '#000', textShadowRadius: 4 },
  cameraControls: { position: 'absolute', bottom: 40, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  // ── Crop screen styles ───────────────────────────────────────────────
  // Full-screen dark container for the crop overlay
  cropContainer: { flex: 1, backgroundColor: '#0a0a1a', alignItems: 'center', justifyContent: 'space-between' },
  cropTitleBar: { paddingTop: 50, paddingBottom: 12, alignItems: 'center' },
  cropTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cropHint: { color: '#888', fontSize: 12, marginTop: 4 },
  // Wrapper around the image + overlay layers
  cropImageArea: { alignSelf: 'center', position: 'relative', borderRadius: 8, overflow: 'hidden' },
  // Semi-transparent black overlay outside the crop window
  cropOverlay: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  // White border marking the crop rectangle
  cropBorder: { position: 'absolute', borderWidth: 2, borderColor: '#fff' },
  // Rule-of-thirds grid lines (thin, semi-transparent)
  cropGridH: { position: 'absolute', height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  cropGridV: { position: 'absolute', width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  // White circle at each corner — visual affordance for resizing
  cropCorner: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e94560' },
  // Action button row at the bottom of the crop screen
  cropBtnRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingTop: 20, width: '100%' },
  cropCancelBtn: { flex: 1, backgroundColor: '#16213e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#0f3460' },
  cropCancelText: { color: '#888', fontSize: 16, fontWeight: '600' },
  cropConfirmBtn: { flex: 1, backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center' },
  cropConfirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
