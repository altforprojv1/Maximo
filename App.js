/**
 * @file App.js
 * @description Root component of the CalcOptimizer application. Sets up the bottom
 * tab navigator with five screens (Solver, Scanner, Visualizer, Learn, Settings)
 * and a nested stack navigator for the Learn section's topic/quiz drill-down.
 *
 * Uses React Navigation v7 with a dark theme consistent across all headers and
 * tab bars. Tab icons are emoji-based with shortened labels to prevent text
 * truncation on narrow screens.
 *
 * @requires react-navigation/bottom-tabs
 * @requires react-navigation/native-stack
 *
 * @changelog
 * - Initial creation with 4 tabs (Solver, Scanner, Visualizer, Learn)
 * - Added Settings tab for in-app API key configuration
 * - Fixed tab label truncation: full names (e.g., "Visualizer") replaced with
 *   short labels ("Graph") and numberOfLines={1} to prevent wrapping
 * - Learn section wrapped in a NativeStackNavigator for topic → quiz navigation
 *
 * @see https://jsdoc.app/ for documentation conventions used in this project.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

import SolverScreen from './src/screens/SolverScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import VisualizerScreen from './src/screens/VisualizerScreen';
import LearnScreen from './src/screens/LearnScreen';
import TopicScreen from './src/screens/TopicScreen';
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';

/** @type {import('@react-navigation/bottom-tabs').BottomTabNavigator} */
const Tab = createBottomTabNavigator();

/** @type {import('@react-navigation/native-stack').NativeStackNavigator} */
const LearnStack = createNativeStackNavigator();

/**
 * Renders a single tab bar icon with an emoji and a short text label.
 * Labels are abbreviated to prevent overflow on small screens.
 *
 * @param {Object} props
 * @param {string} props.label - The route name (e.g., "Solver", "Visualizer").
 * @param {boolean} props.focused - Whether this tab is currently active.
 * @returns {React.ReactElement}
 */
function TabIcon({ label, focused }) {
  const icons = { Solver: '🧮', Scanner: '📷', Visualizer: '📈', Learn: '📚', Settings: '⚙️' };
  const short = { Solver: 'Solve', Scanner: 'Scan', Visualizer: 'Graph', Learn: 'Learn', Settings: 'Config' };
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{icons[label] || '•'}</Text>
      <Text style={{ fontSize: 9, color: focused ? '#e94560' : '#888', fontWeight: focused ? '700' : '400' }} numberOfLines={1}>{short[label] || label}</Text>
    </View>
  );
}

/**
 * Stack navigator for the Learn section. Contains three screens:
 * - Topics: list of all Calc I and Calc II topics
 * - Topic: individual topic detail (theory, examples)
 * - Quiz: multiple-choice quiz for the selected topic
 *
 * @returns {React.ReactElement}
 */
function LearnStackScreen() {
  return (
    <LearnStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#16213e' }, headerTintColor: '#fff' }}>
      <LearnStack.Screen name="Topics" component={LearnScreen} options={{ title: 'Learn Calculus' }} />
      <LearnStack.Screen name="Topic" component={TopicScreen} options={({ route }) => ({ title: route.params?.title || 'Topic' })} />
      <LearnStack.Screen name="Quiz" component={QuizScreen} options={({ route }) => ({ title: route.params?.title || 'Quiz' })} />
    </LearnStack.Navigator>
  );
}

/**
 * Root application component. Wraps the entire app in a NavigationContainer
 * and configures the bottom tab navigator with dark-themed styling.
 *
 * @returns {React.ReactElement}
 */
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: '#16213e' },
          headerTintColor: '#fff',
          tabBarStyle: { backgroundColor: '#0f3460', borderTopColor: '#1a1a2e' },
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Solver" component={SolverScreen} options={{ title: 'Problem Solver' }} />
        <Tab.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan Problem' }} />
        <Tab.Screen name="Visualizer" component={VisualizerScreen} options={{ title: 'Visualizer' }} />
        <Tab.Screen name="Learn" component={LearnStackScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
