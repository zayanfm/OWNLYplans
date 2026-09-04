const householdStore = require('../models/householdStore');
const { DEFAULT_PERSONA } = require('../config/env');

class MockPassService {
  /**
   * Authenticate with Singpass MockPass.
   * The prototype ships a single family persona (Alex Tan & Mary Lim), so any
   * requested personaId always resolves to the default household.
   */
  authenticate() {
    householdStore.setActivePersonaId(DEFAULT_PERSONA);
    const currentHousehold = householdStore.getHousehold(DEFAULT_PERSONA);
    if (!currentHousehold) {
      throw new Error('Persona not found');
    }

    const { primaryUser, partner, dependents, housing, segment } = currentHousehold;

    return {
      success: true,
      authenticatedAt: new Date().toISOString(),
      authMethod: 'MOCKPASS_SINGPASS_OIDC',
      personaId: currentHousehold.id,
      personaName: currentHousehold.name,
      segment,
      user: {
        nric: primaryUser.nric,
        name: primaryUser.name,
        age: primaryUser.age,
        citizenship: primaryUser.citizenship,
        maritalStatus: primaryUser.maritalStatus || 'Married',
        employment: primaryUser.employment,
        monthlyGrossIncome: primaryUser.monthlyGrossIncome,
        monthlyTakeHome: primaryUser.monthlyTakeHome,
        cpf: primaryUser.cpf,
        verified: true
      },
      partner: partner ? {
        nric: partner.nric,
        name: partner.name,
        age: partner.age,
        citizenship: partner.citizenship,
        employment: partner.employment,
        monthlyGrossIncome: partner.monthlyGrossIncome,
        monthlyTakeHome: partner.monthlyTakeHome,
        cpf: partner.cpf,
        linked: partner.linked
      } : null,
      household: {
        segment,
        dependentsCount: dependents ? dependents.length : 0,
        dependents: dependents || [],
        housing
      }
    };
  }

  getAvailablePersonas() {
    return householdStore.listPersonas();
  }

  /**
   * Retained for backwards compatibility. Always resolves the single family persona.
   */
  switchPersona() {
    return this.authenticate();
  }

  /**
   * Send consent invitations to household members (spouse / children).
   * Members stay PENDING until the simulated approval delay elapses.
   */
  inviteFamily(members = []) {
    const invited = householdStore.inviteFamilyMembers(undefined, members);
    return {
      success: true,
      invitedAt: invited.invitedAt,
      members: invited.members
    };
  }

  getFamilyStatus() {
    const status = householdStore.getFamilyInviteStatus();
    return {
      success: true,
      ...status
    };
  }

  linkPartner(partnerDetails) {
    const updated = householdStore.linkPartner(undefined, partnerDetails);
    return {
      success: true,
      message: `Partner ${partnerDetails.name || ''} linked successfully`,
      household: updated
    };
  }
}

module.exports = new MockPassService();
