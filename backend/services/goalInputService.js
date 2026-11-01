const householdStore = require('../models/householdStore');

// Suggested values come from published sources and are shown to the family with that source.
// Nothing is planned until the family confirms or edits each goal.
const EDUCATION_PATHS = {
  UNIVERSITY: { years: 4, annualCost: 11000, startAge: 19, source: 'Suggested: local university tuition S$10,000–12,000 a year (CNA, 2024). Start year is your choice.' },
  POLYTECHNIC: { years: 3, annualCost: 3100, startAge: 17, source: 'Suggested: polytechnic fees about S$3,100 a year (CNA, 2024). Start year is your choice.' },
  UNDECIDED: { years: 0, annualCost: 0, startAge: 0, source: 'Not decided yet. No education amount is planned until you choose a path.' }
};
// Categories for goals the family adds. The category decides how the goal is planned and
// which government support is shown with it (e.g. housing schemes under a housing goal).
const GOAL_CATEGORIES = {
  HOUSING: { label: 'Housing', routeKey: 'housing' },
  EDUCATION: { label: 'Education', routeKey: 'education' },
  FAMILY: { label: 'Family', routeKey: 'custom' },
  OTHER: { label: 'Other', routeKey: 'custom' }
};
const LIMITS = {
  months: [3, 12],
  withinMonths: [6, 36],
  retireAge: [55, 70],
  years: [1, 6],
  annualCost: [0, 100000],
  amount: [1000, 2000000]
};

const inRange = (value, [min, max]) => Number.isFinite(value) && value >= min && value <= max;
const isMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value));
const currentMonth = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const partnerConsented = (household) => {
  if (!household.partner || household.partner.left) return false;
  const invite = householdStore.getFamilyInviteStatus(household.id);
  return invite.members.some((member) => member.relation === 'Spouse' && member.status === 'APPROVED');
};

class GoalInputService {
  /** Suggested inputs for every goal the household could have. All start unconfirmed. */
  suggest(household) {
    const { dependents = [], primaryUser, partner } = household;
    const suggestions = [
      {
        key: 'emergency', type: 'EMERGENCY', owner: 'household', enabled: true,
        months: 6, withinMonths: 18,
        source: 'Suggested: 3–6 months of essential spending is a common guideline. Choose what lets you sleep at night.'
      }
    ];

    dependents.filter((child) => child.relation === 'Child').forEach((child, index) => {
      const birthYear = child.birthDate ? new Date(child.birthDate).getFullYear() : new Date().getFullYear();
      const path = EDUCATION_PATHS.UNIVERSITY;
      suggestions.push({
        key: index === 0 ? 'education' : `education_${index + 1}`,
        type: 'EDUCATION', owner: 'household', enabled: true,
        childName: child.name,
        childIndex: index,
        path: 'UNIVERSITY',
        startYear: birthYear + path.startAge,
        years: path.years,
        annualCost: path.annualCost,
        source: path.source
      });
    });

    [['primary', primaryUser], ['partner', partner]].forEach(([owner, adult]) => {
      if (!adult || adult.left) return;
      suggestions.push({
        key: `retirement_${owner}`, type: 'RETIREMENT', owner, enabled: true,
        adultName: adult.name,
        retireAge: 65,
        amount: 200000,
        source: `Suggested: savings on top of CPF LIFE payouts, which start from age 65. Only ${String(adult.name).split(' ')[0]} can confirm this goal.`
      });
    });

    return suggestions;
  }

  /** Suggestions merged with what the family has decided, each with a status. */
  getInputs(household) {
    const stored = householdStore.getGoalInputs(household.id);
    const consented = partnerConsented(household);
    const merged = this.suggest(household).map((suggestion) => {
      const saved = stored[suggestion.key];
      const input = { ...suggestion, ...(saved || {}), suggested: { ...suggestion } };
      if (suggestion.owner === 'partner' && !saved) {
        // The partner confirms their own goal as part of accepting the invite (simulated in the sandbox).
        input.confirmed = consented;
        input.confirmedBy = consented ? 'partner' : null;
      }
      return input;
    });
    const custom = Object.values(stored).filter((input) => input.type === 'CUSTOM');
    return [...merged, ...custom].map((input) => ({ ...input, status: this.status(input, consented) }));
  }

  status(input, consented) {
    if (input.enabled === false) return 'OFF';
    if (input.type === 'EDUCATION' && input.path === 'UNDECIDED') return 'NEEDS_DECISION';
    if (input.owner === 'partner' && !input.confirmed) return consented ? 'NEEDS_DECISION' : 'AWAITING_PARTNER';
    return input.confirmed ? 'CONFIRMED' : 'NEEDS_DECISION';
  }

