import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { MockPassAuthResponse } from '../services/api';

export const UserProfile: React.FC<{
  onNext?: () => void;
  onBack?: () => void;
  onEdit?: () => void;
}> = ({ onNext, onBack, onEdit }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<MockPassAuthResponse | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.mockpassLogin();
      setProfile(res);
    } catch (e) {
      console.warn('Failed to load MockPass profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const user = profile?.user;
  const partner = profile?.partner;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.householdTag}>
          <Text style={styles.householdTagText}>Married · Household of 3</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Household Profile</Text>
        <Text style={styles.subtitle}>Verified Singpass & SGFinDex baseline for OWNLYplans</Text>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#D81E05" />
            <Text style={{ marginTop: 12, color: '#666' }}>Syncing with Singpass MockPass...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.statusBanner}>
              <Text style={styles.statusText}>🔒 MockPass Sandbox | SGFinDex Connected</Text>
            </View>

            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
                </View>
                <Text style={styles.name}>{profile?.personaName || user?.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Verified Household • {profile?.segment}</Text>
                </View>
                <Text style={styles.maskedNric}>{user?.nric}</Text>
              </View>

              <View style={styles.fieldContainer}>
                {_renderField('Primary Applicant', `${user?.name} (${user?.nric})`)}
                {_renderField('Marital Status', `${user?.maritalStatus || 'Married'}`)}
                {_renderField('Employment', `${user?.employment}`)}
                {_renderField('Monthly Take-Home', `S$${user?.monthlyTakeHome?.toLocaleString()}`)}
                {_renderField('CPF Ordinary (OA)', `S$${user?.cpf?.oa?.toLocaleString()}`)}
                {_renderField('CPF Special (SA)', `S$${user?.cpf?.sa?.toLocaleString()}`)}
                {partner && (
                  <>
                    <View style={styles.divider} />
                    {_renderField('Linked Partner', `${partner?.name} (${partner?.nric})`)}
                    {_renderField('Partner Take-Home', `S$${partner?.monthlyTakeHome?.toLocaleString()}`)}
                    {_renderField('Partner CPF OA', `S$${partner?.cpf?.oa?.toLocaleString()}`)}
                  </>
                )}
                <View style={styles.divider} />
                {_renderField('Housing', `${profile?.household?.housing?.type || 'Housing record unavailable'}`)}
                {_renderField('Dependents', `${profile?.household?.dependentsCount || 0} dependent(s)`)}
              </View>

              <Text style={styles.disclaimer}>
                These details are auto-synced via MockPass & SGFinDex and cannot be edited here.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>Refresh from MyInfo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>Confirm & Proceed</Text>
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
    paddingTop: 0,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  backButtonText: {
    fontSize: 18,
    color: '#D81E05',
    fontWeight: '700',
  },
  householdTag: {
    backgroundColor: '#FFF0EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  householdTagText: {
    color: '#D81E05',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    color: '#1A73E8',
    fontWeight: '700',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  maskedNric: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
    marginTop: 4,
  },
  fieldContainer: {
    width: '100%',
    gap: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 4,
  },
  disclaimer: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D81E05',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D81E05',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#D81E05',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default UserProfile;
