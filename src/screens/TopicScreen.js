/**
 * @file TopicScreen.js
 * @description Individual topic detail screen. Displays theory text and worked
 * examples through MathRenderer (KaTeX via WebView), which processes the
 * $...$ and $$...$$ LaTeX delimiters in the content data and renders them
 * as properly typeset math.
 *
 * Sections:
 *  - Header: icon, title, week, plain-text description
 *  - Theory: one MathRenderer for the full theory block (single WebView)
 *  - Examples: MathRenderer per problem + togglable solution
 *  - Quiz button: navigates to QuizScreen
 *
 * @changelog
 * - Initial creation with plain text theory rendering
 * - Added **bold** marker parsing using regex split on \*\*(.+?)\*\* pattern
 * - Examples use show/hide toggle state stored as an object keyed by index
 * - Replaced manual bold/text parser with MathRenderer so KaTeX renders all
 *   LaTeX delimiters ($, $$) present in the content data
 * - Removed emoji icon and week label from header to match LearnScreen card style
 * - Added "Lecture Slides" section between Theory and Examples; renders
 *   ZoomableSlide for each entry in topic.slideImages (if present)
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// MathRenderer renders the LaTeX-marked theory and example content via KaTeX
import MathRenderer from '../components/MathRenderer';
// ZoomableSlide renders a cropped thumbnail that opens a pinch-to-zoom modal
import ZoomableSlide from '../components/ZoomableSlide';

/** @returns {React.ReactElement} Topic detail with KaTeX theory, examples, quiz button. */
export default function TopicScreen({ route, navigation }) {
  const { topic } = route.params;
  // showExample tracks which example solutions are currently revealed
  const [showExample, setShowExample] = useState({});
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      {/* Title and description as plain Text — no LaTeX, no emoji, no week label.
          Icon and week are omitted to match the clean card style in LearnScreen. */}
      <Text style={s.title}>{topic.title}</Text>
      <Text style={s.desc}>{topic.description}</Text>

      {/* ── Theory ────────────────────────────────────────────────── */}
      {/* The entire theory block goes into one MathRenderer instance.
          This keeps WebView count to one regardless of how many formulas
          appear in the text — KaTeX auto-render picks up all $...$ and
          $$...$$ delimiters in a single pass. */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Theory</Text>
        <MathRenderer content={topic.theory} />
      </View>

      {/* ── Lecture Slides ────────────────────────────────────────── */}
      {/* Rendered only for topics that ship with slideImages. Each entry is
          a cropped thumbnail of the professor's lecture slide; tapping it
          opens a full-screen pinch-to-zoom modal for reading fine detail.  */}
      {topic.slideImages && topic.slideImages.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Lecture Slides</Text>
          {topic.slideImages.map((img, i) => (
            <ZoomableSlide key={i} image={img} />
          ))}
        </View>
      )}

      {/* ── Examples ──────────────────────────────────────────────── */}
      {topic.examples && topic.examples.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Examples</Text>
          {topic.examples.map((ex, i) => (
            <View key={i} style={s.exBox}>
              {/* Problem statement — always visible, rendered with KaTeX
                  using compact mode to keep the box height tight */}
              <MathRenderer content={ex.problem} compact />

              {/* Toggle button sits between problem and solution */}
              <TouchableOpacity
                style={s.showBtn}
                onPress={() => setShowExample(prev => ({ ...prev, [i]: !prev[i] }))}
              >
                <Text style={s.showBtnText}>
                  {showExample[i] ? 'Hide Solution' : 'Show Solution'}
                </Text>
              </TouchableOpacity>

              {/* Solution — revealed on toggle, separated by a hairline border.
                  Using compact mode keeps it visually consistent with the problem. */}
              {showExample[i] && (
                <View style={s.exSolutionSep}>
                  <MathRenderer content={ex.solution} compact />
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── Quiz button ───────────────────────────────────────────── */}
      {topic.quiz && topic.quiz.length > 0 && (
        <TouchableOpacity
          style={s.quizBtn}
          onPress={() => navigation.navigate('Quiz', { quiz: topic.quiz, title: topic.title + ' Quiz' })}
        >
          <Text style={s.quizBtnText}>🧪 Take Quiz ({topic.quiz.length} questions)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  desc: { color: '#aaa', fontSize: 14, marginTop: 8, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#e94560', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  // exBox has no padding so MathRenderer fills edge-to-edge (it adds its own
  // compact padding of 8px/12px); overflow:hidden clips the inner borderRadius
  exBox: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
    overflow: 'hidden',
  },
  // Hairline between problem and solution, matching the card border colour
  exSolutionSep: { borderTopWidth: 1, borderTopColor: '#0f3460' },
  // margin instead of padding keeps button away from edges without affecting MathRenderer
  showBtn: { backgroundColor: '#0f3460', borderRadius: 8, padding: 8, alignItems: 'center', margin: 10 },
  showBtnText: { color: '#e94560', fontSize: 13, fontWeight: '600' },
  quizBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  quizBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
