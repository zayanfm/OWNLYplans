const goalInputService = require('../services/goalInputService');
const householdStore = require('../models/householdStore');
const workspaceService = require('../services/workspaceService');

// Confirms every suggested goal as the family would in the app. With includePartner, the
// partner confirms their own retirement goal (in the sandbox that happens on invite approval).
const confirmSuggestedGoals = (householdId = 'alex_family', { includePartner = true } = {}) => {
  goalInputService.getInputs(householdStore.getHousehold(householdId)).forEach((input) => {
    if (input.owner === 'partner' && !includePartner) return;
    goalInputService.update(householdId, input.key, {}, input.owner === 'partner' ? 'partner' : 'primary');
  });
};

// What the family does in setup: Alex shares his own account, and Lila accepts the invite
// (her sandbox choices then apply). The invite delay is skipped for unit tests.
const shareAndConsent = (householdId = 'alex_family') => {
  workspaceService.setAccountSharing(householdId, '512-882910-001', 'FULL');
  householdStore.inviteFamilyMembers(householdId, [{ name: 'Lila Tan', relation: 'Spouse', nric: 'S****56B' }]);
  householdStore.familyInvites[householdId].invitedAt = new Date(Date.now() - 60000).toISOString();
  householdStore.getFamilyInviteStatus(householdId);
};

module.exports = { confirmSuggestedGoals, shareAndConsent };
