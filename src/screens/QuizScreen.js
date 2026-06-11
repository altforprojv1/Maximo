/**
 * @file QuizScreen.js
 * @description Interactive multiple-choice quiz with KaTeX math rendering.
 * Receives quiz data via route params, tracks score, shows correct/incorrect
 * feedback with explanations, and displays final results with retry option.
 *
 * Rendering strategy:
 *  - Question: MathRenderer (full-width WebView, handles $...$ and $$...$$ LaTeX)
 *  - Options: TouchableOpacity row containing a transparent MathRenderer so the
 *    card's correct/incorrect background colour shows through the WebView layer
 *  - Explanation: compact MathRenderer shown after an answer is selected
 *
 * The `transparent` prop on option MathRenderers avoids a WebView reload flash:
 * since the WebView background is always transparent, the parent card's colour
 * can change (default → green/red) without re-rendering the HTML content.
 *
 * @changelog
 * - Initial creation with sequential question flow and score tracking
 * - Replaced plain Text rendering with MathRenderer (KaTeX) for questions,
 *   options, and explanations to support LaTeX-formatted quiz content
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// MathRenderer renders LaTeX in questions, option text, and explanations via KaTeX
import MathRenderer from '../components/MathRenderer';

/** @returns {React.ReactElement} Quiz interface with KaTeX questions, options, and scoring. */
export default function QuizScreen({ route }) {
  const insets = useSafeAreaInsets();
  const { quiz } = route.params;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = quiz[current];

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  // ── Results screen ──────────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <View style={s.container}>
        <View style={s.resultCard}>
          <Text style={s.resultEmoji}>{pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📚'}</Text>
          <Text style={s.resultTitle}>Quiz Complete!</Text>
          <Text style={s.resultScore}>{score} / {quiz.length}</Text>
          <Text style={s.resultPct}>{pct}%</Text>
          <Text style={s.resultMsg}>
            {pct >= 90 ? "Excellent! You've mastered this topic!"
              : pct >= 70 ? 'Good job! Keep practicing.'
              : pct >= 50 ? 'Not bad, but review the material.'
              : 'Keep studying! Review the theory and try again.'}
          </Text>
          <TouchableOpacity style={s.retryBtn} onPress={restart}>
            <Text style={s.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Active question ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      <View style={s.progress}>
        <Text style={s.progressText}>Question {current + 1} of {quiz.length}</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${((current + 1) / quiz.length) * 100}%` }]} />
        </View>
      </View>

      {/* ── Question ──────────────────────────────────────────────────── */}
      {/* One MathRenderer per question — KaTeX renders all $...$ LaTeX in a
          single pass; auto-sizes the WebView to fit the rendered content. */}
      <MathRenderer content={q.question} />

      {/* ── Options ───────────────────────────────────────────────────── */}
      {q.options.map((opt, i) => {
        // Compute card colours based on quiz state
        let bg = '#16213e', border = '#0f3460';
        if (answered) {
          if (i === q.correct)             { bg = '#1a3a2a'; border = '#00ff88'; }
          else if (i === selected)          { bg = '#3a1a1a'; border = '#ff4444'; }
        } else if (i === selected) {
          bg = '#0f3460'; border = '#e94560';
        }

        return (
          <TouchableOpacity
            key={i}
            style={[s.option, { backgroundColor: bg, borderColor: border }]}
            onPress={() => handleSelect(i)}
            disabled={answered}
          >
            {/* Letter label — plain Text, no LaTeX */}
            <Text style={s.optionLabel}>{String.fromCharCode(65 + i)}.</Text>

            {/* Option math content — transparent WebView so the card's
                background colour (default / green / red) shows through.
                pointerEvents="none" ensures taps reach the TouchableOpacity. */}
            <View style={s.optionMath} pointerEvents="none">
              <MathRenderer content={opt} compact transparent />
            </View>

            {/* Correct / incorrect indicators to the right of the content */}
            {answered && i === q.correct && <Text style={s.checkMark}>✓</Text>}
            {answered && i === selected && i !== q.correct && <Text style={s.crossMark}>✗</Text>}
          </TouchableOpacity>
        );
      })}

      {/* ── Explanation ───────────────────────────────────────────────── */}
      {/* Revealed only after the user selects an answer.
          compact MathRenderer renders any LaTeX in the explanation. */}
      {answered && (
        <View style={s.explanationBox}>
          <Text style={s.explanationTitle}>
            {selected === q.correct ? '✅ Correct!' : '❌ Incorrect'}
          </Text>
          <MathRenderer content={q.explanation} compact />
          <TouchableOpacity style={s.nextBtn} onPress={next}>
            <Text style={s.nextBtnText}>
              {current + 1 >= quiz.length ? 'See Results' : 'Next Question →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },

  // Progress indicator
  progress: { marginBottom: 20 },
  progressText: { color: '#888', fontSize: 13, marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: '#16213e', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#e94560', borderRadius: 2 },

  // Option row: [letter label] [MathRenderer flex:1] [check/cross]
  // alignItems: 'flex-start' anchors the label and checkmark to the top of the
  // row; with paddingTop on the label matching the WebView's 8px body padding,
  // the letter visually aligns with the first line of math content.
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 2,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  // paddingTop: 8 matches the compact WebView body padding so "A." sits level
  // with the first line of rendered math content
  optionLabel: { color: '#e94560', fontSize: 16, fontWeight: '700', marginRight: 4, width: 24, paddingTop: 8 },
  // flex: 1 lets the transparent MathRenderer fill the remaining horizontal space
  optionMath: { flex: 1 },
  checkMark: { color: '#00ff88', fontSize: 20, fontWeight: '700', paddingTop: 6 },
  crossMark: { color: '#ff4444', fontSize: 20, fontWeight: '700', paddingTop: 6 },

  // Explanation card — MathRenderer fills its own inner padding (compact 8px/12px)
  explanationBox: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginTop: 8 },
  explanationTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  nextBtn: { backgroundColor: '#e94560', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Results screen
  resultCard: { alignItems: 'center', backgroundColor: '#16213e', borderRadius: 16, padding: 30, marginTop: 40 },
  resultEmoji: { fontSize: 60, marginBottom: 12 },
  resultTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  resultScore: { color: '#e94560', fontSize: 36, fontWeight: '800' },
  resultPct: { color: '#888', fontSize: 18, marginBottom: 12 },
  resultMsg: { color: '#ccc', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#e94560', borderRadius: 10, paddingHorizontal: 30, paddingVertical: 14 },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
