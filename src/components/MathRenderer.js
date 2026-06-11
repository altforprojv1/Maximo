/**
 * @file MathRenderer.js
 * @description WebView-based rich math content renderer using KaTeX for LaTeX
 * notation. Used for:
 *  - AI-generated solutions (Scanner and Solver screens): full markdown pipeline,
 *    PROBLEM/Step/ANSWER boxes, multi-line LaTeX
 *  - Educational content (TopicScreen theory and examples)
 *  - Quiz questions, options, and explanations (QuizScreen)
 *
 * The component generates a self-contained HTML document that:
 * 1. Converts markdown-style formatting (headers, bold, bullet lists)
 * 2. Wraps PROBLEM/Step/ANSWER sections in styled boxes
 * 3. Runs KaTeX auto-render to process LaTeX delimiters ($, $$, etc.)
 * 4. Measures its own scroll height and reports it to React Native so the
 *    parent View can size the WebView exactly (avoids scroll-in-scroll issues)
 *
 * The `transparent` prop is used for quiz option cells: the WebView background
 * is set to transparent so the parent TouchableOpacity's correct/incorrect
 * highlight colour shows through without reloading the WebView HTML.
 *
 * @requires react-native-webview
 * @requires KaTeX 0.16.9 (loaded from CDN)
 *
 * @changelog
 * - Initial implementation with basic markdown → HTML conversion
 * - Added KaTeX auto-render with multiple delimiter support
 * - Added PROBLEM box styling (blue left border)
 * - Added two-pass height measurement (600ms + 1500ms) to handle late KaTeX load
 * - Added bullet list wrapping (<li> → <ul>)
 * - Added `transparent` prop for quiz option cells (background shows through)
 * - Compact mode now starts at 60px initial height (was 400) to reduce layout pop
 */

import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Renders AI-generated math solution content with full KaTeX LaTeX support.
 * Automatically sizes itself to fit the rendered content height.
 *
 * @param {Object}  props
 * @param {string}  props.content - Raw AI response text (may contain markdown,
 *   LaTeX delimiters, PROBLEM/Step/ANSWER markers).
 * @param {boolean} [props.compact=false] - When true, reduces body padding,
 *   line-height, and display-math margins so the component fits inside a small
 *   inline preview box without excess whitespace. The default (false) is suited
 *   for full-width result panels where vertical breathing room helps readability.
 * @param {boolean} [props.transparent=false] - When true, the WebView body
 *   background is set to transparent and the React Native WebView layer is also
 *   transparent, so the parent View's background colour shows through. Used for
 *   quiz option cells where the background changes to green/red on selection.
 *   Requires androidLayerType="software" on Android (applied automatically).
 * @returns {React.ReactElement}
 */
