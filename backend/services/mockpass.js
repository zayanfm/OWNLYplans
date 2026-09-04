const householdStore = require('../models/householdStore');

class MockPassService {
  /**
   * Authenticate with Singpass MockPass.
   * Supports persona switching, QR simulation, and returns verified MyInfo profile.
   */
  authenticate(personaId = null) {
    if (personaId) {
      householdStore.setActivePersonaId(personaId);
    }
    const currentHousehold = householdStore.getHousehold();
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

  switchPersona(personaId) {
    const success = householdStore.setActivePersonaId(personaId);
    if (!success) {
      throw new Error(`Invalid persona ID: ${personaId}`);
    }
    return this.authenticate(personaId);
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
