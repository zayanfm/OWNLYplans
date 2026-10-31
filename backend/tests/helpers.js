const goalInputService = require('../services/goalInputService');
const householdStore = require('../models/householdStore');

// Confirms every suggested goal as the family would in the app. With includePartner, the
// partner confirms their own retirement goal (in the sandbox that happens on invite approval).
const confirmSuggestedGoals = (householdId = 'alex_family', { includePartner = true } = {}) => {
  goalInputService.getInputs(householdStore.getHousehold(householdId)).forEach((input) => {
    if (input.owner === 'partner' && !includePartner) return;
    goalInputService.update(householdId, input.key, {}, input.owner === 'partner' ? 'partner' : 'primary');
  });
};

module.exports = { confirmSuggestedGoals };
