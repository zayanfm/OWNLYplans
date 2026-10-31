const householdStore = require('../models/householdStore');
const optimiserService = require('./optimiserService');
const scenarioService = require('./scenarioService');
const healthAgent = require('../agents/healthAgent');
const { essentialMonthly } = require('./goalModel');
const { addMonthsIso, money } = require('../utils/finance');

const MIN_FLOOR_MONTHS = 3;
const LONG_HORIZON_MONTHS = 60;
// The scripted "3 months later" change used by the review demo.
const REVIEW_TRIGGER = { schoolFeesMonthly: 200 };

const getHousehold = (householdId) => {
  const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
  if (!household) {
    throw new Error('Household not found');
  }
  return household;
};

class GrowService {
  /**
   * Savings-to-Investment Journey (#9) and Wealth & Advisory Pathway (#11).
   * Investing is suggested only for long-horizon goals, once the emergency floor and the
   * short-term home goal are safe. Execution hands off to OCBC's existing investment flows,
   * which run their own suitability checks.
   */
  async getOverview(householdId = null) {
    const household = getHousehold(householdId);
    const optimised = optimiserService.optimise(household);
    const planId = household.activePlan?.optimiserPlanId || optimised.recommendedPlanId;
    const plan = optimised.plans.find((item) => item.id === planId) || optimised.plans[0];
    const floorMonths = Number((household.financials.emergencyFund / Math.max(1, essentialMonthly(household.financials))).toFixed(1));
    const housing = plan.goals.find((goal) => goal.key === 'housing');

    const checks = [
      { id: 'floor', label: `Emergency floor covers at least ${MIN_FLOOR_MONTHS} months of essentials`, detail: `${floorMonths} months today`, passed: floorMonths >= MIN_FLOOR_MONTHS },
      { id: 'short_term', label: 'Short-term home goal stays in cash and on track', detail: housing ? `${housing.name} due ${housing.deadline}` : 'No home goal', passed: !housing || housing.status === 'ON_TRACK' },
      { id: 'risk_profile', label: 'Risk profile on file', detail: household.riskProfile ? `${household.riskProfile.level}, reviewed ${household.riskProfile.lastReviewed}` : 'Complete a risk profile with OCBC', passed: Boolean(household.riskProfile) }
    ];
    const ready = checks.every((check) => check.passed);
    const longHorizon = plan.goals.filter((goal) => goal.routeKey !== 'housing' && goal.routeKey !== 'emergency'
      && goal.monthlyNow > 0 && goal.deadline >= addMonthsIso(LONG_HORIZON_MONTHS));
    const suggestions = ready ? longHorizon.map((goal) => ({
      goalKey: goal.key,
      goalName: goal.name,
      monthlyAmount: goal.monthlyNow,
      product: goal.routeKey === 'education' ? 'OCBC Blue Chip Investment Plan' : 'OCBC RoboInvest',
      horizon: goal.deadline
    })) : [];

    const health = await healthAgent.analyze(household);
    return {
      success: true,
      readiness: {
        ready,
        checks,
        suggestions,
        totalMonthly: suggestions.reduce((sum, item) => sum + item.monthlyAmount, 0),
        handoff: ready ? { label: 'Continue in OCBC', destination: 'OCBC investment set-up', note: 'OCBC confirms suitability and your instructions before anything is invested.' } : null,
        blockedReason: ready ? null : checks.find((check) => !check.passed).label
      },
      advisory: this.advisory(household, plan, health)
    };
  }

  advisory(household, plan, health) {
    const flags = [
      String(household.housing?.type || '').includes('BTO') && { id: 'bto', label: 'Upcoming BTO purchase and loan decisions' },
      (household.dependents || []).some((child) => child.relation === 'Child') && { id: 'young_child', label: 'Young child with education goals' },
      health.metrics.protectionGap > 0 && { id: 'protection', label: `${money(health.metrics.protectionGap)} protection gap` },
      plan.stepUps.length >= 2 && { id: 'sequencing', label: 'Several goals that depend on each other' }
    ].filter(Boolean);
    const recommended = flags.length >= 3;
    return {
      recommended,
      flags,
      title: recommended ? 'Talk to an OCBC adviser' : 'Advice available any time',
      reason: recommended
        ? `Your plan has ${flags.length} moving parts an adviser can help you weigh together.`
        : 'Your plan is straightforward today; book a review whenever you like.'
    };
  }

  /**
   * Smart Family Review (#10). Scripted for the prototype: "three months later" a recurring
   * school-fee increase is detected, and the plan is re-checked against it.
   */
  simulateReview(householdId = null) {
    const household = getHousehold(householdId);
    const planId = household.activePlan?.optimiserPlanId || 'balanced';
    const impact = scenarioService.simulate(household.id, REVIEW_TRIGGER, { planId });
    const changed = impact.goals.filter((goal) => goal.before && (goal.before.monthlyNow !== goal.after.monthlyNow || goal.before.status !== goal.after.status));
    const atRisk = impact.goals.filter((goal) => goal.after.status === 'AT_RISK');
    const review = {
      id: `review-${Date.now().toString(36)}`,
      detectedFor: addMonthsIso(3),
      trigger: {
        type: 'RECURRING_SPEND_INCREASE',
        description: `Childcare and school payments rose by ${money(REVIEW_TRIGGER.schoolFeesMonthly)}/month over the last 3 months.`
      },
      surplusBefore: impact.surplusBefore,
      surplusAfter: impact.surplusAfter,
      changes: changed,
      suggestions: [
        {
          id: 'accept',
          label: 'Accept the adjusted plan',
          detail: atRisk.length
            ? `${atRisk.map((goal) => goal.name).join(', ')} would finish later; everything else keeps its date.`
            : 'Every goal keeps its deadline.'
        },
        { id: 'revise', label: 'Cut back elsewhere instead', detail: `Free up ${money(REVIEW_TRIGGER.schoolFeesMonthly)}/month from lifestyle spending to keep the current plan.` },
        { id: 'reject', label: 'Ignore for now', detail: 'Keep the plan as it is and check again next month.' }
      ]
    };
    householdStore.recordAudit(household.id, 'REVIEW_RAISED', { reviewId: review.id, trigger: review.trigger.type });
    return review;
  }

  respondToReview(householdId = null, reviewId, decision) {
    if (!['accept', 'revise', 'reject'].includes(decision)) {
      throw new Error('Decision must be accept, revise or reject');
    }
    const household = getHousehold(householdId);
    householdStore.recordAudit(household.id, 'REVIEW_DECISION', { reviewId, decision });
    return { reviewId, decision, recordedAt: new Date().toISOString() };
  }
}

module.exports = new GrowService();
