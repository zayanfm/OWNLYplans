import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r="11" fill="#D81E05" />
    <path d="M12 7v10M8 12h8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const UserProfile: React.FC<{ onNext?: () => void; onBack?: () => void; onEdit?: () => void }> = ({
  onNext,
  onBack,
  onEdit,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Verify your baseline before we build your plan</Text>

        <View style={styles.card}>
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>AI-sourced from your OCBC data | LIVE</Text>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>M</Text>
              </View>
              <Text style={styles.name}>Mary Tan</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>OCBC 360 Verified</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              {_renderField('Full Name', 'Mary Tan')}
              {_renderField('Age', '32 years old')}
              {_renderField('Occupation', 'Senior Marketing Manager')}
              {_renderField('Monthly Income', 'S$6,200 (take-home)')}
              {_renderField('OCBC Account', '360 Account · •••• 4892')}
              {_renderField('Savings Balance', 'S$24,180.33')}
              {_renderField('Risk Profile', 'Balanced (MAS FAIR)')}
              {_renderField('CPF OA Balance', 'S$42,000')}
            </View>

            <Text style={styles.disclaimer}>
              These details power your personalised plan. Tap Edit to update any field.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const _renderField = (label: string, value: string) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButtonText: {
    fontSize: 20,
    color: '#D81E05',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusBanner: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#1A73E8',
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#E6F4EA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },
  fieldContainer: {
    width: '100%',
    gap: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D81E05',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D81E05',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#D81E05',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default UserProfile;