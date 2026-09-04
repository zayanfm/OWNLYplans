import type { MockPassAuthResponse } from '../../services/api';
import type { GoalOutlook, HouseholdSnapshot, OwnlyPlan, PlanRouteId, PredictionScenario } from './types';

const titleCase = (value: string) => value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};
const monthCount = (from: Date, to: Date) => Math.max(1,
  (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth());
const formatMonth = (date: Date) => date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });

export const futureValue = (current: number, monthly: number, annualRate: number, months: number) => {
  const monthlyRate = annualRate / 12;
  if (!monthlyRate) return Math.round(current + monthly * months);
  return Math.round(current * Math.pow(1 + monthlyRate, months)
    + monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
};

const monthlyNeeded = (current: number, target: number, annualRate: number, months: number) => {
  const monthlyRate = annualRate / 12;
  const grownCurrent = current * Math.pow(1 + monthlyRate, months);
  if (!monthlyRate) return Math.max(0, Math.ceil((target - current) / months));
  const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return Math.max(0, Math.ceil((target - grownCurrent) / factor));
};

const completionDate = (current: number, target: number, monthly: number, annualRate: number, now: Date) => {
  if (current >= target) return formatMonth(now);
  for (let months = 1; months <= 360; months += 1) {
    if (futureValue(current, monthly, annualRate, months) >= target) return formatMonth(addMonths(now, months));
  }
  return 'Beyond 30 years';
};

const scenarioRate = (scenario: PredictionScenario) => scenario === 'growth' ? 0.065 : scenario === 'conservative' ? 0.025 : 0.045;

export const personalizePlan = (
  plan: OwnlyPlan,
  profile: MockPassAuthResponse | null,
  aggregate: any | null,
): OwnlyPlan => {
  const now = new Date();
  const rawName = profile?.user?.name || plan.householdSnapshot?.primaryName || 'Freya Lim Guo En';
  const primaryName = titleCase(rawName);
  const firstName = primaryName.split(' ')[0] || 'Freya';
  const dependentNames = (profile?.household?.dependents || []).map((dependent: any) => titleCase(dependent.name || 'Dependent'));
  const primaryTakeHome = profile?.user?.monthlyTakeHome || 3600;
  const monthlyTakeHome = aggregate?.summary?.monthlyHouseholdTakeHome || primaryTakeHome;
  const monthlyExpenses = aggregate?.summary?.monthlyHouseholdExpenses || Math.max(0, monthlyTakeHome - plan.monthlySurplus);
  const otherIncome = Math.max(0, monthlyTakeHome - primaryTakeHome);
  const snapshot: HouseholdSnapshot = {
    primaryName,
    firstName,
    householdLabel: `${firstName}'s family`,
    dependentNames,
    dependentCount: profile?.household?.dependentsCount ?? dependentNames.length,
    housingType: profile?.household?.housing?.type || 'Housing record unavailable',
    monthlyTakeHome,
    monthlyExpenses,
    monthlySurplus: plan.monthlySurplus,
    contributors: [
      { label: firstName, amount: Math.min(primaryTakeHome, monthlyTakeHome) },
      ...(otherIncome > 0 ? [{ label: 'Other linked income', amount: otherIncome }] : []),
    ],
    totalLiquidCash: aggregate?.summary?.totalLiquidCash || 0,
    totalInvestments: aggregate?.summary?.totalInvestments || 0,
    cpfTotal: profile ? Object.values(profile.user.cpf || {}).reduce((sum, value) => sum + Number(value || 0), 0) : (aggregate?.summary?.householdCpfTotal || 0),
    emergencyFund: aggregate?.summary?.emergencyFund || 0,
    lastSynced: aggregate?.sgfindexConsent?.lastSynced || profile?.authenticatedAt || new Date().toISOString(),
  };

  const rates: Record<PlanRouteId, number> = {
    housing: 0.015,
    education: scenarioRate(plan.predictionScenario),
    wealth: scenarioRate(plan.predictionScenario),
  };
  const selectedDeadline = addMonths(now, plan.timelineYears * 12);
  const housingPayment = Number(profile?.household?.housing?.monthlyLoanInstalment || 1500);
  const excessCash = Math.max(0, snapshot.totalLiquidCash - snapshot.emergencyFund);
  const baselines: Record<PlanRouteId, { label: string; current: number; target: number; date: Date; data: string[] }> = {
    housing: {
      label: snapshot.housingType.includes('BTO') ? 'Home purchase fund' : 'Home loan safety reserve',
      current: excessCash,
      target: snapshot.housingType.includes('BTO') ? 96000 : housingPayment * 12,
      date: selectedDeadline,
      data: [snapshot.housingType, `S$${snapshot.totalLiquidCash.toLocaleString()} liquid cash`, `S$${snapshot.emergencyFund.toLocaleString()} emergency floor`],
    },
    education: {
      label: `${snapshot.dependentCount || 1}-child education fund`,
      current: Math.min(8000, snapshot.totalLiquidCash * 0.2),
      target: Math.max(30000, (snapshot.dependentCount || 1) * 30000),
      date: selectedDeadline,
      data: [...(dependentNames.length ? dependentNames : ['Dependent profile']), 'S$30K planning target per child', `S$${Math.round(Math.min(8000, snapshot.totalLiquidCash * 0.2)).toLocaleString()} illustrative starting allocation`, `${plan.timelineYears}-year selected goal horizon`],
    },
    wealth: {
      label: (profile?.user?.age || 0) >= 55 ? 'Retirement & liquid wealth' : 'Long-term family wealth',
      current: snapshot.totalInvestments + Number(profile?.user?.cpf?.sa || 0),
      target: 120000,
      date: selectedDeadline,
      data: [`S$${snapshot.totalInvestments.toLocaleString()} investments`, `S$${Number(profile?.user?.cpf?.sa || 0).toLocaleString()} CPF SA`, `${plan.timelineYears}-year horizon`],
    },
  };

  const goalOutlooks: GoalOutlook[] = plan.routes.map((route) => {
    const baseline = baselines[route.key];
    const months = monthCount(now, baseline.date);
    const rate = rates[route.key];
    const projectedAtTarget = futureValue(baseline.current, route.monthlyAmount, rate, months);
    const needed = monthlyNeeded(baseline.current, baseline.target, rate, months);
    const status = baseline.current >= baseline.target ? 'REACHED' : projectedAtTarget >= baseline.target ? 'ON_TRACK' : 'AT_RISK';
    const gap = Math.max(0, needed - route.monthlyAmount);
    return {
      key: route.key,
      label: baseline.label,
      currentAmount: Math.round(baseline.current),
      targetAmount: baseline.target,
      targetDate: formatMonth(baseline.date),
      targetDateIso: baseline.date.toISOString(),
      monthlyContribution: route.monthlyAmount,
      projectedAtTarget,
      projectedCompletionDate: completionDate(baseline.current, baseline.target, route.monthlyAmount, rate, now),
      lowEstimate: futureValue(baseline.current, route.monthlyAmount, route.key === 'housing' ? rate : 0.025, months),
      highEstimate: futureValue(baseline.current, route.monthlyAmount, route.key === 'housing' ? rate : 0.065, months),
      status,
      shortfall: Math.max(0, baseline.target - projectedAtTarget),
      confidence: route.key === 'housing' ? 90 : plan.predictionScenario === 'growth' ? 68 : 82,
      recommendedMonthlyContribution: needed,
      actionText: status === 'AT_RISK'
        ? `Add S$${gap.toLocaleString()}/month to close the projected gap`
        : `Maintain S$${route.monthlyAmount.toLocaleString()}/month to stay on track`,
      returnRate: rate,
      dataUsed: baseline.data,
    };
  });

  const routeLabels: Record<PlanRouteId, { name: string; purpose: string; product: string }> = {
    housing: { name: baselines.housing.label, purpose: 'Protect mortgage payments without touching the emergency fund', product: 'OCBC 360 Savings Goal' },
    education: { name: baselines.education.label, purpose: 'Build education funds by the selected goal horizon', product: 'OCBC Savings Goal + RoboInvest' },
    wealth: { name: baselines.wealth.label, purpose: 'Grow retirement-ready assets while retaining liquidity', product: 'OCBC RoboInvest + CPF' },
  };

  return {
    ...plan,
    householdSnapshot: snapshot,
    goalOutlooks,
    routes: plan.routes.map((route) => ({
      ...route,
      name: routeLabels[route.key].name,
      purpose: routeLabels[route.key].purpose,
      targetProduct: routeLabels[route.key].product,
    })),
    milestones: goalOutlooks.map((goal) => ({
      year: goal.projectedCompletionDate,
      icon: goal.key,
      title: `${goal.label}: ${goal.status === 'AT_RISK' ? 'adjustment needed' : 'on track'}`,
      detail: goal.actionText,
    })),
  };
};
