/**
 * @file MathDisplay.js
 * @description Lightweight native math expression renderer. Converts math.js
 * output strings into human-readable unicode text using superscript characters,
 * special symbols, and function name formatting — all without WebView overhead.
 *
 * Exports three items:
 * - exprToDisplay(): string converter (math.js syntax → unicode display)
 * - MathDisplay: React component for rendering a single math expression
 * - MathInfoBlock: React component for rendering a list of labeled math lines
 *   (used by the Visualizer's analysis panel)
 *
 * Design decision: An earlier version used WebView + KaTeX for inline math
 * display. This caused severe performance issues on mobile (each WebView
 * instance is heavyweight). The current approach uses native React Native Text
 * with unicode superscripts, which renders instantly with zero loading time.
 * Full KaTeX rendering is reserved for AI output only (see MathRenderer.js).
 *
 * @changelog
 * - v1: WebView + KaTeX inline renderer (caused performance issues on mobile)
 * - v2: Replaced with native Text + unicode superscript mapping
 * - Added LaTeX command stripping (\\quad, \\;, \\text{}, \\approx, \\lim)
 *   to handle leftover LaTeX syntax from exprToLatex compatibility alias
 */

import React from 'react';
import { Text, View } from 'react-native';

/**
 * Unicode superscript character mapping for digits and common exponent chars.
 * Used by exprToDisplay to convert "x^2" → "x²", "x^10" → "x¹⁰", etc.
 * @constant {Object<string, string>}
 */
const supMap = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', 'n': 'ⁿ', 'x': 'ˣ' };

/**
 * Converts a math.js expression string into a human-readable unicode string.
 *
 * Handles: superscripts (^), multiplication (→ ·), function names (sqrt → √,
 * log → ln), constants (pi → π, Infinity → ∞), and strips leftover LaTeX
 * commands that may appear from the exprToLatex compatibility alias.
 *
 * @param {string} expr - math.js expression string.
 * @returns {string} Unicode-formatted display string.
 *
 * @example
 * exprToDisplay("x^3 - 3*x + 2")  // → "x³ - 3·x + 2"
 * exprToDisplay("e^x * sin(x)")    // → "eˣ·sin(x)"
 * exprToDisplay("sqrt(4)")         // → "√(4)"
 */
export function exprToDisplay(expr) {
  if (!expr || typeof expr !== 'string') return '';
  let s = expr;

  // Superscripts: x^(expr) → x⁽ᵉˣᵖʳ⁾, x^2 → x², x^n → xⁿ
  s = s.replace(/\^(\([^)]+\))/g, (_, inner) => {
    const content = inner.slice(1, -1);
    return '⁽' + content.replace(/./g, c => supMap[c] || c) + '⁾';
  });
  s = s.replace(/\^(\d+)/g, (_, digits) => digits.replace(/./g, c => supMap[c] || c));
  s = s.replace(/\^([a-z])/g, (_, c) => supMap[c] || '^' + c);

  // Multiplication: * → · (middle dot)
  s = s.replace(/\s*\*\s*/g, '·');

  // Function name replacements
  s = s.replace(/\bsqrt\(/g, '√(');
  s = s.replace(/\blog\(/g, 'ln(');
  s = s.replace(/\blog10\(/g, 'log₁₀(');
  s = s.replace(/\basin\(/g, 'arcsin(');
  s = s.replace(/\bacos\(/g, 'arccos(');
  s = s.replace(/\batan\(/g, 'arctan(');

  // Constants
  s = s.replace(/\bpi\b/g, 'π');
  s = s.replace(/\bInfinity\b/g, '∞');

  // Strip leftover LaTeX commands (from exprToLatex compatibility)
  s = s.replace(/\\quad/g, ',  ');
  s = s.replace(/\\;/g, ' ');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\lim_\{[^}]*\}/g, 'lim');
  s = s.replace(/\\approx/g, '≈');

  return s;
}

/**
 * Compatibility alias for exprToDisplay. Originally returned LaTeX strings
 * when a WebView renderer was used; now returns unicode display text.
 *
 * @param {string} expr - math.js expression string.
 * @returns {string} Unicode-formatted display string.
 */
export function exprToLatex(expr) {
  return exprToDisplay(expr);
}

/**
 * Native React component that renders a single math expression as styled Text.
 * No WebView, no loading delay — renders instantly.
 *
 * @param {Object} props
 * @param {string} props.latex - Expression to display (passed through exprToDisplay).
 * @param {Object} [props.style] - Additional View style overrides.
 * @param {boolean} [props.dark=true] - Whether to use light-on-dark color scheme.
 * @returns {React.ReactElement|null} Null if latex is empty.
 */
export default function MathDisplay({ latex, style, dark = true }) {
  const displayText = latex ? exprToDisplay(latex) : '';
  if (!displayText) return null;

  return (
    <View style={[{ paddingVertical: 6, paddingHorizontal: 8 }, style]}>
      <Text style={{ color: dark ? '#e0e0e0' : '#222', fontSize: 17, fontStyle: 'italic' }}>
        {displayText}
      </Text>
    </View>
  );
}

/**
 * Renders a vertical list of labeled math expressions using native Text.
 * Used by the Visualizer screen's analysis panel to show f'(x), f''(x),
 * critical points, and inflection points with color coding.
 *
 * @param {Object} props
 * @param {Array<{key: string, label: string, latex: string, color?: string}>} props.lines
 * @param {Object} [props.style] - Additional View style overrides.
 * @returns {React.ReactElement}
 */
export function MathInfoBlock({ lines, style }) {
  return (
    <View style={[{ backgroundColor: '#16213e', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#0f3460' }, style]}>
      {lines.map(l => (
        <Text key={l.key} style={{ color: l.color || '#aaa', fontSize: 13, marginBottom: 3 }}>
          <Text style={{ fontWeight: '700' }}>{l.label}</Text>
          <Text style={{ color: '#fff', fontStyle: 'italic' }}>{exprToDisplay(l.latex || '')}</Text>
        </Text>
      ))}
    </View>
  );
}