  update(householdId, key, patch = {}, actor = 'primary') {
    const household = this.household(householdId);
    const current = this.getInputs(household).find((input) => input.key === key);
    if (!current) throw this.error(404, 'Goal not found');
    if (current.owner === 'partner' && actor !== 'partner') {
      throw this.error(403, `Only ${String(current.adultName).split(' ')[0]} can confirm or change this retirement goal`);
    }

    const next = { enabled: patch.enabled === undefined ? current.enabled !== false : Boolean(patch.enabled) };
    const number = (field) => (patch[field] === undefined ? current[field] : Number(patch[field]));
    const check = (field, value) => {
      if (!inRange(value, LIMITS[field])) throw this.error(400, `${field} must be between ${LIMITS[field][0]} and ${LIMITS[field][1]}`);
      return value;
    };

    if (current.type === 'EMERGENCY') {
      next.months = check('months', number('months'));
      next.withinMonths = check('withinMonths', number('withinMonths'));
    } else if (current.type === 'CUSTOM') {
      next.amount = check('amount', number('amount'));
      const dueDate = patch.dueDate === undefined ? current.dueDate : String(patch.dueDate);
      if (!isMonth(dueDate) || dueDate <= currentMonth()) throw this.error(400, 'dueDate must be a future month (YYYY-MM)');
      next.dueDate = dueDate;
      next.name = patch.name === undefined ? current.name : String(patch.name).trim().slice(0, 40);
      if (!next.name) throw this.error(400, 'name is required');
      next.category = patch.category === undefined ? current.category : String(patch.category);
      if (!GOAL_CATEGORIES[next.category]) throw this.error(400, `category must be one of ${Object.keys(GOAL_CATEGORIES).join(', ')}`);
      next.owner = patch.owner === undefined ? current.owner : String(patch.owner);
      if (!['household', 'primary'].includes(next.owner)) throw this.error(400, 'owner must be household (shared) or primary (just me)');
      next.saved = patch.saved === undefined ? Number(current.saved || 0) : Number(patch.saved);
      if (!Number.isFinite(next.saved) || next.saved < 0 || next.saved > next.amount) {
        throw this.error(400, 'saved must be between 0 and the goal amount');
      }
    } else if (current.type === 'EDUCATION') {
      const path = patch.path === undefined ? current.path : String(patch.path);
      if (!EDUCATION_PATHS[path]) throw this.error(400, 'path must be UNIVERSITY, POLYTECHNIC or UNDECIDED');
      next.path = path;
      if (path !== 'UNDECIDED') {
        const pathChanged = path !== current.path;
        const birthYear = current.suggested.startYear - EDUCATION_PATHS.UNIVERSITY.startAge;
        next.years = check('years', pathChanged && patch.years === undefined ? EDUCATION_PATHS[path].years : number('years'));
        next.annualCost = check('annualCost', pathChanged && patch.annualCost === undefined ? EDUCATION_PATHS[path].annualCost : number('annualCost'));
        const startYear = pathChanged && patch.startYear === undefined ? birthYear + EDUCATION_PATHS[path].startAge : number('startYear');
        if (!Number.isInteger(startYear) || startYear <= new Date().getFullYear() || startYear > birthYear + 30) {
          throw this.error(400, 'startYear must be a future year');
        }
        next.startYear = startYear;
        next.source = pathChanged ? EDUCATION_PATHS[path].source : current.source;
      }
    } else if (current.type === 'RETIREMENT') {
      next.retireAge = check('retireAge', number('retireAge'));
      next.amount = check('amount', number('amount'));
    }

    const saved = householdStore.saveGoalInput(household.id, key, {
      ...(householdStore.getGoalInputs(household.id)[key] || {}),
      ...next,
      confirmed: true,
      confirmedBy: actor,
      confirmedAt: new Date().toISOString()
    });
    return { key, ...saved };
  }

  // Priority is not set here: the family orders all goals together when building the plan.
  addCustom(householdId, { name, category = 'OTHER', owner = 'household', amount, saved = 0, dueDate } = {}) {
    const household = this.household(householdId);
    const key = `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    householdStore.saveGoalInput(household.id, key, {
      key, type: 'CUSTOM', owner: 'household', enabled: true, confirmed: false,
      name: '', category: 'OTHER', amount: 0, saved: 0, dueDate: null,
      source: 'Your own goal.'
    });
    try {
      return this.update(household.id, key, { name, category, owner, amount, saved, dueDate });
    } catch (error) {
      householdStore.removeGoalInput(household.id, key);
      throw error;
    }
  }

  // Custom goals are deleted; suggested goals are switched off so they can be switched back on.
  remove(householdId, key) {
    const household = this.household(householdId);
    const current = this.getInputs(household).find((input) => input.key === key);
    if (!current) throw this.error(404, 'Goal not found');
    if (current.type === 'CUSTOM') {
      householdStore.removeGoalInput(household.id, key);
      return { key, removed: true };
    }
    return this.update(household.id, key, { enabled: false }, current.owner === 'partner' ? 'partner' : 'primary');
  }

  household(householdId) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) throw this.error(404, 'Household not found');
    return household;
  }

  error(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
  }
}

module.exports = new GoalInputService();
module.exports.EDUCATION_PATHS = EDUCATION_PATHS;
module.exports.GOAL_CATEGORIES = GOAL_CATEGORIES;
