/**
 * @file LearnScreen.js
 * @description Topic list screen displaying all Calculus I and Calculus II topics
 * as tappable cards. Each card shows the topic icon, title, week number, and
 * description. Navigates to TopicScreen on tap.
 *
 * @changelog
 * - Initial creation with CALC_1_TOPICS and CALC_2_TOPICS sections
 * - No code changes since initial implementation — stable
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CALC_1_TOPICS, CALC_2_TOPICS } from '../data/educationalContent';

/** Renders a single topic card with icon, title, week, and description. */
function TopicCard({ topic, onPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.cardIcon}>{topic.icon}</Text>
      <View style={s.cardContent}>
        <Text style={s.cardTitle}>{topic.title}</Text>
        <Text style={s.cardWeek}>{topic.week}</Text>
        <Text style={s.cardDesc} numberOfLines={2}>{topic.description}</Text>
      </View>
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  );
}

/** @returns {React.ReactElement} Scrollable list of all calculus topics. */
export default function LearnScreen({ navigation }) {
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.sectionTitle}>Calculus I</Text>
      {CALC_1_TOPICS.map(topic => (
        <TopicCard key={topic.id} topic={topic} onPress={() => navigation.navigate('Topic', { topic, title: topic.title })} />
      ))}
      <Text style={[s.sectionTitle, { marginTop: 24 }]}>Calculus II</Text>
      {CALC_2_TOPICS.map(topic => (
        <TopicCard key={topic.id} topic={topic} onPress={() => navigation.navigate('Topic', { topic, title: topic.title })} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  sectionTitle: { color: '#e94560', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460' },
  cardIcon: { fontSize: 28, marginRight: 12, width: 40, textAlign: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardWeek: { color: '#e94560', fontSize: 12, marginTop: 2 },
  cardDesc: { color: '#888', fontSize: 12, marginTop: 4 },
  arrow: { color: '#555', fontSize: 28, marginLeft: 8 },
});
