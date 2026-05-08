/**
 * @file QuizScreen.js
 * @description Interactive multiple-choice quiz component. Receives quiz data
 * via route params, tracks score, shows correct/incorrect feedback with
 * explanations, and displays final results with percentage and retry option.
 *
 * @changelog
 * - Initial creation with sequential question flow and score tracking
 * - No significant code changes since creation — stable component
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

/** @returns {React.ReactElement} Quiz interface with questions, options, scoring. */
export default function QuizScreen({ route }) {
  const { quiz } = route.params;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = quiz[current];
  const handleSelect = (idx) => { if (answered) return; setSelected(idx); setAnswered(true); if (idx === q.correct) setScore(s => s + 1); };
  const next = () => { if (current + 1 >= quiz.length) { setFinished(true); } else { setCurrent(c => c + 1); setSelected(null); setAnswered(false); } };
  const restart = () => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false); };
  if (finished) {
    const pct = Math.round((score / quiz.length) * 100);
    return (<View style={s.container}><View style={s.resultCard}><Text style={s.resultEmoji}>{pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📚'}</Text><Text style={s.resultTitle}>Quiz Complete!</Text><Text style={s.resultScore}>{score} / {quiz.length}</Text><Text style={s.resultPct}>{pct}%</Text><Text style={s.resultMsg}>{pct >= 90 ? "Excellent! You've mastered this topic!" : pct >= 70 ? 'Good job! Keep practicing.' : pct >= 50 ? 'Not bad, but review the material.' : 'Keep studying! Review the theory and try again.'}</Text><TouchableOpacity style={s.retryBtn} onPress={restart}><Text style={s.retryBtnText}>Try Again</Text></TouchableOpacity></View></View>);
  }
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.progress}><Text style={s.progressText}>Question {current + 1} of {quiz.length}</Text><View style={s.progressBar}><View style={[s.progressFill, { width: `${((current + 1) / quiz.length) * 100}%` }]} /></View></View>
      <Text style={s.question}>{q.question}</Text>
      {q.options.map((opt, i) => {
        let bg = '#16213e', border = '#0f3460';
        if (answered) { if (i === q.correct) { bg = '#1a3a2a'; border = '#00ff88'; } else if (i === selected) { bg = '#3a1a1a'; border = '#ff4444'; } } else if (i === selected) { bg = '#0f3460'; border = '#e94560'; }
        return (<TouchableOpacity key={i} style={[s.option, { backgroundColor: bg, borderColor: border }]} onPress={() => handleSelect(i)} disabled={answered}><Text style={s.optionLabel}>{String.fromCharCode(65 + i)}.</Text><Text style={s.optionText}>{opt}</Text>{answered && i === q.correct && <Text style={s.checkMark}>✓</Text>}{answered && i === selected && i !== q.correct && <Text style={s.crossMark}>✗</Text>}</TouchableOpacity>);
      })}
      {answered && (<View style={s.explanationBox}><Text style={s.explanationTitle}>{selected === q.correct ? '✅ Correct!' : '❌ Incorrect'}</Text><Text style={s.explanationText}>{q.explanation}</Text><TouchableOpacity style={s.nextBtn} onPress={next}><Text style={s.nextBtnText}>{current + 1 >= quiz.length ? 'See Results' : 'Next Question →'}</Text></TouchableOpacity></View>)}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 }, progress: { marginBottom: 20 }, progressText: { color: '#888', fontSize: 13, marginBottom: 6 }, progressBar: { height: 4, backgroundColor: '#16213e', borderRadius: 2 }, progressFill: { height: 4, backgroundColor: '#e94560', borderRadius: 2 }, question: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20, lineHeight: 28 }, option: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1.5 }, optionLabel: { color: '#e94560', fontSize: 16, fontWeight: '700', marginRight: 12, width: 24 }, optionText: { color: '#ddd', fontSize: 15, flex: 1 }, checkMark: { color: '#00ff88', fontSize: 20, fontWeight: '700' }, crossMark: { color: '#ff4444', fontSize: 20, fontWeight: '700' }, explanationBox: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginTop: 8 }, explanationTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 6 }, explanationText: { color: '#ccc', fontSize: 14, lineHeight: 22, marginBottom: 16 }, nextBtn: { backgroundColor: '#e94560', borderRadius: 10, padding: 14, alignItems: 'center' }, nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }, resultCard: { alignItems: 'center', backgroundColor: '#16213e', borderRadius: 16, padding: 30, marginTop: 40 }, resultEmoji: { fontSize: 60, marginBottom: 12 }, resultTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 }, resultScore: { color: '#e94560', fontSize: 36, fontWeight: '800' }, resultPct: { color: '#888', fontSize: 18, marginBottom: 12 }, resultMsg: { color: '#ccc', fontSize: 15, textAlign: 'center', marginBottom: 20 }, retryBtn: { backgroundColor: '#e94560', borderRadius: 10, paddingHorizontal: 30, paddingVertical: 14 }, retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
