import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FamilyMember } from '../types';

export const FamilyConsentStep: React.FC<{
  members: FamilyMember[];
  onToggleMember: (id: string) => void;
  onSendInvite: () => void;
  onBack: () => void;
  sending?: boolean;
}> = ({ members, onToggleMember, onSendInvite, onBack, sending }) => {
  const selectedCount = members.filter((m) => m.selected).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add your family</Text>
        <Text style={styles.subtitle}>
          Your Singpass profile shows you are married with 1 dependent. Invite them so the plan
          covers the whole household.
        </Text>

        <View style={styles.card}>
          {members.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberRow}
              onPress={() => onToggleMember(member.id)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
              </View>
              <View style={styles.memberTextWrap}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberMeta}>
                  {member.relation} · {member.maskedNric}
                </Text>
              </View>
              <View style={[styles.toggle, member.selected && styles.toggleActive]}>
                <View style={[styles.toggleKnob, member.selected && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.consentCard}>
          <Text style={styles.consentTitle}>They decide too</Text>
          <Text style={styles.consentBody}>
            We will send each member an invitation in their OCBC app. Nothing is retrieved until they
            approve it themselves — OWNLYplan never pulls a family member&apos;s data silently.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (selectedCount === 0 || sending) && styles.primaryButtonDisabled]}
          onPress={onSendInvite}
          disabled={selectedCount === 0 || sending}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {selectedCount > 0 ? `Send Invite (${selectedCount})` : 'Send Invite'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: '#D81E05',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#666666',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D81E05',
  },
  memberTextWrap: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  memberMeta: {
    fontSize: 11,
    color: '#888888',
    marginTop: 1,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0E0E0',
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#D81E05',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  consentCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 16,
    marginTop: 14,
  },
  consentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D81E05',
    marginBottom: 4,
  },
  consentBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#666666',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9E5DE',
  },
  primaryButton: {
    backgroundColor: '#D81E05',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FamilyConsentStep;
