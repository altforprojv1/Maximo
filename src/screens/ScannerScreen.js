/**
 * @file ScannerScreen.js
 * @description Camera-based math problem scanner. Allows users to take a photo
 * or select from gallery, sends the base64 image to the configured AI provider,
 * and displays the step-by-step solution via MathRenderer (KaTeX).
 *
 * @requires expo-camera (CameraView)
 * @requires expo-image-picker
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
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { solveFromImage, isApiKeySet } from '../services/aiService';
import MathRenderer from '../components/MathRenderer';

/**
 * Scanner screen component. Provides camera and gallery access for
 * photographing math problems and submitting them to AI for solving.
 * @returns {React.ReactElement}
 */
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState(null);
  const cameraRef = useRef(null);
  const [apiKeySet, setApiKeySet] = useState(true);

  // Poll API key status every 3 seconds so warning disappears after saving in Settings
  React.useEffect(() => {
    isApiKeySet().then(setApiKeySet);
    const interval = setInterval(() => isApiKeySet().then(setApiKeySet), 3000);
    return () => clearInterval(interval);
  }, []);

  /** Captures a photo using the device camera and sends it for AI processing. */
  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setImage(photo.uri);
      setShowCamera(false);
      processBase64(photo.base64, 'image/jpeg');
    } catch (e) {
      Alert.alert('Error', 'Failed to take picture: ' + e.message);
    }
  };

  /** Opens the device gallery for image selection. */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processBase64(result.assets[0].base64, 'image/jpeg');
    }
  };

  /**
   * Sends base64 image data to the configured AI provider for solving.
   * @param {string} base64 - Base64-encoded image data.
   * @param {string} mimeType - MIME type (e.g., 'image/jpeg').
   */
  const processBase64 = async (base64, mimeType) => {
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

  // Camera view mode
  if (showCamera) {
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
            <View style={{ width: 80 }} />
          </View>
        </View>
      </View>
    );
  }

  // Default view with Take Photo / From Gallery buttons
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={s.title}>📷 Math Scanner</Text>
      <Text style={s.subtitle}>Take a photo of a calculus problem and AI will solve it step by step.</Text>
      <View style={s.btnRow}>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
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
});
