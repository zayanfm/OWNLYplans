const householdStore = require('../models/householdStore');
const goalInputService = require('./goalInputService');
const planAgreementService = require('./planAgreementService');
const { buildGoals, essentialMonthly } = require('./goalModel');
const { addMonthsIso, monthsToReach, monthsUntil, money } = require('../utils/finance');

const PRICE_RISE = 0.1;
const ESSENTIALS_RISE = 200;
const BILL_DROP = 150;
const CDA_TOP_UP = 1000;

const roundTo = (value, step) => Math.round(value / step) * step;
const later = (a, b) => (a > b ? a : b);

/**
 * Plan alerts (Smart Family Review, #10). Big changes, good or bad, that move when a goal will
 * be reached. Each alert keeps the monthly amounts as they are and proposes moving the goal's
 * date instead; the family accepts or dismisses it. Nothing changes until someone accepts, and a
 * new date on a shared goal goes to the other adult to approve.
 *
 * In the prototype the "detected" changes are scripted from the family's own goals; the effect
 * on each goal is calculated by the planning engine.
 */
class AlertService {
  household(householdId) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) throw this.error(404, 'Household not found');
    return household;
  }

  // When a goal is reached with its current monthly amount from the agreed plan.
  reachedBy(goal, monthly, target, current = goal.currentAmount) {
    if (current >= target) return addMonthsIso(0);
    if (!monthly) return null;
    const months = monthsToReach(current, target, monthly, goal.annualRate);
    return months === null ? null : addMonthsIso(months);
  }

  build(household) {
    const goals = buildGoals(household).filter((goal) => goal.planned && goal.owner === 'household');
    const plan = planAgreementService.current(household.id).plan;
    const monthlyFor = (key) => plan.goals.find((goal) => goal.key === key)?.monthlyNow || 0;
    const alerts = [];

    // Bad news: one goal costs more, so with the same monthly amount it finishes later.
    // A date that can move (a holiday, a car) before one that usually can't (a home purchase).
    const custom = goals.find((goal) => goal.input.type === 'CUSTOM' && goal.input.category !== 'HOUSING')
      || goals.find((goal) => goal.input.type === 'CUSTOM');
    const emergency = goals.find((goal) => goal.key === 'emergency');
    if (custom) {
      const monthly = monthlyFor(custom.key);
      const amount = roundTo(custom.targetAmount * (1 + PRICE_RISE), 100);
      const before = this.reachedBy(custom, monthly, custom.targetAmount);
      const after = this.reachedBy(custom, monthly, amount);
      if (before && after) {
        const deadline = later(custom.deadline, after);
        alerts.push({
          id: `cost_up_${custom.key}`,
          tone: 'NEGATIVE',
          title: `${custom.name} costs more`,
          detail: `Prices look about ${Math.round(PRICE_RISE * 100)}% higher: ${money(amount)}, up from ${money(custom.targetAmount)}.`,
          goalKey: custom.key,
          goalName: custom.name,
          monthly,
          before: { deadline: custom.deadline, reachedBy: before },
          after: { deadline, reachedBy: after },
          apply: (actor) => goalInputService.update(household.id, custom.key, { amount, dueDate: deadline }, actor)
        });
      }
    } else if (emergency) {
      const monthly = monthlyFor('emergency');
      const months = emergency.input.months;
      const target = (essentialMonthly(household.financials) + ESSENTIALS_RISE) * months;
      const before = this.reachedBy(emergency, monthly, emergency.targetAmount);
      const after = this.reachedBy(emergency, monthly, target);
      if (before && after) {
        const withinMonths = Math.min(36, Math.max(emergency.input.withinMonths, monthsUntil(after)));
        alerts.push({
          id: 'essentials_up_emergency',
          tone: 'NEGATIVE',
          title: 'Everyday essentials went up',
          detail: `Groceries and utilities are about ${money(ESSENTIALS_RISE)}/month higher over the last 3 months, so ${months} months of essentials is now ${money(target)}.`,
          goalKey: 'emergency',
          goalName: emergency.name,
          monthly,
          before: { deadline: emergency.deadline, reachedBy: before },
          after: { deadline: addMonthsIso(withinMonths), reachedBy: after },
          apply: (actor) => {
            this.changeCommitment(household, { id: 'detected_essentials', label: 'Higher groceries and utilities', category: 'FOOD', essential: true, owner: 'joint' }, ESSENTIALS_RISE);
            return goalInputService.update(household.id, 'emergency', { withinMonths }, actor);
          }
        });
      }
    }

    // Good news: a goal needs less, so with the same monthly amount it finishes sooner.
    const childcare = (household.financials.commitments || []).find((item) => item.category === 'CHILDCARE' && item.essential && item.monthlyAmount >= BILL_DROP);
    const education = goals.find((goal) => goal.input.type === 'EDUCATION');
    if (emergency && custom && childcare) {
      const monthly = monthlyFor('emergency');
      const target = (essentialMonthly(household.financials) - BILL_DROP) * emergency.input.months;
      const before = this.reachedBy(emergency, monthly, emergency.targetAmount);
      const after = this.reachedBy(emergency, monthly, target);
      if (before && after) {
        // Bring the date forward only if the goal now finishes before it; otherwise keep the date.
        const sooner = after < emergency.deadline;
        const withinMonths = sooner ? Math.max(6, monthsUntil(after)) : emergency.input.withinMonths;
        alerts.push({
          id: 'bills_down_emergency',
          tone: 'POSITIVE',
          title: `${childcare.label} is cheaper`,
          detail: `Payments fell by ${money(BILL_DROP)}/month for the last 2 months, so your emergency savings need ${money(emergency.targetAmount - target)} less.`,
          goalKey: 'emergency',
          goalName: emergency.name,
          monthly,
          before: { deadline: emergency.deadline, reachedBy: before },
          after: { deadline: sooner ? addMonthsIso(withinMonths) : emergency.deadline, reachedBy: after },
          apply: (actor) => {
            this.changeCommitment(household, childcare, -BILL_DROP);
            return sooner ? goalInputService.update(household.id, 'emergency', { withinMonths }, actor) : null;
          }
        });
      }
    } else if (education) {
      const monthly = monthlyFor(education.key);
      const before = this.reachedBy(education, monthly, education.targetAmount);
      const after = this.reachedBy(education, monthly, education.targetAmount, education.currentAmount + CDA_TOP_UP);
      const child = String(education.childName || 'your child').split(' ')[0];
      if (before && after) {
        alerts.push({
          id: `cda_top_up_${education.key}`,
          tone: 'POSITIVE',
          title: `${money(CDA_TOP_UP)} government top-up for ${child}`,
          detail: `Credited to ${child}'s Child Development Account. It counts toward education, so the goal is reached sooner. The start date stays the same.`,
          goalKey: education.key,
          goalName: education.name,
          monthly,
          before: { deadline: education.deadline, reachedBy: before },
          after: { deadline: education.deadline, reachedBy: after },
          apply: () => {
            const record = household.dependents.filter((item) => item.relation === 'Child')[education.input.childIndex];
            if (record?.cda) record.cda.balance = Number(record.cda.balance || 0) + CDA_TOP_UP;
            householdStore.recordAudit(household.id, 'CDA_TOP_UP_COUNTED', { child: record?.name, amount: CDA_TOP_UP });
            return null;
          }
        });
      }
    }

    // One good and one bad alert at a time: once one is answered, no other takes its place.
    const decisions = householdStore.getAlertDecisions(household.id);
    return alerts.map((alert) => ({ ...alert, decision: decisions[alert.id] || decisions[`slot_${alert.tone}`] || null }));
  }

  // A recurring cost appears or changes; household totals follow.
  changeCommitment(household, item, delta) {
    const { financials } = household;
    financials.commitments = financials.commitments || [];
    const existing = financials.commitments.find((commitment) => commitment.id === item.id);
    if (existing) existing.monthlyAmount += delta;
    else financials.commitments.push({ ...item, monthlyAmount: delta });
    financials.householdMonthlyExpenses += delta;
    financials.monthlySurplus -= delta;
  }

  list(householdId) {
    const household = this.household(householdId);
    return this.build(household).filter((alert) => !alert.decision).map(({ apply, ...visible }) => visible);
  }

  // expectedDeadline: the date the person saw. If the plan has moved since, they look again first.
  respond(householdId, alertId, decision, actor = 'primary', expectedDeadline = null) {
    if (!['accept', 'dismiss'].includes(decision)) throw this.error(400, 'decision must be accept or dismiss');
    const household = this.household(householdId);
    const alert = this.build(household).find((item) => item.id === alertId);
    if (!alert) throw this.error(404, 'Alert not found');
    if (alert.decision) throw this.error(409, 'This alert has already been answered');
    if (decision === 'accept' && expectedDeadline && expectedDeadline !== alert.after.deadline) {
      throw this.error(409, 'The plan has changed since this alert was shown. Take another look.');
    }
    if (decision === 'accept') alert.apply(actor);
    householdStore.saveAlertDecision(household.id, alertId, decision === 'accept' ? 'ACCEPTED' : 'DISMISSED', actor);
    householdStore.saveAlertDecision(household.id, `slot_${alert.tone}`, 'ANSWERED', actor);
    return { alertId, decision };
  }

  error(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
  }
}

module.exports = new AlertService();