export default function MathRenderer({ content, compact = false, transparent = false }) {
  const { width } = useWindowDimensions();

  /*
   * The entire HTML page is generated as a template string so it can be passed
   * directly to WebView's `source.html` prop — no server or file URI required.
   * KaTeX CSS/JS are loaded from CDN; the component therefore needs network
   * access to render LaTeX (gracefully degrades to plain text if offline).
   */
  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: ${transparent ? 'transparent' : '#16213e'};
    color: #ddd;
    font-family: -apple-system, system-ui, sans-serif;
    /* compact mode tightens these three values for use as an inline preview */
    font-size: ${compact ? '16px' : '15px'};
    line-height: ${compact ? '1.3' : '1.7'};
    padding: ${compact ? '8px 12px' : '16px'};
    word-wrap: break-word;
  }
  .katex { font-size: ${compact ? '1.2em' : '1.1em'}; }
  /* compact mode collapses the generous vertical space KaTeX adds around
     display-mode equations — important so the preview box stays short */
  .katex-display { margin: ${compact ? '2px 0' : '12px 0'}; overflow-x: auto; padding: 2px 0; }
  .katex-display > .katex { text-align: left; }
  h1, h2, h3 { color: #e94560; margin: 16px 0 8px 0; font-family: -apple-system, system-ui, sans-serif; }
  h1 { font-size: 20px; border-bottom: 1px solid #0f3460; padding-bottom: 4px; }
  h2 { font-size: 17px; }
  h3 { font-size: 15px; }
  strong, b { color: #fff; }
  p { margin: 6px 0; }
  .step {
    border-left: 3px solid #e94560;
    padding: 10px 14px;
    margin: 10px 0;
    background: rgba(15,52,96,0.4);
    border-radius: 0 10px 10px 0;
  }
  .step strong { color: #e94560; }
  .answer-box {
    background: rgba(233,69,96,0.12);
    border: 1.5px solid #e94560;
    border-radius: 10px;
    padding: 14px;
    margin: 14px 0;
  }
  .answer-box strong { color: #e94560; font-size: 16px; }
  .problem-box {
    background: rgba(0,170,255,0.08);
    border-left: 3px solid #00aaff;
    padding: 10px 14px;
    margin: 8px 0;
    border-radius: 0 8px 8px 0;
  }
  code { background: #0f3460; padding: 2px 6px; border-radius: 4px; color: #e94560; font-size: 13px; }
  ul, ol { padding-left: 20px; margin: 6px 0; }
  li { margin-bottom: 4px; }
</style>
</head><body>
<div id="content"></div>
<script>
const raw = ${JSON.stringify(content || '')};

// Convert markdown-style formatting to HTML before KaTeX runs, so that
// structural markers (##, **, Step N:) don't interfere with math parsing
let html = raw
  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
  .replace(/^# (.+)$/gm, '<h1>$1</h1>')
  .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
  .replace(/^(PROBLEM:?)(.*)$/gm, '<div class="problem-box"><strong>$1</strong>$2</div>')
  .replace(/^(Step \\d+:?)(.*)$/gm, '<div class="step"><strong>$1</strong>$2</div>')
  .replace(/^(ANSWER:?)(.*)$/gm, '<div class="answer-box"><strong>$1</strong>$2</div>')
  .replace(/^[•\\-] (.+)$/gm, '<li>$1</li>')
  .replace(/\\n/g, '<br>');

// Wrap consecutive <li> elements in a <ul> container.
// The regex matches runs of <li>...<br>? so that the <br> newline separators
// inserted above don't break up what should be a single list block.
html = html.replace(/(<li>.*?<\\/li>(<br>)?)+/g, (match) => {
  return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
});

document.getElementById('content').innerHTML = html;

// Run KaTeX auto-render on the content after the HTML is in the DOM.
// Multiple delimiter styles are supported so AI responses don't need to use
// a single consistent notation.
renderMathInElement(document.getElementById('content'), {
  delimiters: [
    {left: '$$', right: '$$', display: true},
    {left: '$', right: '$', display: false},
    {left: '\\\\(', right: '\\\\)', display: false},
    {left: '\\\\[', right: '\\\\]', display: true},
  ],
  throwOnError: false // render what we can; don't crash on malformed LaTeX
});

/*
 * Two-pass height reporting: KaTeX fonts load asynchronously from the CDN,
 * so document.body.scrollHeight is too small immediately after render.
 * The 600 ms pass captures most cases; the 1500 ms pass catches slow connections
 * where KaTeX hasn't finished by the first measurement. React Native resizes
 * the containing View on each message, so the second pass simply overwrites
 * the first if the height changed.
 */
setTimeout(() => {
  window.ReactNativeWebView.postMessage(JSON.stringify({height: document.body.scrollHeight}));
}, 600);
setTimeout(() => {
  window.ReactNativeWebView.postMessage(JSON.stringify({height: document.body.scrollHeight}));
}, 1500);
</script>
</body></html>`;

  /*
   * Initial height: compact mode uses 60px (one line of inline math ≈ 36–44px)
   * so the layout pop is minimal. Non-compact uses 400px as a generous default
   * for multi-paragraph theory/solution content.
   */
  const [webViewHeight, setWebViewHeight] = React.useState(compact ? 60 : 400);

  return (
    // overflow:hidden clips rounded corners — WebView ignores borderRadius on its own.
    // transparent mode has no rounding (parent card provides the border radius).
    <View style={{ height: webViewHeight, borderRadius: transparent ? 0 : 12, overflow: 'hidden' }}>
      <WebView
        source={{ html }}
        style={{ backgroundColor: transparent ? 'transparent' : '#16213e' }}
        // Disable WebView's own scroll; the parent ScrollView handles scrolling.
        // This prevents conflicting scroll gestures (scroll-in-scroll jank).
        scrollEnabled={false}
        // Software rendering is required on Android for transparent backgrounds;
        // hardware-accelerated layers don't support WebView transparency.
        androidLayerType={transparent ? 'software' : undefined}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            // +20px ensures the last line isn't clipped by the View boundary.
            // compact mode uses a 40px floor (single-line math ≈ 36–44px total)
            // so the card doesn't balloon to the non-compact 100px minimum.
            if (data.height) setWebViewHeight(Math.max(data.height + 20, compact ? 40 : 100));
          } catch (e) { /* ignore parse errors from non-height messages */ }
        }}
      />
    </View>
  );
}
