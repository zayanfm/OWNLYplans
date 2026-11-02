import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { COLORS } from '../stepStyles';

export type ChatMessage = { from: 'ai' | 'me'; text: string };
export type ChatChip = { label: string; onPress: () => void; muted?: boolean };

/**
 * The chat layout shared by the goal and plan assistants: a thread, tap-to-answer chips and a
 * text box that is always there, so people can tap or type.
 */
export const AssistantChat: React.FC<{
  visible: boolean;
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  chips: ChatChip[];
  placeholder: string;
  numeric?: boolean;
  busy?: boolean;
  error?: string | null;
  // Shown under the thread, e.g. the goal summary.
  children?: React.ReactNode;
  onSend: (text: string) => void;
  onClose: () => void;
}> = ({ visible, title, subtitle, messages, chips, placeholder, numeric, busy, error, children, onSend, onClose }) => {
  const [text, setText] = useState<string>('');
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const send = () => {
    if (!text.trim() || busy) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSub}>{subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Close">
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, index) => (
            <View key={index} style={[styles.bubble, message.from === 'me' ? styles.bubbleMe : styles.bubbleAi]}>
              <Text style={[styles.bubbleText, message.from === 'me' && styles.bubbleTextMe]}>{message.text}</Text>
            </View>
          ))}
          {busy ? <ActivityIndicator color={COLORS.red} style={styles.busy} /> : null}
          {children}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          {chips.length ? (
            <View style={styles.chips}>
              {chips.map((chip) => (
                <TouchableOpacity key={chip.label} style={[styles.chip, chip.muted && styles.chipMuted]} onPress={chip.onPress} disabled={busy}>
                  <Text style={[styles.chipText, chip.muted && styles.chipTextMuted]}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              placeholderTextColor={COLORS.faint}
              keyboardType={numeric ? 'numbers-and-punctuation' : 'default'}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <TouchableOpacity style={[styles.send, !text.trim() && styles.sendOff]} onPress={send} accessibilityLabel="Send">
              <Text style={styles.sendText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Shared styles for content placed inside the thread (summaries, cards).
export const chatCardStyles = StyleSheet.create({
  card: { alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.red, padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  label: { fontSize: 12, color: COLORS.muted },
  value: { fontSize: 12, fontWeight: '800', color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
  button: { backgroundColor: COLORS.red, borderRadius: 14, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  link: { alignItems: 'center', paddingVertical: 6 },
  linkText: { fontSize: 12, fontWeight: '800', color: COLORS.red },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.page },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 17, fontWeight: '900', color: COLORS.ink },
  headerSub: { fontSize: 11, color: COLORS.faint, marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  closeText: { fontSize: 14, color: COLORS.muted, fontWeight: '700' },
  thread: { padding: 16, gap: 10 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAi: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 2 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: COLORS.red, borderBottomRightRadius: 2 },
  bubbleText: { fontSize: 13, lineHeight: 18, color: COLORS.ink },
  bubbleTextMe: { color: '#FFFFFF', fontWeight: '500' },
  busy: { alignSelf: 'flex-start', marginLeft: 8 },
  error: { fontSize: 12, color: COLORS.red },
  footer: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 14, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F3B9B0', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontSize: 12, fontWeight: '700', color: COLORS.red },
  chipMuted: { borderColor: '#E0E0E0' },
  chipTextMuted: { color: COLORS.muted },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 22, paddingHorizontal: 14, minHeight: 44, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.page },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.4 },
  sendText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
});

export default AssistantChat;
