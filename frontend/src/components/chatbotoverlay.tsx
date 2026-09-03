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

const CHATBOT_RESPONSES = [
  "I'm continuously monitoring your financial cash flows to keep your roadmap on target.",
  'Your surplus allocation is optimized to balance liquid security with compound returns.',
  'Feel free to adjust your contribution split or target timeline in your plan settings.',
];

export const ChatbotOverlay: React.FC<ChatbotOverlayProps> = ({ onClose, setup, visible = false }) => {
  const timeline = setup?.timeline || '5';
  const split = setup?.split ?? 60;
  const goalType = setup?.goalType || 'shared';

  const planLabel = `${timeline}-Year`;
  const partnerSplit = 100 - split;
  const maryMonthly = Math.round((1340 * split) / 100);
  const zayanMonthly = Math.round((1340 * partnerSplit) / 100);

  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'ai',
      text: `Hi Mary! 👋 Your ${planLabel} ${
        goalType === 'shared' ? 'Shared ' : ''
      }AI Life Plan is active. You're contributing ${split}% (S$${maryMonthly}/mo)${
        goalType === 'shared' ? ` and Zayan ${partnerSplit}% (S$${zayanMonthly}/mo)` : ''
      } toward your goals. What would you like to know?`,
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

  const getResponse = (msg: string): string => {
    const m = msg.toLowerCase();
    if (/split|contribut/.test(m)) {
      return `Your plan has Mary contributing ${split}% (S$${maryMonthly}/mo) and ${
        goalType === 'shared' ? `Zayan ${partnerSplit}% (S$${zayanMonthly}/mo)` : '100% solo'
      }. This auto-routes into your shared MMF.`;
    }
    if (/bto|home|hdb/.test(m)) {
      return `Your BTO Goal Pot is at S$40,800 (68% of S$60K target). On the current ${planLabel} plan you're on track to hit it 2 months early. OWNLYplans is routing +S$200/mo there.`;
    }
    if (/year|timeline|horizon/.test(m)) {
      return `You're on a ${planLabel} plan. By Year ${timeline} the AI projects +S$${
        timeline === '5' ? '200K' : '500K'
      } in net wealth assuming 3.85% MMF yield and your current surplus.`;
    }
    if (/partner|zayan/.test(m)) {
      return goalType === 'shared'
        ? `Zayan is linked and contributing ${partnerSplit}% (S$${zayanMonthly}/mo). Combined monthly contribution is S$1,340 routed via your shared pot.`
        : `You're on a Personal Goals plan — no partner linked. You can add a partner later from Plan settings.`;
    }
    if (/protect|insur/.test(m)) {
      return `OWNLYplans detected a S$160K protection gap. Great Eastern FlexiLife Term is recommended at S$28/mo. Tap the "OCBC Recommends" card to view the quote.`;
    }
    if (/surplus|mmf|cash/.test(m)) {
      return `Your monthly surplus is S$1,340 — S$1,000 → LionGlobal MMF (3.85%), S$200 → BTO Goal Pot, S$140 → FRANK auto-pay. Nothing sits idle in your 360 Account.`;
    }
    if (/invest|portfolio/.test(m)) {
      return `Your investment portfolio is at S$18,450 (37% of S$50K target). LionGlobal MMF is the primary vehicle at 3.85% p.a. You can upgrade to equity exposure via OWNLYplans at any time.`;
    }
    return CHATBOT_RESPONSES[Math.floor(Math.random() * CHATBOT_RESPONSES.length)];
  };

  const send = (txt?: string) => {
    const text = (txt || input).trim();
    if (!text) return;

    setInput('');
    const newMsgs: Message[] = [...messages, { from: 'user', text }];
    setMessages(newMsgs);
    setTyping(true);

    setTimeout(() => {
      setMessages((m) => [...m, { from: 'ai', text: getResponse(text) }]);
      setTyping(false);
    }, 900 + Math.random() * 300);
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
                <Text style={styles.botName}>OWNLYplans AI</Text>
                <View style={styles.statusRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.statusText}>Active · Your {planLabel} Plan</Text>
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
                {['BTO progress?', 'Split breakdown?', 'Protection gap?', 'Monthly surplus?'].map(
                  (q) => (
                    <TouchableOpacity
                      key={q}
                      style={styles.promptChip}
                      onPress={() => send(q)}
                    >
                      <Text style={styles.promptChipText}>{q}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>

            {/* Input Bottom Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send(input)}
                placeholder="Ask your AI planner…"
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