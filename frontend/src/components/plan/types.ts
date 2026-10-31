export type OwnlyStep =
  | 'intro'
  | 'singpass'
  | 'household'
  | 'picture'
  | 'plan'
  | 'cockpit';

export type PlanRouteId = 'housing' | 'education' | 'wealth';
// Every transfer waits for the account owner's confirmation; there is no automatic mode.
export type PlanMode = 'NOTIFY_AND_WAIT';
export type PredictionScenario = 'conservative' | 'balanced' | 'growth';

export interface GoalOutlook {
  key: PlanRouteId;
  label: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  targetDateIso: string;
  monthlyContribution: number;
  projectedAtTarget: number;
  projectedCompletionDate: string;
  lowEstimate: number;
  highEstimate: number;
  status: 'REACHED' | 'ON_TRACK' | 'AT_RISK';
  shortfall: number;
  confidence: number;
  recommendedMonthlyContribution: number;
  actionText: string;
  returnRate: number;
  dataUsed: string[];
}

export interface HouseholdSnapshot {
  primaryName: string;
  firstName: string;
  partnerName?: string;
  householdLabel: string;
  dependentNames: string[];
  dependentCount: number;
  housingType: string;
  monthlyTakeHome: number;
  monthlyExpenses: number;
  monthlySurplus: number;
  contributors: Array<{ label: string; amount: number }>;
  totalLiquidCash: number;
  totalInvestments: number;
  cpfTotal: number;
  emergencyFund: number;
  lastSynced: string;
}

export interface PlanRoute {
  id: string;
  key: PlanRouteId;
  name: string;
  targetProduct: string;
  monthlyAmount: number;
  percentage: number;
  projectedAtEnd: number;
  purpose: string;
  status: string;
}

export interface OwnlyPlan {
  householdId?: string;
  monthlySurplus: number;
  investableSurplus: number;
  timelineYears: number;
  autonomyMode: PlanMode;
  predictionScenario: PredictionScenario;
  priorities: PlanRouteId[];
  routes: PlanRoute[];
  protection: {
    enabled: boolean;
    tier: 'essential' | 'enhanced';
    monthlyPremium: number;
    coverageAmount: number;
    protectionGapClosed: number;
  };
  assumptions: {
    annualReturnRate: number;
    inflationRate: number;
  };
  householdSnapshot?: HouseholdSnapshot;
  goalOutlooks?: GoalOutlook[];
  summary: {
    totalMonthlyRouted: number;
    totalMonthlyCommitted: number;
    projected5YearAccumulation: number;
    projected10YearAccumulation: number;
    projectedAtHorizon: number;
    annualYieldLift: string;
  };
  milestones?: Array<{ year: string; icon: string; title: string; detail: string }>;
  guardrails?: Record<string, string>;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'Spouse' | 'Child' | 'Parent';
  maskedNric: string;
  selected: boolean;
  status: 'IDLE' | 'PENDING' | 'APPROVED';
}
