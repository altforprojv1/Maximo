/**
 * @file MathKeyboard.js
 * @description Custom scientific calculator keyboard component with 5 tabbed
 * panels: basic numerics (123), functions f(x), trigonometry (sin), calculus
 * hints (∫∂), and Greek letters (αβ). Designed to replace the system keyboard
 * for mathematical expression input.
 *
 * Each key has a label (displayed on the button) and an insert string (appended
 * to the current input). Some keys have special actions: 'backspace' removes the
 * last character, and 'hint' shows a tooltip instead of inserting text (used for
 * operations like d/dx that are handled by dedicated Solver modes).
 *
 * @changelog
 * - Created with 5 tabs: basic, ops (functions), trig, calc, greek
 * - Calc tab uses 'hint' action keys to guide users to the correct Solver mode
 *   rather than inserting calculus notation that math.js can't parse
 * - Variable keys (x, y, t, etc.) styled in blue italic to distinguish from operators
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

/**
 * @constant {Array<{key: string, label: string}>} TABS
 * Tab definitions for the keyboard panel switcher.
 */
const TABS = [
  { key: 'basic', label: '123' },
  { key: 'ops', label: 'f(x)' },
  { key: 'trig', label: 'sin' },
  { key: 'calc', label: '∫∂' },
  { key: 'greek', label: 'αβ' },
];

/**
 * @constant {Object<string, Array<Array<Object>>>} KEYS
 * Key definitions organized by tab. Each key object has:
 * - label {string}: Text shown on the button face
 * - insert {string}: String appended to the input when pressed
 * - action {string}: Optional special action ('backspace' or 'hint')
 * - hint {string}: Tooltip message shown when action is 'hint'
 * - style {string}: Optional style variant ('danger', 'var')
 * - wide {boolean}: If true, the key takes 2x horizontal space
 */
const KEYS = {
  basic: [
    [
      { label: '7', insert: '7' },
      { label: '8', insert: '8' },
      { label: '9', insert: '9' },
      { label: '÷', insert: '/' },
      { label: '⌫', action: 'backspace', style: 'danger' },
    ],
    [
      { label: '4', insert: '4' },
      { label: '5', insert: '5' },
      { label: '6', insert: '6' },
      { label: '×', insert: '*' },
      { label: '(', insert: '(' },
    ],
    [
      { label: '1', insert: '1' },
      { label: '2', insert: '2' },
      { label: '3', insert: '3' },
      { label: '−', insert: '-' },
      { label: ')', insert: ')' },
    ],
    [
      { label: '0', insert: '0' },
      { label: '.', insert: '.' },
      { label: 'x', insert: 'x', style: 'var' },
      { label: '+', insert: '+' },
      { label: '=', insert: '=' },
    ],
  ],
  ops: [
    [
      { label: 'xⁿ', insert: '^', display: 'x^n' },
      { label: 'x²', insert: '^2' },
      { label: 'x³', insert: '^3' },
      { label: '√', insert: 'sqrt(' },
      { label: 'ⁿ√', insert: 'nthRoot(', display: 'ⁿ√x' },
    ],
    [
      { label: 'eˣ', insert: 'e^' },
      { label: 'ln', insert: 'log(' },
      { label: 'log', insert: 'log10(' },
      { label: '|x|', insert: 'abs(' },
      { label: '1/x', insert: '1/' },
    ],
    [
      { label: 'π', insert: 'pi' },
      { label: 'e', insert: 'e' },
      { label: '∞', insert: 'Infinity' },
      { label: 'y', insert: 'y', style: 'var' },
      { label: 'n', insert: 'n', style: 'var' },
    ],
    [
      { label: ',', insert: ',' },
      { label: '[', insert: '[' },
      { label: ']', insert: ']' },
      { label: 'space', insert: ' ', wide: true },
      { label: '⌫', action: 'backspace', style: 'danger' },
    ],
  ],
  trig: [
    [
      { label: 'sin', insert: 'sin(' },
      { label: 'cos', insert: 'cos(' },
      { label: 'tan', insert: 'tan(' },
      { label: 'π', insert: 'pi' },
      { label: '⌫', action: 'backspace', style: 'danger' },
    ],
    [
      { label: 'csc', insert: '1/sin(' },
      { label: 'sec', insert: '1/cos(' },
      { label: 'cot', insert: '1/tan(' },
      { label: 'π/2', insert: 'pi/2' },
      { label: '2π', insert: '2*pi' },
    ],
    [
      { label: 'sin⁻¹', insert: 'asin(' },
      { label: 'cos⁻¹', insert: 'acos(' },
      { label: 'tan⁻¹', insert: 'atan(' },
      { label: '°→rad', insert: '*pi/180' },
      { label: 'rad→°', insert: '*180/pi' },
    ],
    [
      { label: 'sinh', insert: 'sinh(' },
      { label: 'cosh', insert: 'cosh(' },
      { label: 'tanh', insert: 'tanh(' },
      { label: '(', insert: '(' },
      { label: ')', insert: ')' },
    ],
  ],
  calc: [
    [
      { label: 'd/dx', insert: '', action: 'hint', hint: 'Use Solver tab → Derivative mode' },
      { label: '∫', insert: '', action: 'hint', hint: 'Use AI Solve for integrals' },
      { label: 'lim', insert: '', action: 'hint', hint: 'Use Solver tab → Limit mode' },
      { label: 'Σ', insert: 'sum(' },
      { label: '⌫', action: 'backspace', style: 'danger' },
    ],
    [
      { label: "f'(x)", insert: '', action: 'hint', hint: 'First derivative — use Solver tab' },
      { label: "f''(x)", insert: '', action: 'hint', hint: 'Second derivative — use Solver tab' },
      { label: '∂', insert: '', action: 'hint', hint: 'Partial derivative — use AI Solve' },
      { label: '∆x', insert: '', action: 'hint', hint: 'Difference — type manually' },
      { label: 'dx', insert: 'dx' },
    ],
    [
      { label: 'min', insert: 'min(' },
      { label: 'max', insert: 'max(' },
      { label: 'ceil', insert: 'ceil(' },
      { label: 'floor', insert: 'floor(' },
      { label: 'mod', insert: 'mod(' },
    ],
    [
      { label: '!', insert: 'factorial(' },
      { label: 'nCr', insert: 'combinations(' },
      { label: 'nPr', insert: 'permutations(' },
      { label: '(', insert: '(' },
      { label: ')', insert: ')' },
    ],
  ],
  greek: [
    [
      { label: 'α', insert: 'alpha', style: 'var' },
      { label: 'β', insert: 'beta', style: 'var' },
      { label: 'γ', insert: 'gamma', style: 'var' },
      { label: 'δ', insert: 'delta', style: 'var' },
      { label: '⌫', action: 'backspace', style: 'danger' },
    ],
    [
      { label: 'θ', insert: 'theta', style: 'var' },
      { label: 'λ', insert: 'lambda', style: 'var' },
      { label: 'μ', insert: 'mu', style: 'var' },
      { label: 'σ', insert: 'sigma', style: 'var' },
      { label: 'τ', insert: 'tau', style: 'var' },
    ],
    [
      { label: 'φ', insert: 'phi', style: 'var' },
      { label: 'ω', insert: 'omega', style: 'var' },
      { label: 'ε', insert: 'epsilon', style: 'var' },
      { label: 'ρ', insert: 'rho', style: 'var' },
      { label: 'ξ', insert: 'xi', style: 'var' },
    ],
    [
      { label: 'a', insert: 'a', style: 'var' },
      { label: 'b', insert: 'b', style: 'var' },
      { label: 'c', insert: 'c', style: 'var' },
      { label: 't', insert: 't', style: 'var' },
      { label: 'x', insert: 'x', style: 'var' },
    ],
  ],
};

