const householdStore = require('../models/householdStore');
const optimiserService = require('./optimiserService');
const { partnerConsented } = require('./goalInputService');

/**
 * One family plan. It starts as the optimiser's recommended plan; either adult can change the
 * order or the monthly amounts (through the plan assistant), which makes it the family's own plan
 * and clears the other adult's approval. Once every adult in the plan approves it, it is agreed
 * and can be activated. Agreeing never moves money.
 */
class PlanAgreementService {
  household(householdId) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) throw this.error(404, 'Household not found');
    return household;
  }

  adults(household) {
    return partnerConsented(household) ? ['primary', 'partner'] : ['primary'];
  }

  actorCheck(household, actor) {
    if (actor === 'partner' && !partnerConsented(household)) throw this.error(403, 'Your partner has not joined the plan yet');
  }

  current(householdId) {
    const household = this.household(householdId);
    const optimised = optimiserService.optimise(household);
    const definition = householdStore.getCustomPlan(household.id);
    const plan = definition
      ? optimiserService.customPlan(household, definition).plan
      : optimised.plans.find((item) => item.id === optimised.recommendedPlanId);
    const adults = this.adults(household);
    const agreement = householdStore.getPlanAgreement(household.id);
    const approvals = Object.fromEntries(adults.map((member) => [member, Boolean(agreement.approvals?.[member])]));
    return {
      plan,
      investable: optimised.investable,
      contributions: optimised.contributions,
      lumpSum: optimised.lumpSum,
      adults,
      approvals,
      editedBy: agreement.editedBy || null,
      agreed: adults.every((member) => approvals[member])
    };
  }

  edit(householdId, { order, monthlyOverrides } = {}, actor = 'primary') {
    const household = this.household(householdId);
    this.actorCheck(household, actor);
    const { plan } = optimiserService.customPlan(household, { order, monthlyOverrides });
    householdStore.saveCustomPlan(household.id, plan.definition);
    householdStore.savePlanAgreement(household.id, { approvals: { [actor]: true }, editedBy: actor });
    return this.current(household.id);
  }

  // Back to the recommended plan; that is a change too, so the other adult approves it again.
  reset(householdId, actor = 'primary') {
    const household = this.household(householdId);
    this.actorCheck(household, actor);
    householdStore.clearCustomPlan(household.id);
    householdStore.savePlanAgreement(household.id, { approvals: { [actor]: true }, editedBy: actor });
    return this.current(household.id);
  }

  approve(householdId, actor = 'primary') {
    const household = this.household(householdId);
    this.actorCheck(household, actor);
    const agreement = householdStore.getPlanAgreement(household.id);
    householdStore.savePlanAgreement(household.id, { ...agreement, approvals: { ...(agreement.approvals || {}), [actor]: true } });
    const result = this.current(household.id);
    if (result.agreed) {
      // Recorded like an agreed proposal, which plan activation requires.
      householdStore.recordAgreement(household.id, { planId: result.plan.id, planName: result.plan.name, routes: result.plan.routes });
    }
    return result;
  }

  error(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
  }
}

module.exports = new PlanAgreementService();
