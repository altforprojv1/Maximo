/**
 * @file SolverScreen.js
 * @description Main problem-solving interface with four computation modes:
 * Derivative (symbolic via math.js), Optimize (critical points + classification),
 * Limit (numerical approximation), AI Solve (delegates to configured provider).
 * Uses MathKeyboard for input, MathDisplay for unicode output, MathRenderer for AI.
 *
 * @requires ../services/mathSolver
 * @requires ../services/aiService
 * @requires ../components/MathKeyboard
 * @requires ../components/MathDisplay
 * @requires ../components/MathRenderer
 *
 * @changelog
 * - Initial implementation with TextInput and system keyboard
 * - Added MathKeyboard with active field switching (expr/var/limit)
 * - Added MathDisplay preview showing live unicode rendering of typed expression
 * - Fixed empty variable crash: defaults to 'x' when variable field is empty
 * - Fixed quick examples: changed ex.tex to ex.label for button text
 * - Optimize output uses plain Text for critical points (avoids broken LaTeX)
 * - AI Solve uses Settings-based config instead of hardcoded key
 * - Added separate prompt field in AI Solve mode so users can specify what
 *   the AI should do with the expression (e.g., "integrate", "find the limit")
 *   instead of sending a bare formula with no instructions
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Keyboard,
} from 'react-native';
// useSafeAreaInsets provides the bottom inset to clear the gesture navigation bar
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// toLatex is used for the live KaTeX preview box; the others drive computation
import { analyzeFunction, computeDerivative, computeSecondDerivative, solveCalculusProblem, toLatex } from '../services/mathSolver';
// MathRenderer renders full KaTeX output (derivative / integrate results)
import MathRenderer from '../components/MathRenderer';
// exprToDisplay is imported so examples can stay as raw strings while still
// rendering in a human-readable form inside the preview box fallback
import MathDisplay, { exprToLatex, exprToDisplay } from '../components/MathDisplay';
import MathKeyboard from '../components/MathKeyboard';

/** @constant {Array<{key: string, label: string}>} Available computation modes. */
const MODES = [
  { key: 'derivative', label: '∂ Derivative' },
  { key: 'integrate', label: '∫ Integrate' },
  { key: 'optimize',  label: 'Optimize'    },
  { key: 'limit',     label: '→ Limit'     },
];

/*
 * Per-mode example sets. Each mode has its own array so the quick-example bar
 * only shows relevant expressions. Integrate examples include pre-filled bounds
 * so tapping an example immediately populates all required fields.
 */
const EXAMPLES = {
  derivative: [
    { raw: 'x^3 - 3*x + 2',       label: 'x³−3x+2'    },
    { raw: 'sin(x) * cos(x)',      label: 'sin·cos'     },
    { raw: 'e^x * x^2',            label: 'eˣ·x²'      },
    { raw: 'log(x) / x',           label: 'ln(x)/x'    },
    { raw: 'sqrt(x) * (x + 1)',    label: '√x·(x+1)'   },
    { raw: 'tan(x)^2',             label: 'tan²(x)'    },
  ],
  integrate: [
    { raw: 'x^2',         label: 'x²',          lower: '0',  upper: '3'  },
    { raw: 'sin(x)',      label: 'sin(x)',       lower: '0',  upper: '3.14159' },
    { raw: 'e^x',         label: 'eˣ',           lower: '0',  upper: '1'  },
    { raw: '1 / x',       label: '1/x',         lower: '1',  upper: '2.71828' },
    { raw: 'x^3 - 3*x',  label: 'x³−3x',       lower: '-1', upper: '2'  },
    { raw: 'cos(x)^2',   label: 'cos²(x)',      lower: '0',  upper: '3.14159' },
  ],
  optimize: [
    { raw: 'x^3 - 3*x + 2',        label: 'x³−3x+2'    },
    { raw: 'x^4 - 8*x^2 + 3',      label: 'x⁴−8x²+3'  },
    { raw: '-x^2 + 4*x - 1',       label: '−x²+4x−1'  },
    { raw: 'x^3 - 6*x^2 + 9*x',   label: 'x³−6x²+9x' },
    { raw: 'x^5 - 5*x^3',          label: 'x⁵−5x³'    },
    { raw: 'sin(x) + x / 2',       label: 'sin+x/2'    },
  ],
  limit: [
    { raw: 'sin(x) / x',             label: 'sin(x)/x', limitVal: '0'  },
    { raw: '(x^2 - 1) / (x - 1)',   label: '(x²−1)/(x−1)', limitVal: '1' },
    { raw: '(e^x - 1) / x',         label: '(eˣ−1)/x', limitVal: '0'  },
    { raw: 'x * sin(1 / x)',         label: 'x·sin(1/x)', limitVal: '0' },
    { raw: '(1 - cos(x)) / x^2',    label: '(1−cos)/x²', limitVal: '0' },
    { raw: 'log(x) / (x - 1)',      label: 'ln(x)/(x−1)', limitVal: '1' },
  ],
};

