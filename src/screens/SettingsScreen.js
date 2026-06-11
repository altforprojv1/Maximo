/**
 * @file SettingsScreen.js
 * @description API configuration screen. Allows users to select an AI provider
 * (Claude, OpenAI, Gemini), enter/view/hide their API key, and choose a model.
 * Configuration is persisted locally via AsyncStorage (apiConfig.js).
 *
 * @changelog
 * - Created to replace hardcoded API key approach
 * - Added multi-provider support with provider-specific signup URLs and pricing
 * - Added show/hide toggle for API key field (secureTextEntry)
 * - Save button shows green "✓ Saved!" confirmation for 2 seconds
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getConfig, saveConfig, PROVIDERS } from '../services/apiConfig';

/** @returns {React.ReactElement} Settings screen with provider/key/model config. */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  useEffect(() => { getConfig().then(cfg => { setProvider(cfg.provider || 'claude'); setApiKey(cfg.apiKey || ''); setModel(cfg.model || ''); }); }, []);
  const handleSave = async () => { if (!apiKey.trim()) { Alert.alert('Error', 'Please enter an API key'); return; } await saveConfig(provider, apiKey.trim(), model || PROVIDERS[provider].defaultModel); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleProviderChange = (p) => { setProvider(p); setModel(PROVIDERS[p].defaultModel); };
  const info = PROVIDERS[provider];
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
      <Text style={s.title}>⚙️ AI Settings</Text>
      <Text style={s.subtitle}>Configure your AI provider for the Scanner and AI Solver features.</Text>
      <Text style={s.label}>AI Provider</Text>
      <View style={s.providerRow}>{Object.entries(PROVIDERS).map(([key, val]) => (<TouchableOpacity key={key} style={[s.providerBtn, provider === key && s.providerBtnActive]} onPress={() => handleProviderChange(key)}><Text style={[s.providerBtnText, provider === key && s.providerBtnTextActive]}>{key === 'claude' ? '🟠' : key === 'openai' ? '🟢' : '🔵'} {val.name}</Text></TouchableOpacity>))}</View>
      <Text style={s.label}>API Key</Text>
      <View style={s.keyRow}><TextInput style={[s.input, { flex: 1 }]} value={apiKey} onChangeText={setApiKey} placeholder={info.placeholder} placeholderTextColor="#555" secureTextEntry={!showKey} autoCapitalize="none" autoCorrect={false} /><TouchableOpacity style={s.eyeBtn} onPress={() => setShowKey(!showKey)}><Text style={s.eyeText}>{showKey ? '🙈' : '👁️'}</Text></TouchableOpacity></View>
      <TouchableOpacity onPress={() => Linking.openURL(info.signupUrl)}><Text style={s.link}>Get a {info.name} API key →</Text></TouchableOpacity>
      <Text style={[s.label, { marginTop: 16 }]}>Model</Text>
      <View style={s.modelRow}>{info.models.map(m => (<TouchableOpacity key={m} style={[s.modelBtn, (model || info.defaultModel) === m && s.modelBtnActive]} onPress={() => setModel(m)}><Text style={[s.modelBtnText, (model || info.defaultModel) === m && s.modelBtnTextActive]}>{m}</Text></TouchableOpacity>))}</View>
      <Text style={s.pricing}>Est. cost: {info.pricing}</Text>
      <TouchableOpacity style={[s.saveBtn, saved && { backgroundColor: '#00aa55' }]} onPress={handleSave}><Text style={s.saveBtnText}>{saved ? '✓ Saved!' : 'Save Settings'}</Text></TouchableOpacity>
      <View style={s.infoCard}><Text style={s.infoTitle}>💡 Which provider should I use?</Text><Text style={s.infoText}>• Google Gemini — has a free tier, cheapest option{'\n'}• Claude (Anthropic) — best math accuracy, ~$0.002/scan{'\n'}• OpenAI — widely used, similar pricing to Claude</Text></View>
      <View style={s.infoCard}><Text style={s.infoTitle}>🔒 Is my API key safe?</Text><Text style={s.infoText}>Your key is stored locally on your device only. It is never sent anywhere except directly to the AI provider you selected.</Text></View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 }, title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 }, subtitle: { color: '#888', fontSize: 14, marginBottom: 20 }, label: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 6 }, providerRow: { gap: 8, marginBottom: 16 }, providerBtn: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#0f3460' }, providerBtnActive: { borderColor: '#e94560', backgroundColor: '#1a1a3e' }, providerBtnText: { color: '#888', fontSize: 15, fontWeight: '600' }, providerBtnTextActive: { color: '#fff' }, keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }, input: { backgroundColor: '#16213e', color: '#fff', borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#0f3460' }, eyeBtn: { padding: 10 }, eyeText: { fontSize: 20 }, link: { color: '#e94560', fontSize: 13, marginBottom: 8 }, modelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }, modelBtn: { backgroundColor: '#16213e', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#0f3460' }, modelBtnActive: { backgroundColor: '#e94560', borderColor: '#e94560' }, modelBtnText: { color: '#888', fontSize: 12 }, modelBtnTextActive: { color: '#fff' }, pricing: { color: '#666', fontSize: 12, marginBottom: 16 }, saveBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 }, saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' }, infoCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 10 }, infoTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6 }, infoText: { color: '#aaa', fontSize: 13, lineHeight: 22 },
});
