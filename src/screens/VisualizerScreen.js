/**
 * @file VisualizerScreen.js
 * @description Interactive function plotter using HTML5 Canvas in a WebView.
 * Features HiDPI rendering, smart axis ticks (niceStep), critical/inflection
 * point markers with glow, tangent line overlay, and MathKeyboard input.
 *
 * @requires react-native-webview
 * @requires ../services/mathSolver
 * @requires ../components/MathDisplay
 * @requires ../components/MathKeyboard
 *
 * @changelog
 * - Initial Canvas-based plotter
 * - Added devicePixelRatio scaling for HiDPI sharp rendering
 * - Added niceStep() for clean axis tick intervals (1, 2, 5, 10 multiples)
 * - Added clipping region to prevent curve bleeding into axis padding
 * - Changed xMin/xMax/tangentX from TouchableOpacity to TextInput (was not editable)
 * - Fixed graph label overlap with vertical staggering (index * 18px offset)
 * - Switched info panel from WebView to native MathInfoBlock
 * - Added MathKeyboard for expression input
 * - Quick examples use unicode labels instead of raw LaTeX
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Keyboard, useWindowDimensions,
} from 'react-native';
// useSafeAreaInsets provides the bottom inset to clear the gesture navigation bar
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { generatePlotData, findCriticalPoints, classifyCriticalPoints, findInflectionPoints, tangentLineAt, computeDerivative, computeSecondDerivative, toLatex } from '../services/mathSolver';
import MathDisplay, { exprToLatex, MathInfoBlock } from '../components/MathDisplay';
// MathRenderer renders the live KaTeX preview (same as SolverScreen)
import MathRenderer from '../components/MathRenderer';
import MathKeyboard from '../components/MathKeyboard';

/**
 * Generates a self-contained HTML document with Canvas-based function plot.
 * Uses devicePixelRatio for HiDPI, niceStep for axis ticks, clipping for bounds.
 * @param {string} expr - Function expression for title display.
 * @param {Array} plotData - Array of {x, y} points.
 * @param {Array} criticalPts - Classified critical points.
 * @param {Array} inflectionPts - Inflection point coordinates.
 * @param {Object|null} tangent - Tangent line data or null.
 * @param {number} xMin - Left x boundary.
 * @param {number} xMax - Right x boundary.
 * @returns {string} Complete HTML document string.
 */
