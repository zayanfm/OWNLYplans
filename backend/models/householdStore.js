const personas = require('../data/personas.json');

const FAMILY_APPROVAL_DELAY_MS = 3000;

class HouseholdStore {
  constructor() {
    this.households = {};
    this.activePersonaId = 'alex_mary_bto';
    this.auditLogs = {};
    this.familyInvites = {};
    this.init();
  }

  init() {
    // Clone personas into active store
    Object.keys(personas).forEach((key) => {
      this.households[key] = JSON.parse(JSON.stringify(personas[key]));
      this.auditLogs[key] = [
        {
          timestamp: new Date().toISOString(),
          action: 'INITIALIZED',
          detail: `Household profile initialized for persona ${key}`
        }
      ];
    });
  }

  getActivePersonaId() {
    return this.activePersonaId;
  }

  setActivePersonaId(personaId) {
    if (this.households[personaId]) {
      this.activePersonaId = personaId;
      return true;
    }
    return false;
  }

  getHousehold(householdId = this.activePersonaId) {
    if (!this.households[householdId]) {
      if (personas[householdId]) {
        this.households[householdId] = JSON.parse(JSON.stringify(personas[householdId]));
      } else {
        return null;
      }
    }
    return this.households[householdId];
  }

  updateHousehold(householdId = this.activePersonaId, updates = {}) {
    const household = this.getHousehold(householdId);
    if (!household) return null;

    Object.assign(household, updates);
    this.recordAudit(householdId, 'UPDATE_HOUSEHOLD', updates);
    return household;
  }

  linkPartner(householdId = this.activePersonaId, partnerData) {
    const household = this.getHousehold(householdId);
    if (!household) return null;

    household.partner = {
      ...household.partner,
      ...partnerData,
      linked: true
    };
    this.recordAudit(householdId, 'LINK_PARTNER', { partnerName: household.partner.name });
    return household;
  }

  /**
   * Record consent invitations for household members. Members remain PENDING
   * until FAMILY_APPROVAL_DELAY_MS has elapsed, mirroring a real consent round-trip.
   */
  inviteFamilyMembers(householdId = this.activePersonaId, members = []) {
    const invitedAt = new Date().toISOString();
    const record = {
      invitedAt,
      members: members.map((m) => ({
        name: m.name,
        relation: m.relation,
        nric: m.nric,
        status: 'PENDING'
      }))
    };

    this.familyInvites[householdId] = record;
    this.recordAudit(householdId, 'FAMILY_INVITE_SENT', {
      count: record.members.length,
      members: record.members.map((m) => m.name)
    });

    return record;
  }

  getFamilyInviteStatus(householdId = this.activePersonaId) {
    const record = this.familyInvites[householdId];
    if (!record) {
      return { invitedAt: null, allApproved: false, members: [] };
    }

    const elapsed = Date.now() - new Date(record.invitedAt).getTime();
    const approved = elapsed >= FAMILY_APPROVAL_DELAY_MS;

    if (approved) {
      record.members.forEach((m) => {
        m.status = 'APPROVED';
      });
    }

    return {
      invitedAt: record.invitedAt,
      allApproved: approved,
      members: record.members
    };
  }

  approveSurplusPlan(householdId = this.activePersonaId, planDetails) {
    const household = this.getHousehold(householdId);
    if (!household) return null;

    household.activePlan = {
      approvedAt: new Date().toISOString(),
      status: 'ACTIVE',
      ...planDetails
    };

    this.recordAudit(householdId, 'PLAN_APPROVED', planDetails);
    return household.activePlan;
  }

  recordAudit(householdId, action, detail) {
    if (!this.auditLogs[householdId]) {
      this.auditLogs[householdId] = [];
    }
    this.auditLogs[householdId].push({
      timestamp: new Date().toISOString(),
      action,
      detail
    });
  }

  getAuditLog(householdId = this.activePersonaId) {
    return this.auditLogs[householdId] || [];
  }

  listPersonas() {
    return Object.keys(personas).map((key) => ({
      id: key,
      name: personas[key].name,
      segment: personas[key].segment,
      primaryUser: personas[key].primaryUser.name,
      housing: personas[key].housing.type
    }));
  }

  reset(personaId = null) {
    if (personaId && personas[personaId]) {
      this.households[personaId] = JSON.parse(JSON.stringify(personas[personaId]));
      this.auditLogs[personaId] = [
        {
          timestamp: new Date().toISOString(),
          action: 'RESET',
          detail: `Household profile reset for persona ${personaId}`
        }
      ];
    } else {
      this.init();
    }
    this.familyInvites = {};
    return true;
  }
}

const instance = new HouseholdStore();
module.exports = instance;