/**
 * Problem Solver screen component.
 * @returns {React.ReactElement}
 */
export default function SolverScreen() {
  // Bottom inset ensures scroll content never hides behind the gesture nav bar
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('derivative');
  const [expression, setExpression] = useState('');
  const [variable, setVariable] = useState('x');
  const [limitValue, setLimitValue] = useState('0');
  // Bounds are only used in integrate + definite mode
  const [lowerBound, setLowerBound] = useState('0');
  const [upperBound, setUpperBound] = useState('1');
  // isDefinite toggles between definite (numerical, requires bounds) and
  // indefinite (symbolic antiderivative, no bounds needed)
  const [isDefinite, setIsDefinite] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  // activeField tells the shared MathKeyboard which state variable to update
  const [activeField, setActiveField] = useState('expr'); // 'expr', 'var', 'limit', 'lower', 'upper'

  /** Routes keyboard input to the currently active field. */
  const handleKeyboardInput = (val) => {
    if (activeField === 'expr') setExpression(val);
    else if (activeField === 'var') setVariable(val);
    else if (activeField === 'limit') setLimitValue(val);
    else if (activeField === 'lower') setLowerBound(val);
    else if (activeField === 'upper') setUpperBound(val);
  };

  /** Returns the current value of the active input field. */
  const getActiveValue = () => {
    if (activeField === 'expr') return expression;
    if (activeField === 'var') return variable;
    if (activeField === 'limit') return limitValue;
    if (activeField === 'lower') return lowerBound;
    if (activeField === 'upper') return upperBound;
    return '';
  };

  /**
   * Returns the MathKeyboard layout appropriate for the active field.
   * - 'variable' : var field — only letter keys, no digits or operators
   * - 'numeric'  : limit value and integration bounds — number pad + constants
   * - 'expression': expression fields — full scientific keyboard
   */
  const getKeyboardLayout = () => {
    if (activeField === 'var') return 'variable';
    if (activeField === 'limit' || activeField === 'lower' || activeField === 'upper') return 'numeric';
    // Return the solver mode name directly — each mode has its own expression
    // layout in MathKeyboard (derivative, integrate, optimize, limit)
    return mode;
  };

  /**
   * Executes the selected computation mode. For 'ai' mode, combines the
   * expression and the user's prompt into a single message for the AI.
   * For math modes, defaults variable to 'x' if empty.
   */
  const solve = async () => {
    if (!expression.trim()) {
      Alert.alert('Error', 'Please enter an expression');
      return;
    }
    setLoading(true);
    setResult(null);
    setShowKeyboard(false);
    Keyboard.dismiss();

    try {
      if (mode === 'derivative') {
        const res = solveCalculusProblem('derivative', { expr: expression, variable: variable || 'x' });
        setResult({ type: 'derivative', data: res });
      } else if (mode === 'integrate') {
        if (isDefinite) {
          // Validate bounds before passing to the numerical integrator
          const a = parseFloat(lowerBound);
          const b = parseFloat(upperBound);
          if (isNaN(a) || isNaN(b)) throw new Error('Bounds must be valid numbers.');
          const res = solveCalculusProblem('integrate', { expr: expression, variable: variable || 'x', lower: a, upper: b, indefinite: false });
          setResult({ type: 'integrate', data: res });
        } else {
          // Indefinite mode: symbolic antiderivative, no bounds required
          const res = solveCalculusProblem('integrate', { expr: expression, variable: variable || 'x', indefinite: true });
          setResult({ type: 'integrate', data: res });
        }
      } else if (mode === 'optimize') {
        const res = analyzeFunction(expression, variable || 'x');
        setResult({ type: 'optimize', data: res });
      } else if (mode === 'limit') {
        const res = solveCalculusProblem('limit', { expr: expression, variable, value: parseFloat(limitValue) });
        setResult({ type: 'limit', data: res });
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not solve. Check your expression.');
    }
    setLoading(false);
  };

  /** Renders the result panel based on the computation type. */
  const renderResult = () => {
    if (!result) return null;

    if (result.type === 'ai') {
      return (
        <View style={s.resultBox}>
          <Text style={s.resultTitle}>AI Solution</Text>
          <MathRenderer content={result.text} />
        </View>
      );
    }

    if (result.type === 'derivative') {
      const d = result.data;
      return (
        <View style={s.resultBox}>
          <Text style={s.resultTitle}>Derivative</Text>
          {/* d.latex contains both f(x) and f'(x) as a KaTeX markdown block */}
          <MathRenderer content={d.latex} />
        </View>
      );
    }

    if (result.type === 'integrate') {
      const d = result.data;
      return (
        <View style={s.resultBox}>
          <Text style={s.resultTitle}>{d.indefinite ? 'Indefinite Integral' : 'Definite Integral'}</Text>
          {/* Wrap in $$ so MathRenderer treats the whole string as display math */}
          <MathRenderer content={`$$${d.latex}$$`} />
          {/* Remind the user that definite results are numerical approximations */}
          {!d.indefinite && (
            <Text style={[s.dimText, { marginTop: 4 }]}>Numerical (Simpson's rule, n = 1000)</Text>
          )}
        </View>
      );
    }

    if (result.type === 'optimize') {
      const d = result.data;
      return (
        <View style={s.resultBox}>
          <Text style={s.resultTitle}>Optimization Analysis</Text>
          <MathDisplay latex={`f(x) = ${exprToLatex(d.originalFunction)}`} style={s.mathLine} />
          <MathDisplay latex={`f'(x) = ${exprToLatex(d.firstDerivative)}`} style={s.mathLine} />
          <MathDisplay latex={`f''(x) = ${exprToLatex(d.secondDerivative)}`} style={s.mathLine} />
          <Text style={[s.resultTitle, { marginTop: 12 }]}>Critical Points</Text>
          {d.criticalPoints.length === 0 && <Text style={s.resultText}>No critical points found in range.</Text>}
          {d.criticalPoints.map((cp, i) => (
            <View key={i} style={s.cpBox}>
              <Text style={s.cpType}>{cp.type}</Text>
              <Text style={s.resultText}>x = {cp.x},  f(x) = {cp.y}</Text>
              <Text style={s.dimText}>f''({cp.x}) = {cp.secondDerivValue}</Text>
            </View>
          ))}
          {d.inflectionPoints.length > 0 && (
            <>
              <Text style={[s.resultTitle, { marginTop: 12 }]}>Inflection Points</Text>
              {d.inflectionPoints.map((ip, i) => (
                <Text key={i} style={s.resultText}>({ip.x}, {ip.y})</Text>
              ))}
            </>
          )}
        </View>
      );
    }

    if (result.type === 'limit') {
      const d = result.data;
      return (
        <View style={s.resultBox}>
          <Text style={s.resultTitle}>lim({variable}→{limitValue}) {exprToLatex(expression)}</Text>
          <View style={s.stepBox}>
            <Text style={s.stepLabel}>From left:</Text>
            <Text style={s.stepDetail}>
              {d.fromLeft.map(p => `f(${p.x}) = ${Math.round(p.y * 1e4) / 1e4}`).join(',  ')}
            </Text>
          </View>
          <View style={s.stepBox}>
            <Text style={s.stepLabel}>From right:</Text>
            <Text style={s.stepDetail}>
              {d.fromRight.map(p => `f(${p.x}) = ${Math.round(p.y * 1e4) / 1e4}`).join(',  ')}
            </Text>
          </View>
          <View style={s.answerBox}>
            <Text style={[s.resultTitle, { marginBottom: 0 }]}>Limit ≈ {d.limitValue}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={s.container}>
      {/* paddingBottom: insets.bottom ensures the last result doesn't sit behind the gesture nav bar */}
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: showKeyboard ? 20 : 40 + insets.bottom }}
        onScrollBeginDrag={() => { Keyboard.dismiss(); }}
      >
        {/* Mode selector buttons */}
        <View style={s.modeRow}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[s.modeBtn, mode === m.key && s.modeBtnActive]}
              // Reset result and restore isDefinite default when switching modes
              // so stale integrate results don't show under derivative, etc.
              onPress={() => { setMode(m.key); setResult(null); if (m.key !== 'integrate') setIsDefinite(true); }}
            >
              <Text style={[s.modeBtnText, mode === m.key && s.modeBtnTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expression input — shown in ALL modes */}
        <Text style={s.label}>Expression:</Text>
        <TouchableOpacity
          style={s.inputBtn}
          onPress={() => { setActiveField('expr'); setShowKeyboard(true); Keyboard.dismiss(); }}
        >
          <Text style={[s.inputText, !expression && { color: '#555' }]}>
            {expression || 'Tap to enter expression...'}
          </Text>
        </TouchableOpacity>

        {/* Live KaTeX preview — only shown when there is something to render.
            toLatex() attempts a parse; if the expression is mid-edit and invalid
            it returns null, so we fall back to the simpler MathDisplay unicode view. */}
        {expression.length > 0 && (() => {
          const latex = toLatex(expression);
          return (
            <>
              <Text style={s.label}>Preview:</Text>
              <View style={s.previewBox}>
                {latex
                  // compact prop reduces padding/line-height so the preview
                  // fits in a small box without wasted whitespace
                  ? <MathRenderer content={`$${latex}$`} compact />
                  : <MathDisplay latex={exprToLatex(expression)} style={{ height: 44 }} />
                }
              </View>
            </>
          );
        })()}

        {/* Variable + mode-specific extra fields */}
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Variable:</Text>
            <TouchableOpacity
              style={s.inputBtnSm}
              onPress={() => { setActiveField('var'); setShowKeyboard(true); }}
            >
              <Text style={s.inputText}>{variable || 'x'}</Text>
            </TouchableOpacity>
          </View>
          {mode === 'limit' && (
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.label}>Approaches:</Text>
              <TouchableOpacity
                style={s.inputBtnSm}
                onPress={() => { setActiveField('limit'); setShowKeyboard(true); }}
              >
                <Text style={s.inputText}>{limitValue || '0'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Integrate-specific controls: definite/indefinite toggle + bound fields */}
        {mode === 'integrate' && (
          <>
            {/* Toggle between definite (needs bounds, numerical) and
                indefinite (symbolic antiderivative, no bounds) */}
            <View style={s.toggleRow}>
              <TouchableOpacity
                style={[s.toggleBtn, isDefinite && s.toggleBtnActive]}
                onPress={() => { setIsDefinite(true); setResult(null); }}
              >
                <Text style={[s.toggleBtnText, isDefinite && s.toggleBtnTextActive]}>Definite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, !isDefinite && s.toggleBtnActive]}
                onPress={() => { setIsDefinite(false); setResult(null); }}
              >
                <Text style={[s.toggleBtnText, !isDefinite && s.toggleBtnTextActive]}>Indefinite</Text>
              </TouchableOpacity>
            </View>
            {/* Bound inputs are hidden for indefinite integrals */}
            {isDefinite && (
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Lower bound (a):</Text>
                  <TouchableOpacity
                    style={s.inputBtnSm}
                    onPress={() => { setActiveField('lower'); setShowKeyboard(true); }}
                  >
                    <Text style={s.inputText}>{lowerBound}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.label}>Upper bound (b):</Text>
                  <TouchableOpacity
                    style={s.inputBtnSm}
                    onPress={() => { setActiveField('upper'); setShowKeyboard(true); }}
                  >
                    <Text style={s.inputText}>{upperBound}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={s.solveBtn} onPress={solve} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.solveBtnText}>Solve</Text>}
        </TouchableOpacity>

        {/* Quick example buttons — per mode.
            EXAMPLES[mode] is looked up so each mode shows only its own examples.
            For integrate examples, lower/upper are also applied so the user can
            tap and immediately hit Solve without typing anything. */}
        <Text style={s.exLabel}>Quick examples:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {(EXAMPLES[mode] || []).map(ex => (
            <TouchableOpacity
              key={ex.raw}
              style={s.exBtn}
              onPress={() => {
                setExpression(ex.raw);
                if (mode === 'limit' && ex.limitVal !== undefined) setLimitValue(ex.limitVal);
                if (mode === 'integrate') {
                  if (ex.lower !== undefined) setLowerBound(ex.lower);
                  if (ex.upper !== undefined) setUpperBound(ex.upper);
                }
              }}
            >
              <Text style={s.exBtnText}>{ex.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


        {renderResult()}
      </ScrollView>

      {/* Custom math keyboard overlay — shown below the scroll area, not inside it */}
      {showKeyboard && (
        <View>
          <View style={s.kbHeader}>
            <Text style={s.kbFieldLabel}>
              {activeField === 'expr' ? 'Expression' : activeField === 'var' ? 'Variable' : activeField === 'limit' ? 'Limit value' : activeField === 'lower' ? 'Lower bound' : 'Upper bound'}
            </Text>
            <TouchableOpacity onPress={() => setShowKeyboard(false)}>
              <Text style={s.kbDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <MathKeyboard
            value={getActiveValue()}
            onChangeText={handleKeyboardInput}
            onHint={(msg) => Alert.alert('Tip', msg)}
            layout={getKeyboardLayout()}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flex: 1, padding: 16 },
  modeRow: { flexDirection: 'row', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#0f3460' },
  modeBtnActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  label: { color: '#888', fontSize: 13, marginBottom: 4, fontWeight: '600' },
  previewBox: { backgroundColor: '#0d1b2a', borderRadius: 10, marginBottom: 4, borderWidth: 1, borderColor: '#0f3460' },
  inputBtn: { backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460', minHeight: 48, justifyContent: 'center' },
  inputBtnSm: { backgroundColor: '#16213e', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#0f3460' },
  inputText: { color: '#fff', fontSize: 15 },
  row: { flexDirection: 'row', marginBottom: 10 },

  solveBtn: { backgroundColor: '#e94560', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  solveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  exLabel: { color: '#555', fontSize: 11, marginBottom: 6 },
  exBtn: { backgroundColor: '#16213e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, marginRight: 8 },
  exBtnText: { color: '#aaa', fontSize: 13 },
  resultBox: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginTop: 4 },
  resultTitle: { color: '#e94560', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  resultText: { color: '#ddd', fontSize: 14, lineHeight: 22 },
  mathLine: { height: 38, marginBottom: 4 },
  stepBox: { marginBottom: 8 },
  stepLabel: { color: '#e94560', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  stepDetail: { color: '#aaa', fontSize: 12, lineHeight: 18 },
  answerBox: { backgroundColor: 'rgba(233,69,96,0.1)', borderRadius: 8, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#e94560' },
  cpBox: { backgroundColor: '#0f3460', borderRadius: 8, padding: 10, marginBottom: 8 },
  cpType: { color: '#e94560', fontWeight: '700', fontSize: 15, marginBottom: 2 },
  dimText: { color: '#888', fontSize: 12 },
  kbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#16213e' },
  kbFieldLabel: { color: '#888', fontSize: 13 },
  kbDone: { color: '#e94560', fontSize: 15, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#0f3460', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#1a3a6e', borderColor: '#4a7aff' },
  toggleBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  toggleBtnTextActive: { color: '#7aa2f7' },
  integralExpr: { color: '#e0e0e0', fontSize: 16, fontStyle: 'italic', paddingVertical: 4 },
  integralAnswer: { color: '#e94560', fontSize: 18, fontWeight: '700' },
});