function buildPlotHTML(expr, plotData, criticalPts, inflectionPts, tangent, xMin, xMax) {
  const yValues = plotData.map(p => p.y);
  const sorted = [...yValues].sort((a, b) => a - b);
  const p5 = sorted[Math.floor(sorted.length * 0.03)] || -10;
  const p95 = sorted[Math.floor(sorted.length * 0.97)] || 10;
  const yPad = (p95 - p5) * 0.15 || 1;
  const yMin = p5 - yPad;
  const yMax = p95 + yPad;
  const cpMarkers = criticalPts.map(cp =>
    `{x:${cp.x},y:${cp.y},type:"${cp.type}",color:"${cp.type.includes('Min') ? '#00ff88' : cp.type.includes('Max') ? '#ff4444' : '#ffaa00'}"}`
  ).join(',');
  const ipMarkers = inflectionPts.map(ip => `{x:${ip.x},y:${ip.y}}`).join(',');
  let tangentLine = 'null';
  if (tangent) tangentLine = `{slope:${tangent.slope},yInt:${tangent.yIntercept},ax:${tangent.ax}}`;
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}body{background:#0d1b2a;overflow:hidden}canvas{display:block;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas>
<script>
const dpr=window.devicePixelRatio||1;
const W=window.innerWidth,H=window.innerHeight;
const c=document.getElementById('c');
c.width=W*dpr;c.height=H*dpr;
c.style.width=W+'px';c.style.height=H+'px';
const ctx=c.getContext('2d');
ctx.scale(dpr,dpr);
const data=${JSON.stringify(plotData)};
const cps=[${cpMarkers}];
const ips=[${ipMarkers}];
const tangent=${tangentLine};
const xMin=${xMin},xMax=${xMax},yMin=${yMin.toFixed(6)},yMax=${yMax.toFixed(6)};
const PAD={l:44,r:16,t:28,b:28};
function tx(x){return PAD.l+((x-xMin)/(xMax-xMin))*(W-PAD.l-PAD.r)}
function ty(y){return(H-PAD.b)-((y-yMin)/(yMax-yMin))*(H-PAD.t-PAD.b)}
function niceStep(range,maxTicks){const rough=range/maxTicks;const mag=Math.pow(10,Math.floor(Math.log10(rough)));const res=rough/mag;let nice;if(res<=1.5)nice=1;else if(res<=3)nice=2;else if(res<=7)nice=5;else nice=10;return nice*mag}
const xStep=niceStep(xMax-xMin,8);const yStep=niceStep(yMax-yMin,6);
ctx.textAlign='center';ctx.textBaseline='top';
for(let x=Math.ceil(xMin/xStep)*xStep;x<=xMax;x+=xStep){const px=tx(x);if(px<PAD.l||px>W-PAD.r)continue;ctx.strokeStyle='#152238';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,PAD.t);ctx.lineTo(px,H-PAD.b);ctx.stroke();ctx.fillStyle='#556';ctx.font='11px system-ui';ctx.fillText(parseFloat(x.toFixed(4)),px,H-PAD.b+4)}
ctx.textAlign='right';ctx.textBaseline='middle';
for(let y=Math.ceil(yMin/yStep)*yStep;y<=yMax;y+=yStep){const py=ty(y);if(py<PAD.t||py>H-PAD.b)continue;ctx.strokeStyle='#152238';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(PAD.l,py);ctx.lineTo(W-PAD.r,py);ctx.stroke();ctx.fillStyle='#556';ctx.font='11px system-ui';ctx.fillText(parseFloat(y.toFixed(4)),PAD.l-4,py)}
ctx.strokeStyle='#445';ctx.lineWidth=1;
if(yMin<=0&&yMax>=0){ctx.beginPath();ctx.moveTo(PAD.l,ty(0));ctx.lineTo(W-PAD.r,ty(0));ctx.stroke()}
if(xMin<=0&&xMax>=0){ctx.beginPath();ctx.moveTo(tx(0),PAD.t);ctx.lineTo(tx(0),H-PAD.b);ctx.stroke()}
ctx.save();ctx.beginPath();ctx.rect(PAD.l,PAD.t,W-PAD.l-PAD.r,H-PAD.t-PAD.b);ctx.clip();
if(tangent){ctx.strokeStyle='rgba(255,170,0,0.6)';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);const ly1=tangent.slope*xMin+tangent.yInt,ly2=tangent.slope*xMax+tangent.yInt;ctx.beginPath();ctx.moveTo(tx(xMin),ty(ly1));ctx.lineTo(tx(xMax),ty(ly2));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffaa00';ctx.beginPath();const tpy=tangent.slope*tangent.ax+tangent.yInt;ctx.arc(tx(tangent.ax),ty(tpy),5,0,Math.PI*2);ctx.fill()}
ctx.strokeStyle='#e94560';ctx.lineWidth=2;ctx.beginPath();let started=false;
for(const p of data){const px=tx(p.x),py=ty(p.y);if(py<PAD.t-200||py>H-PAD.b+200){started=false;continue}if(!started){ctx.moveTo(px,py);started=true}else ctx.lineTo(px,py)}ctx.stroke();
for(let i=0;i<cps.length;i++){const cp=cps[i];const cx=tx(cp.x),cy=ty(cp.y);if(cy<PAD.t-20||cy>H-PAD.b+20)continue;ctx.shadowColor=cp.color;ctx.shadowBlur=12;ctx.fillStyle=cp.color;ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;const lbl=cp.type.replace('Local ','')+'  ('+cp.x.toFixed(2)+', '+cp.y.toFixed(2)+')';ctx.font='bold 11px system-ui';const tw=ctx.measureText(lbl).width;  let lx=cx+12,ly=cy-14-i*18;
if(lx+tw>W-PAD.r)lx=cx-tw-12;if(ly<PAD.t+10)ly=cy+14+i*18;ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(lx-3,ly-11,tw+6,16);ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(lbl,lx,ly-3)}
for(const ip of ips){const ix=tx(ip.x),iy=ty(ip.y);if(iy<PAD.t||iy>H-PAD.b)continue;ctx.fillStyle='#00aaff';ctx.beginPath();ctx.arc(ix,iy,4,0,Math.PI*2);ctx.fill()}
ctx.restore();
ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font='12px system-ui';ctx.textAlign='left';ctx.textBaseline='top';
ctx.fillText('f(x) = ${expr.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',PAD.l+4,6);
</script></body></html>`;
}

/*
 * Each example pre-fills ALL four input fields so clicking one gives an
 * immediately plottable state. tangentX '' means no tangent line.
 * Values are chosen to show each function's most interesting features.
 */
const EXAMPLES = [
  { label: 'x³−3x+2',   expr: 'x^3 - 3*x + 2',   xMin: '-3',    xMax: '3',    tangentX: '0'  },
  { label: 'sin(x)',     expr: 'sin(x)',             xMin: '-6.28', xMax: '6.28', tangentX: '0'  },
  { label: 'e^{-x²}',   expr: 'e^(-x^2)',           xMin: '-3',    xMax: '3',    tangentX: '1'  },
  { label: '1/(1+x²)',  expr: '1/(1+x^2)',           xMin: '-5',    xMax: '5',    tangentX: '1'  },
  { label: 'ln(x)',      expr: 'log(x)',              xMin: '0.1',   xMax: '10',   tangentX: '1'  },
  { label: 'x⁴−8x²+3', expr: 'x^4 - 8*x^2 + 3',   xMin: '-3',    xMax: '3',    tangentX: '2'  },
];

/** @returns {React.ReactElement} Visualizer screen with plot, controls, info panel. */
export default function VisualizerScreen() {
  // Bottom inset ensures the info panel and keyboard don't overlap the gesture nav bar
  const insets = useSafeAreaInsets();
  // width drives the graph height so it stays square and never gets squished
  const { width } = useWindowDimensions();
  const [expr, setExpr] = useState('x^3 - 3*x + 2');
  const [xMin, setXMin] = useState('-3');
  const [xMax, setXMax] = useState('3');
  const [tangentX, setTangentX] = useState('0');
  const [plotHtml, setPlotHtml] = useState(null);
  const [info, setInfo] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const plot = () => {
    setShowKeyboard(false);
    try {
      const minVal = parseFloat(xMin) || -5;
      const maxVal = parseFloat(xMax) || 5;
      const data = generatePlotData(expr, 'x', minVal, maxVal, 800);
      if (data.length === 0) { Alert.alert('Error', 'No valid points.'); return; }
      const cps = findCriticalPoints(expr, 'x', minVal, maxVal);
      const classified = classifyCriticalPoints(expr, cps, 'x');
      const inflections = findInflectionPoints(expr, 'x', minVal, maxVal);
      let tangent = null;
      if (tangentX.trim() !== '') {
        const a = parseFloat(tangentX);
        if (!isNaN(a)) tangent = { ...tangentLineAt(expr, 'x', a), ax: a };
      }
      setPlotHtml(buildPlotHTML(expr, data, classified, inflections, tangent, minVal, maxVal));
      const lines = [
        { key: 'fp', label: "f'(x) = ", latex: exprToLatex(computeDerivative(expr, 'x')), color: '#aaa' },
        { key: 'fpp', label: "f''(x) = ", latex: exprToLatex(computeSecondDerivative(expr, 'x')), color: '#aaa' },
      ];
      classified.forEach((cp, i) => {
        lines.push({ key: `cp${i}`, label: `${cp.type}: `, latex: `(${cp.x},\\; ${cp.y})`, color: cp.type.includes('Min') ? '#00ff88' : '#ff4444' });
      });
      inflections.forEach((ip, i) => {
        lines.push({ key: `ip${i}`, label: 'Inflection: ', latex: `(${ip.x},\\; ${ip.y})`, color: '#00aaff' });
      });
      if (tangent) {
        lines.push({ key: 'tan', label: 'Tangent: ', latex: exprToLatex(tangent.equation), color: '#ffaa00' });
      }
      setInfo(lines);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const reset = () => { setExpr('x^3 - 3*x + 2'); setXMin('-3'); setXMax('3'); setTangentX('0'); setPlotHtml(null); setInfo(null); };

  // Graph height: square based on screen width minus horizontal margins.
  // Capped at 400 so tablets don't get an oversized plot.
  const plotHeight = Math.min(Math.round(width - 12), 400);

  return (
    // Outer View holds the scrollable area + keyboard so the keyboard stays pinned
    <View style={s.container}>
      {/*
        Everything above the keyboard (controls, graph, info panel) lives in a
        single ScrollView so no content is ever clipped or squished.
      */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: showKeyboard ? 8 : insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.controls}>
          {/* Expression input + KaTeX preview — matches SolverScreen layout */}
          <Text style={s.label}>f(x) =</Text>
          <TouchableOpacity style={s.inputBtn} onPress={() => { setShowKeyboard(true); Keyboard.dismiss(); }}>
            <Text style={[s.inputText, !expr && { color: '#555' }]}>{expr || 'Tap to enter f(x)...'}</Text>
          </TouchableOpacity>
          {/* Live KaTeX preview — falls back to MathDisplay while mid-edit */}
          {expr.length > 0 && (() => {
            const latex = toLatex(expr);
            return (
              <>
                <Text style={s.label}>Preview:</Text>
                <View style={s.previewBox}>
                  {latex
                    ? <MathRenderer content={`$${latex}$`} compact />
                    : <MathDisplay latex={exprToLatex(expr)} style={{ height: 44 }} />
                  }
                </View>
              </>
            );
          })()}
          <View style={s.row}>
            <View style={{ flex: 1 }}><Text style={s.label}>x min</Text><TextInput style={s.inputBtnSm} value={xMin} onChangeText={setXMin} keyboardType="numeric" placeholderTextColor="#555" /></View>
            <View style={{ flex: 1, marginLeft: 6 }}><Text style={s.label}>x max</Text><TextInput style={s.inputBtnSm} value={xMax} onChangeText={setXMax} keyboardType="numeric" placeholderTextColor="#555" /></View>
            <View style={{ flex: 1, marginLeft: 6 }}><Text style={s.label}>Tangent x=</Text><TextInput style={s.inputBtnSm} value={tangentX} onChangeText={setTangentX} keyboardType="numeric" placeholder="—" placeholderTextColor="#555" /></View>
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={s.plotBtn} onPress={plot}><Text style={s.plotBtnText}>Plot & Analyze</Text></TouchableOpacity>
            <TouchableOpacity style={s.resetBtn} onPress={reset}><Text style={s.resetBtnText}>↺</Text></TouchableOpacity>
          </View>
          {/* Quick examples: all fields pre-filled so a single tap is plot-ready */}
          <Text style={s.exLabel}>Quick examples:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {EXAMPLES.map(ex => (
              <TouchableOpacity
                key={ex.expr}
                style={s.exBtn}
                onPress={() => {
                  setExpr(ex.expr);
                  setXMin(ex.xMin);
                  setXMax(ex.xMax);
                  // Always update tangentX so stale values from a previous example
                  // don't carry over — '' means no tangent line
                  setTangentX(ex.tangentX);
                }}
              >
                <Text style={s.exBtnText}>{ex.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Graph box: fixed height derived from screen width so it never squishes.
            The WebView fills the height completely; overflow:hidden clips the corners. */}
        <View style={[s.plotBox, { height: plotHeight }]}>
          {plotHtml ? (
            <WebView source={{ html: plotHtml }} style={{ flex: 1, backgroundColor: '#0d1b2a' }} scrollEnabled={false} />
          ) : (
            <View style={s.ph}>
              <Text style={{ fontSize: 40 }}>📈</Text>
              <Text style={s.phText}>Enter a function and tap Plot & Analyze</Text>
            </View>
          )}
        </View>

        {/* Analysis panel scrolls below the graph — paddingBottom clears nav bar */}
        {info && <MathInfoBlock lines={info} style={[s.infoPanel, { paddingBottom: insets.bottom + 8 }]} />}
      </ScrollView>

      {/* Scientific keyboard pinned outside the ScrollView */}
      {showKeyboard && (
        <View>
          <View style={s.kbHeader}>
            <Text style={s.kbLabel}>f(x) =</Text>
            <TouchableOpacity onPress={() => setShowKeyboard(false)}><Text style={s.kbDone}>Done</Text></TouchableOpacity>
          </View>
          <MathKeyboard value={expr} onChangeText={setExpr} onHint={(msg) => Alert.alert('Tip', msg)} layout="visualizer" />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  controls: { padding: 10, paddingBottom: 4 },
  // previewBox no longer needs row layout — MathRenderer fills it vertically like SolverScreen
  previewBox: { backgroundColor: '#0d1b2a', borderRadius: 10, marginBottom: 4, borderWidth: 1, borderColor: '#0f3460' },
  label: { color: '#888', fontSize: 13, marginBottom: 4, fontWeight: '600' },
  inputBtn: { backgroundColor: '#16213e', borderRadius: 8, padding: 10, marginBottom: 4, borderWidth: 1, borderColor: '#0f3460' },
  inputBtnSm: { color: '#fff', backgroundColor: '#16213e', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#0f3460' },
  inputText: { color: '#fff', fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 4 },
  btnRow: { flexDirection: 'row', marginBottom: 4, gap: 6 },
  plotBtn: { flex: 1, backgroundColor: '#e94560', borderRadius: 8, padding: 11, alignItems: 'center' },
  plotBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resetBtn: { backgroundColor: '#0f3460', borderRadius: 8, padding: 11, paddingHorizontal: 16 },
  resetBtnText: { color: '#888', fontSize: 18 },
  exLabel: { color: '#555', fontSize: 11, marginBottom: 6 },
  exBtn: { backgroundColor: '#0f3460', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 6 },
  exBtnText: { color: '#aaa', fontSize: 12 },
  // height is applied dynamically via plotHeight so flex:1 is not needed here
  plotBox: { marginHorizontal: 6, marginBottom: 4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0d1b2a', borderWidth: 1, borderColor: '#0f3460' },
  ph: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  phText: { color: '#444', fontSize: 14, marginTop: 8 },
  infoPanel: { borderTopWidth: 1, borderTopColor: '#0f3460' },
  kbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#16213e' },
  kbLabel: { color: '#888', fontSize: 13, fontStyle: 'italic' },
  kbDone: { color: '#e94560', fontSize: 15, fontWeight: '700' },
});
