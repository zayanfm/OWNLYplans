const goalInputService = require('../services/goalInputService');
const householdStore = require('../models/householdStore');
const workspaceService = require('../services/workspaceService');

// Once the partner has joined, they approve shared goals in their own app (simulated here).
const approveAsPartner = (householdId, goal) => {
  const status = goalInputService.doneStatus(householdStore.getHousehold(householdId));
  if (goal.owner === 'household' && status.adults.includes('partner')) goalInputService.approve(householdId, goal.key, 'partner');
};

// Adds every suggested goal as the family would through the assistant, and approves it. With
// includePartner, the partner adds their own retirement goal.
const confirmSuggestedGoals = (householdId = 'alex_family', { includePartner = true } = {}) => {
  const household = householdStore.getHousehold(householdId);
  goalInputService.available(household).forEach((template) => {
    if (template.owner === 'partner' && !includePartner) return;
    const actor = template.owner === 'partner' ? 'partner' : 'primary';
    approveAsPartner(householdId, goalInputService.propose(householdId, { type: template.type, childIndex: template.childIndex }, actor));
  });
  // Goals added before the partner joined still need their approval.
  goalInputService.getInputs(household).filter((goal) => goal.status === 'AWAITING_PARTNER' && goal.owner === 'household')
    .forEach((goal) => approveAsPartner(householdId, goal));
};

// What the family does in setup: Alex shares his own account, and Lila accepts the invite
// (her sandbox choices then apply). The invite delay is skipped for unit tests.
const shareAndConsent = (householdId = 'alex_family') => {
  workspaceService.setAccountSharing(householdId, '512-882910-001', 'FULL');
  householdStore.inviteFamilyMembers(householdId, [{ name: 'Lila Tan', relation: 'Spouse', nric: 'S****56B' }]);
  householdStore.familyInvites[householdId].invitedAt = new Date(Date.now() - 60000).toISOString();
  householdStore.getFamilyInviteStatus(householdId);
};

// The family adds their BTO purchase as a Housing goal; the app does not assume it.
const addBtoGoal = (householdId = 'alex_family') => {
  const goal = goalInputService.addCustom(householdId, {
    name: 'BTO home purchase', category: 'HOUSING', amount: 96000, saved: 80000, dueDate: '2028-09'
  });
  approveAsPartner(householdId, goal);
  return goal;
};

module.exports = { confirmSuggestedGoals, shareAndConsent, addBtoGoal, approveAsPartner };
