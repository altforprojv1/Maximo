/**
 * @file MathRenderer.js
 * @description WebView-based rich math content renderer using KaTeX for LaTeX
 * notation. Used exclusively for rendering AI-generated solutions from the
 * Scanner and Solver (AI mode) screens, where the response may contain
 * inline/display LaTeX, step-by-step formatting, and markdown-style markup.
 *
 * The component generates a self-contained HTML document that:
 * 1. Converts markdown-style formatting (headers, bold, bullet lists)
 * 2. Wraps PROBLEM/Step/ANSWER sections in styled boxes
 * 3. Runs KaTeX auto-render to process LaTeX delimiters ($, $$, etc.)
 * 4. Measures its own scroll height and reports it to React Native so the
 *    parent View can size the WebView exactly (avoids scroll-in-scroll issues)
 *
 * Note: This is intentionally NOT used for simple inline math display
 * (see MathDisplay.js for that). WebView instances are heavyweight on mobile,
 * so we limit their use to complex AI output where KaTeX is truly needed.
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
 */

import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Renders AI-generated math solution content with full KaTeX LaTeX support.
 * Automatically sizes itself to fit the rendered content height.
 *
 * @param {Object} props
 * @param {string} props.content - Raw AI response text (may contain markdown,
 *   LaTeX delimiters, PROBLEM/Step/ANSWER markers).
 * @returns {React.ReactElement}
 */
export default function MathRenderer({ content }) {
  const { width } = useWindowDimensions();

  // Self-contained HTML document with KaTeX CSS/JS from CDN
  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #16213e;
    color: #ddd;
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.7;
    padding: 16px;
    word-wrap: break-word;
  }
  .katex { font-size: 1.1em; }
  .katex-display { margin: 12px 0; overflow-x: auto; padding: 4px 0; }
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

// Convert markdown-style formatting to HTML
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

// Wrap consecutive <li> elements in <ul>
html = html.replace(/(<li>.*?<\\/li>(<br>)?)+/g, (match) => {
  return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
});

document.getElementById('content').innerHTML = html;

// Run KaTeX auto-render on the content
renderMathInElement(document.getElementById('content'), {
  delimiters: [
    {left: '$$', right: '$$', display: true},
    {left: '$', right: '$', display: false},
    {left: '\\\\(', right: '\\\\)', display: false},
    {left: '\\\\[', right: '\\\\]', display: true},
  ],
  throwOnError: false
});

// Report content height to React Native (two passes for late-loading KaTeX)
setTimeout(() => {
  window.ReactNativeWebView.postMessage(JSON.stringify({height: document.body.scrollHeight}));
}, 600);
setTimeout(() => {
  window.ReactNativeWebView.postMessage(JSON.stringify({height: document.body.scrollHeight}));
}, 1500);
</script>
</body></html>`;

  const [webViewHeight, setWebViewHeight] = React.useState(400);

  return (
    <View style={{ height: webViewHeight, borderRadius: 12, overflow: 'hidden' }}>
      <WebView
        source={{ html }}
        style={{ backgroundColor: '#16213e' }}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.height) setWebViewHeight(Math.max(data.height + 20, 100));
          } catch (e) { /* ignore parse errors */ }
        }}
      />
    </View>
  );
}