/**
 * Scientific math keyboard component with 5 tabbed panels.
 *
 * @param {Object} props
 * @param {string} props.value - Current input string (used for backspace).
 * @param {function} props.onChangeText - Callback receiving the updated string.
 * @param {function} [props.onHint] - Callback receiving a hint message string.
 * @returns {React.ReactElement}
 */
export default function MathKeyboard({ value, onChangeText, onHint }) {
  const [tab, setTab] = useState('basic');

  /**
   * Handles a key press based on its action type.
   * @param {Object} key - Key definition object from KEYS.
   */
  const handleKey = (key) => {
    if (key.action === 'backspace') {
      onChangeText(value.slice(0, -1));
    } else if (key.action === 'hint') {
      onHint && onHint(key.hint);
    } else if (key.insert !== undefined) {
      onChangeText(value + key.insert);
    }
  };

  return (
    <View style={s.container}>
      {/* Tab bar for switching between keyboard panels */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key grid for the active tab */}
      <View style={s.keysContainer}>
        {KEYS[tab].map((row, ri) => (
          <View key={ri} style={s.keyRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  s.key,
                  key.style === 'danger' && s.keyDanger,
                  key.style === 'var' && s.keyVar,
                  key.action === 'hint' && s.keyHint,
                  key.wide && { flex: 2 },
                ]}
                onPress={() => handleKey(key)}
                activeOpacity={0.6}
              >
                <Text style={[
                  s.keyLabel,
                  key.style === 'danger' && s.keyLabelDanger,
                  key.style === 'var' && s.keyLabelVar,
                  key.action === 'hint' && s.keyLabelHint,
                ]}>{key.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** @type {import('react-native').StyleSheet} */
const s = StyleSheet.create({
  container: { backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#16213e', paddingBottom: 4 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#16213e' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#e94560' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#e94560' },
  keysContainer: { padding: 4 },
  keyRow: { flexDirection: 'row', marginBottom: 4, gap: 4 },
  key: { flex: 1, backgroundColor: '#16213e', borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  keyDanger: { backgroundColor: '#2a1520' },
  keyVar: { backgroundColor: '#1a2a3e' },
  keyHint: { backgroundColor: '#0f1a2e', borderWidth: 1, borderColor: '#1a2a4e', borderStyle: 'dashed' },
  keyLabel: { color: '#ddd', fontSize: 15, fontWeight: '600' },
  keyLabelDanger: { color: '#e94560' },
  keyLabelVar: { color: '#00aaff', fontStyle: 'italic' },
  keyLabelHint: { color: '#556', fontSize: 12 },
});
