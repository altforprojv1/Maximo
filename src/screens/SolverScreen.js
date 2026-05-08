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
  TextInput,
} from 'react-native';
import { analyzeFunction, computeDerivative, computeSecondDerivative, solveCalculusProblem } from '../services/mathSolver';
import { solveFromText, isApiKeySet } from '../services/aiService';
import MathRenderer from '../components/MathRenderer';
import MathDisplay, { exprToLatex } from '../components/MathDisplay';
import MathKeyboard from '../components/MathKeyboard';

/** @constant {Array<{key: string, label: string}>} Available computation modes. */
const MODES = [
  { key: 'derivative', label: '∂ Derivative' },
  { key: 'optimize', label: '📊 Optimize' },
  { key: 'limit', label: '→ Limit' },
  { key: 'ai', label: '🤖 AI Solve' },
];

/**
 * Problem Solver screen component.
 * @returns {React.ReactElement}
 */
export default function SolverScreen() {
  const [mode, setMode] = useState('derivative');
  const [expression, setExpression] = useState('');
  const [variable, setVariable] = useState('x');
  const [limitValue, setLimitValue] = useState('0');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState('expr'); // 'expr', 'var', 'limit'

  /**
   * AI prompt: tells the AI what to do with the expression.
   * Only visible and used in AI Solve mode.
   * @type {[string, function]}
   */
  const [aiPrompt, setAiPrompt] = useState('');

  /** Routes keyboard input to the currently active field. */
  const handleKeyboardInput = (val) => {
    if (activeField === 'expr') setExpression(val);
    else if (activeField === 'var') setVariable(val);
    else if (activeField === 'limit') setLimitValue(val);
  };

  /** Returns the current value of the active input field. */
  const getActiveValue = () => {
    if (activeField === 'expr') return expression;
    if (activeField === 'var') return variable;
    if (activeField === 'limit') return limitValue;
    return '';
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
      if (mode === 'ai') {
        if (!(await isApiKeySet())) {
          Alert.alert('API Key Required', 'Go to Settings to configure your AI provider.');
          setLoading(false);
          return;
        }

        // Build the message: combine expression + user's instruction prompt
        let message = '';
        if (aiPrompt.trim()) {
          // User gave a specific instruction — send expression + instruction
          message = `Expression: ${expression}\n\nInstruction: ${aiPrompt.trim()}`;
        } else {
          // No instruction — just send expression (backwards-compatible)
          message = expression;
        }

        const res = await solveFromText(message);
        if (res.success) {
          setResult({ type: 'ai', text: res.solution });
        } else {
          Alert.alert('Error', res.error);
        }
      } else if (mode === 'derivative') {
        const res = solveCalculusProblem('derivative', { expr: expression, variable: variable || 'x' });
        setResult({ type: 'derivative', data: res });
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
          <View style={s.stepBox}>
            <Text style={s.stepLabel}>Given:</Text>
            <MathDisplay latex={`f(${variable || 'x'}) = ${exprToLatex(d.input)}`} style={s.mathLine} />
          </View>
          <View style={s.stepBox}>
            <Text style={s.stepLabel}>Result:</Text>
            <MathDisplay latex={`f'(${variable || 'x'}) = ${exprToLatex(d.derivative)}`} style={s.mathLine} />
          </View>
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
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: showKeyboard ? 20 : 40 }}
        onScrollBeginDrag={() => { Keyboard.dismiss(); }}
      >
        {/* Mode selector buttons */}
        <View style={s.modeRow}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[s.modeBtn, mode === m.key && s.modeBtnActive]}
              onPress={() => { setMode(m.key); setResult(null); }}
            >
              <Text style={[s.modeBtnText, mode === m.key && s.modeBtnTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expression input — shown in ALL modes */}
        <Text style={s.label}>Expression:</Text>
        {expression.length > 0 && (
          <View style={s.previewBox}>
            <MathDisplay latex={exprToLatex(expression)} style={{ height: 44 }} />
          </View>
        )}
        <TouchableOpacity
          style={s.inputBtn}
          onPress={() => { setActiveField('expr'); setShowKeyboard(true); Keyboard.dismiss(); }}
        >
          <Text style={[s.inputText, !expression && { color: '#555' }]}>
            {expression || 'Tap to enter expression...'}
          </Text>
        </TouchableOpacity>

        {/* Variable + limit fields — shown in non-AI modes */}
        {mode !== 'ai' && (
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
        )}

        {/* AI instruction prompt — shown ONLY in AI mode */}
        {mode === 'ai' && (
          <>
            <Text style={s.label}>What should the AI do?</Text>
            <TextInput
              style={s.aiPromptInput}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="e.g. Integrate this, Find the limit as x→0, Solve step by step..."
              placeholderTextColor="#555"
              multiline
              textAlignVertical="top"
              onFocus={() => setShowKeyboard(false)}
            />
          </>
        )}

        <TouchableOpacity style={s.solveBtn} onPress={solve} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.solveBtnText}>Solve</Text>}
        </TouchableOpacity>

        {/* Quick example buttons with unicode labels */}
        <Text style={s.exLabel}>Quick examples:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {[
            { raw: 'x^3 - 3*x + 2', label: 'x³−3x+2' },
            { raw: 'sin(x) * cos(x)', label: 'sin·cos' },
            { raw: 'x^4 - 8*x^2 + 3', label: 'x⁴−8x²+3' },
            { raw: 'e^x * x^2', label: 'eˣ·x²' },
            { raw: 'log(x) / x', label: 'ln(x)/x' },
          ].map(ex => (
            <TouchableOpacity key={ex.raw} style={s.exBtn} onPress={() => setExpression(ex.raw)}>
              <Text style={s.exBtnText}>{ex.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* AI prompt quick suggestions — shown ONLY in AI mode */}
        {mode === 'ai' && (
          <>
            <Text style={s.exLabel}>Common instructions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {[
                { label: 'Integrate', text: 'Integrate this expression step by step' },
                { label: 'Derivative', text: 'Find the derivative and simplify' },
                { label: 'Limit →0', text: 'Find the limit as x approaches 0' },
                { label: 'Limit →∞', text: 'Find the limit as x approaches infinity' },
                { label: 'Optimize', text: 'Find all critical points, classify each as min/max, and find inflection points' },
                { label: 'Taylor', text: 'Find the Taylor series expansion around x=0 up to the x^4 term' },
                { label: 'Explain', text: 'Explain what this expression represents and its key properties' },
              ].map(s_item => (
                <TouchableOpacity key={s_item.label} style={s.aiSugBtn} onPress={() => setAiPrompt(s_item.text)}>
                  <Text style={s.aiSugBtnText}>{s_item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {renderResult()}
      </ScrollView>

      {/* Custom math keyboard overlay */}
      {showKeyboard && (
        <View>
          <View style={s.kbHeader}>
            <Text style={s.kbFieldLabel}>
              {activeField === 'expr' ? 'Expression' : activeField === 'var' ? 'Variable' : 'Limit value'}
            </Text>
            <TouchableOpacity onPress={() => setShowKeyboard(false)}>
              <Text style={s.kbDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <MathKeyboard
            value={getActiveValue()}
            onChangeText={handleKeyboardInput}
            onHint={(msg) => Alert.alert('Tip', msg)}
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

  // AI prompt text input — native TextInput so the system keyboard works for natural language
  aiPromptInput: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#0f3460',
    marginBottom: 10,
    minHeight: 70,
    lineHeight: 20,
  },

  // AI prompt suggestion buttons
  aiSugBtn: { backgroundColor: '#1a2a4e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: '#0f3460' },
  aiSugBtnText: { color: '#7aa2f7', fontSize: 12, fontWeight: '600' },

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
});