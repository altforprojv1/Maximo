/**
 * @file ZoomableSlide.js
 * @description Renders a cropped thumbnail of a BinderMATH lecture-slide image.
 * Tapping opens a full-screen modal where the slide can be pinched-to-zoom and
 * dragged to pan using React Native's built-in ScrollView zoom support — no
 * external gesture or animation library is required.
 *
 * Why no Reanimated / RNGH?
 *   react-native-reanimated v4 and react-native-gesture-handler v2 each require
 *   very specific native module wiring (TurboModule signatures) that can diverge
 *   from the Expo SDK / React Native version in use. Using ScrollView's native
 *   maximumZoomScale avoids the entire problem with equivalent UX on iOS, and
 *   graceful degradation on Android (full-size image is still shown; pinch zoom
 *   is a platform limitation of RN's ScrollView on Android, not this component).
 *
 * Thumbnail cropping:
 *   Most BinderMATH slides carry a decorative black vertical bar on their left
 *   edge (~65 px at native resolution). The thumbnail removes it by rendering the
 *   Image inside an overflow:hidden View with a negatively-offset Image — pure
 *   layout, no native crop needed. cropTop / cropBottom trim excess whitespace
 *   the same way.
 *
 * Modal:
 *   Shows the full uncropped slide (no overflow:hidden on the scroll content) so
 *   the user can zoom into any corner without the thumbnail viewport restricting
 *   them. The close button is an absolutely positioned overlay.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Intrinsic pixel dimensions shared by every BinderMATH_Page_NNN.jpg asset
const SLIDE_W = 1271;
const SLIDE_H = 720;

/**
 * @param {object} props
 * @param {object} props.image                    Slide descriptor from educationalContent
 * @param {any}    props.image.source             require()-path to the image asset
 * @param {string} [props.image.caption]          Short description below the thumbnail and in the modal
 * @param {number} [props.image.cropLeft=65]      Pixels to strip from the left edge (default removes decorative bar)
 * @param {number} [props.image.cropTop=0]        Pixels to strip from the top
 * @param {number} [props.image.cropBottom=0]     Pixels to strip from the bottom
 */
export default function ZoomableSlide({ image }) {
  const [visible, setVisible] = useState(false);
  // scrollRef is used to programmatically reset zoom when the modal closes
  const scrollRef = useRef(null);

  const {
    source,
    caption,
    cropLeft   = 65,
    cropTop    = 0,
    cropBottom = 0,
  } = image;

  // ── Thumbnail geometry ───────────────────────────────────────────────────
  // usefulW / usefulH: the content region after removing decorative chrome
  const usefulW = SLIDE_W - cropLeft;
  const usefulH = SLIDE_H - cropTop - cropBottom;

  // Scale the useful region to fill the card width (screen − 32 px card padding)
  const thumbW     = SCREEN_W - 32;
  const thumbScale = thumbW / usefulW;
  const thumbH     = Math.round(usefulH * thumbScale);

  // ── Modal geometry ───────────────────────────────────────────────────────
  // Show the full slide at screen width so the user can pan into every corner.
  // The ScrollView handles the pan; maximumZoomScale drives pinch-to-zoom on iOS.
  const modalImgW = SCREEN_W;
  const modalImgH = Math.round(SCREEN_W * (SLIDE_H / SLIDE_W));

  // Vertical offset centres the image in the available space between the header
  // (~80 px) and the hint row (~36 px) so the slide fills the viewport nicely
  const availableH      = SCREEN_H - 80 - 36;
  const verticalPadding = Math.max(0, Math.floor((availableH - modalImgH) / 2));

  /** Scroll back to origin and reset zoom before dismissing. */
  function handleClose() {
    if (scrollRef.current) {
      // zoomToRect is iOS-only; scrollTo resets position on both platforms
      scrollRef.current.scrollTo({ x: 0, y: 0, animated: false });
    }
    setVisible(false);
  }

  return (
    <View style={s.wrapper}>

      {/* ── Tappable thumbnail ─────────────────────────────────────────────
          overflow:hidden clips the Image to the "useful" region, removing the
          decorative left bar and any top/bottom whitespace specified by the
          crop parameters. The Image itself is larger than the container and
          is shifted with a negative offset so only the content area shows. */}
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.85}>
        <View style={[s.thumb, { width: thumbW, height: thumbH }]}>
          <Image
            source={source}
            style={{
              position: 'absolute',
              left:   -(cropLeft * thumbScale),
              top:    -(cropTop  * thumbScale),
              width:   SLIDE_W   * thumbScale,
              height:  SLIDE_H   * thumbScale,
            }}
          />
        </View>
        {caption ? <Text style={s.caption}>{caption}</Text> : null}
      </TouchableOpacity>

      {/* ── Full-screen modal ──────────────────────────────────────────────
          ScrollView with maximumZoomScale enables native pinch-to-zoom on iOS.
          On Android the image is shown at full width (pinch zoom is not
          supported by RN's ScrollView on Android) but scrolling still works. */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={s.modalBg}>

          {/* Header: caption on the left, ✕ on the right */}
          <View style={s.header}>
            <Text style={s.modalCaption} numberOfLines={2}>
              {caption ?? ''}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={s.closeBtn}
              hitSlop={12}
            >
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Zoom container — bouncesZoom gives a satisfying spring-back feel */}
          <ScrollView
            ref={scrollRef}
            style={s.scrollArea}
            contentContainerStyle={[
              s.scrollContent,
              { paddingVertical: verticalPadding },
            ]}
            // Native pinch-to-zoom on iOS; no-op on Android
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            bouncesZoom
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {/* Full uncropped slide — the user can zoom anywhere including the
                left bar; at 4× zoom even fine text becomes easily readable.  */}
            <Image
              source={source}
              style={{ width: modalImgW, height: modalImgH }}
              resizeMode="stretch"
            />
          </ScrollView>

          {/* Platform-aware hint so the instruction matches the device capability */}
          <Text style={s.hint}>
            {Platform.OS === 'ios'
              ? 'Pinch to zoom · drag to pan · double-tap to reset'
              : 'Scroll to pan · zoom supported on iOS'}
          </Text>

        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 12 },

  // White background so the slide always looks clean against the dark card
  thumb: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  caption: {
    color: '#888',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Full-screen dark backdrop
  modalBg: {
    flex: 1,
    backgroundColor: '#080808',
  },

  // Header row: left caption, right close button; padded below the status bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    height: 80,
  },
  modalCaption: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ScrollView takes all remaining space between header and hint
  scrollArea: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Subtle hint at the bottom — muted so it doesn't compete with the slide
  hint: {
    color: '#383838',
    fontSize: 11,
    textAlign: 'center',
    height: 36,
    lineHeight: 36,
  },
});
