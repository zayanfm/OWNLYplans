import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HELP_SECTIONS, GOVERNANCE_GUARDRAILS, COPY } from '../constants/mockData';

interface HelpPortalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpPortal: React.FC<HelpPortalProps> = ({ visible, onClose }) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSectionId(openSectionId === id ? null : id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>AI Transparency</Text>
                <Text style={styles.subtitle}>OWNLYplans · Help Centre</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Body Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {HELP_SECTIONS.map((section) => {
              const isOpen = openSectionId === section.id;
              return (
                <View key={section.id} style={styles.accordionContainer}>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => toggleSection(section.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.accordionTitleGroup}>
                      <Text style={styles.accordionIcon}>{section.icon}</Text>
                      <View>
                        <Text style={styles.accordionTitle}>{section.title}</Text>
                        <Text style={styles.accordionSub}>{section.sub}</Text>
                      </View>
                    </View>
                    <Svg
                      width={12}
                      height={8}
                      viewBox="0 0 12 8"
                      fill="none"
                      style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                    >
                      <Path
                        d="M1 1l5 5 5-5"
                        stroke="#767676"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.accordionBody}>
                      {section.items.map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                          <Text style={styles.itemLabel}>{item.label}</Text>
                          <Text style={styles.itemText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Governance Strip */}
            <View style={styles.governanceCard}>
              <View style={styles.govHeader}>
                <View style={styles.checkDot}>
                  <Svg width={10} height={8} viewBox="0 0 10 8" fill="none">
                    <Path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="#FFFFFF"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.govTitle}>Governance Guardrails</Text>
              </View>

              {GOVERNANCE_GUARDRAILS.map((guard, idx) => (
                <View key={idx} style={styles.guardRow}>
                  <Text style={styles.guardIcon}>{guard.icon}</Text>
                  <View style={styles.guardContent}>
                    <Text style={styles.guardLabel}>{guard.label}</Text>
                    <Text style={styles.guardSub}>{guard.sub}</Text>
                  </View>
                  <Text style={styles.activeText}>{COPY.active}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
  },
  drawer: {
    maxHeight: '78%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#767676',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  accordionContainer: {
    backgroundColor: '#F5F4F0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionIcon: {
    fontSize: 20,
  },
  accordionTitle: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
  },
  accordionSub: {
    color: '#767676',
    fontSize: 10,
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    padding: 16,
    gap: 12,
  },
  itemRow: {},
  itemLabel: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemText: {
    color: '#767676',
    fontSize: 12,
    lineHeight: 16,
  },
  governanceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  govHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  govTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  guardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  guardIcon: {
    fontSize: 14,
  },
  guardContent: {
    flex: 1,
  },
  guardLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  guardSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    marginTop: 2,
  },
  activeText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '900',
  },
});