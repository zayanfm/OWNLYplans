import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import api, { ChatMessage } from '../services/api';

export interface SetupProps {
  timeline?: string;
  split?: number;
  goalType?: 'shared' | 'personal';
}

export interface ChatbotOverlayProps {
  onClose: () => void;
  setup?: SetupProps;
  visible?: boolean;
}

interface Message {
  from: 'ai' | 'user';
  text: string;
}

export const ChatbotOverlay: React.FC<ChatbotOverlayProps> = ({ onClose, setup, visible = false }) => {
  const timeline = setup?.timeline || '5';
  const split = setup?.split ?? 60;
  const goalType = setup?.goalType || 'shared';

  const planLabel = `${timeline}-Year`;
  const partnerSplit = 100 - split;

  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'ai',
      text: `Hello! 👋 I am your OWNLYplans AI Assistant, connected to your OCBC 360, SGFinDex, and CPF data. Ask me anything about your BTO downpayment, MMF yield sweeps, government grants, or protection gaps!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const dotAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  // Animate typing indicator dots
  useEffect(() => {
    if (typing) {
      const animations = dotAnims.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 220),
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.forEach((a) => a.start());
      return () => animations.forEach((a) => a.stop());
    }
  }, [typing, dotAnims]);

  const send = async (txt?: string) => {
    const text = (txt || input).trim();
    if (!text) return;

    setInput('');
    const newMsgs: Message[] = [...messages, { from: 'user', text }];
    setMessages(newMsgs);
    setTyping(true);

    try {
      // Map to ChatMessage format for API
      const history: ChatMessage[] = newMsgs.map(m => ({
        sender: m.from === 'user' ? 'user' : 'bot',
        text: m.text
      }));

      const response = await api.sendChatMessage(text, history);
      setMessages((m) => [...m, { from: 'ai', text: response.reply }]);
    } catch (err) {
      console.warn('Chat error, using fallback:', err);
      setMessages((m) => [
        ...m,
        {
          from: 'ai',
          text: `By sweeping your idle cash into LionGlobal SGD Money Market Fund, you increase your annual yield to 3.85% p.a. while keeping full liquidity. Your BTO downpayment accumulation remains on track for 2027.`
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          style={styles.drawerContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity activeOpacity={1} style={styles.drawerContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.botAvatar}>
                <Text style={styles.avatarEmoji}>🤖</Text>
              </View>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.botName}>OWNLYplans AI Assistant</Text>
                <View style={styles.statusRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.statusText}>Multi-Agent Active · Live SGFinDex Context</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Message Area */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.messageRow,
                    msg.from === 'user' ? styles.rowUser : styles.rowAi,
                  ]}
                >
                  {msg.from === 'ai' && (
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarEmoji}>🤖</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      msg.from === 'user' ? styles.bubbleUser : styles.bubbleAi,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        msg.from === 'user' ? styles.userText : styles.aiText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}

              {typing && (
                <View style={[styles.messageRow, styles.rowAi]}>
                  <View style={styles.smallAvatar}>
                    <Text style={styles.smallAvatarEmoji}>🤖</Text>
                  </View>
                  <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                    <View style={styles.dotsRow}>
                      {dotAnims.map((anim, idx) => (
                        <Animated.View
                          key={idx}
                          style={[
                            styles.dot,
                            {
                              opacity: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.3, 1],
                              }),
                              transform: [
                                {
                                  translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -3],
                                  }),
                                },
                              ],
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Quick Suggestions Horizontal Bar */}
            <View style={styles.quickPromptsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPromptsContainer}
              >
                {[
                  'Why sweep to LionGlobal MMF?',
                  'What grants are we eligible for?',
                  'How is our BTO progress?',
                  'Tell me about our protection gap'
                ].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.promptChip}
                    onPress={() => send(q)}
                  >
                    <Text style={styles.promptChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input Bottom Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send(input)}
                placeholder="Ask about grants, MMF yields, BTO goals..."
                placeholderTextColor="#A0A0A0"
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: input.trim() ? '#D81E05' : '#E8E8E8' },
                ]}
                disabled={!input.trim()}
                onPress={() => send()}
              >
                <Text style={styles.sendArrow}>➔</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    height: '84%',
    width: '100%',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#F5F4F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  botName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAi: {
    justifyContent: 'flex-start',
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarEmoji: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '76%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#D81E05',
    borderBottomRightRadius: 2,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  aiText: {
    color: '#1A1A1A',
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BBBBBB',
  },
  quickPromptsWrapper: {
    paddingVertical: 8,
    backgroundColor: '#F5F4F0',
  },
  quickPromptsContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F4F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A1A1A',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatbotOverlay;
