/**
 * @file LearnScreen.js
 * @description Topic list screen displaying all Calculus I and Calculus II topics
 * as tappable cards. Each card shows the topic title and description.
 * Navigates to TopicScreen on tap.
 *
 * @changelog
 * - Initial creation with CALC_1_TOPICS and CALC_2_TOPICS sections
 * - Removed emoji icon and week number from topic cards — title alone is sufficient
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CALC_1_TOPICS, CALC_2_TOPICS } from '../data/educationalContent';

/**
 * Renders a single topic card with title, description, and a chevron.
 * Icon and week number are intentionally omitted — the title is sufficient.
 */
function TopicCard({ topic, onPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.cardContent}>
        <Text style={s.cardTitle}>{topic.title}</Text>
        {/* Two-line clamp keeps cards uniform height regardless of description length */}
        <Text style={s.cardDesc} numberOfLines={2}>{topic.description}</Text>
      </View>
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  );
}

/** @returns {React.ReactElement} Scrollable list of all calculus topics. */
export default function LearnScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
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
  cardContent: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardDesc: { color: '#888', fontSize: 12, marginTop: 4 },
  arrow: { color: '#555', fontSize: 28, marginLeft: 8 },
});
