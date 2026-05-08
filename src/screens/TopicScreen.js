/**
 * @file TopicScreen.js
 * @description Individual topic detail screen. Displays theory text with bold
 * formatting (** markers parsed into styled Text), worked examples with
 * show/hide toggle, and a button to navigate to the topic's quiz.
 *
 * @changelog
 * - Initial creation with plain text theory rendering
 * - Added **bold** marker parsing using regex split on \*\*(.+?)\*\* pattern
 * - Examples use show/hide toggle state stored as an object keyed by index
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

/** @returns {React.ReactElement} Topic detail with theory, examples, quiz button. */
export default function TopicScreen({ route, navigation }) {
  const { topic } = route.params;
  const [showExample, setShowExample] = useState({});
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>{topic.icon} {topic.title}</Text>
      <Text style={s.week}>{topic.week}</Text>
      <Text style={s.desc}>{topic.description}</Text>
      {/* Theory section with bold text parsing */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📖 Theory</Text>
        {topic.theory.split('\n').map((line, i) => {
          const parts = line.split(/\*\*(.+?)\*\*/g);
          if (parts.length === 1) {
            return <Text key={i} style={s.theory}>{line}</Text>;
          }
          return (
            <Text key={i} style={s.theory}>
              {parts.map((part, j) =>
                j % 2 === 1
                  ? <Text key={j} style={{ color: '#fff', fontWeight: '700' }}>{part}</Text>
                  : <Text key={j}>{part}</Text>
              )}
            </Text>
          );
        })}
      </View>
      {/* Examples with show/hide */}
      {topic.examples && topic.examples.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>✏️ Examples</Text>
          {topic.examples.map((ex, i) => (
            <View key={i} style={s.exBox}>
              <Text style={s.exProblem}>{ex.problem}</Text>
              <TouchableOpacity style={s.showBtn} onPress={() => setShowExample(prev => ({ ...prev, [i]: !prev[i] }))}>
                <Text style={s.showBtnText}>{showExample[i] ? 'Hide Solution' : 'Show Solution'}</Text>
              </TouchableOpacity>
              {showExample[i] && <Text style={s.exSolution}>{ex.solution}</Text>}
            </View>
          ))}
        </View>
      )}
      {/* Quiz navigation button */}
      {topic.quiz && topic.quiz.length > 0 && (
        <TouchableOpacity style={s.quizBtn} onPress={() => navigation.navigate('Quiz', { quiz: topic.quiz, title: topic.title + ' Quiz' })}>
          <Text style={s.quizBtnText}>🧪 Take Quiz ({topic.quiz.length} questions)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  week: { color: '#e94560', fontSize: 14, marginTop: 4 },
  desc: { color: '#aaa', fontSize: 14, marginTop: 8, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#e94560', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  theory: { color: '#ddd', fontSize: 14, lineHeight: 24 },
  exBox: { backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 10 },
  exProblem: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  exSolution: { color: '#ccc', fontSize: 14, lineHeight: 22, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#0f3460' },
  showBtn: { backgroundColor: '#0f3460', borderRadius: 8, padding: 8, alignItems: 'center' },
  showBtnText: { color: '#e94560', fontSize: 13, fontWeight: '600' },
  quizBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  quizBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
