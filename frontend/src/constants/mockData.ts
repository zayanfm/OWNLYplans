// frontend/src/constants/mockData.ts

export interface AgentStatus {
  id: string;
  icon: string;
  color: string;
  text: string;
  badge: string;
  name: string;
  status: string;
}

export interface AgentRecommendation extends AgentStatus {
  label: string;
  conf: number;
  finding: string;
  action: string;
}

export interface FinancialAccount {
  id: string;
  avatar?: string;
  avatarBg?: string;
  label: string;
  sub?: string;
  bal?: string;
  balance?: string;
  accountNumber?: string;
  field?: string;
  field2?: string;
  field2val?: string;
}

export interface PromoCard {
  id: string;
  logo: string;
  brand: string;
  title: string;
  sub: string;
  tag: string;
  tagCls: string;
  cta: string;
  grad: string;
}

export interface Milestone {
  year: string;
  icon: string;
  title: string;
  detail: string;
}

export const USER = {
  first: 'Alex',
  partner: 'Lila',
  segment: 'Young family with one child'
};

export const COPY = {
  logout: 'Logout',
  start: 'START',
  next: 'Next',
  edit: 'Edit',
  agree: 'Agree',
  disagree: 'Disagree',
  continue: 'Continue →',
  submitInvite: 'Submit Invitation →',
  generatePlan: 'Generate Plan',
  approvePlan: 'Approve Plan',
  backHome: 'Back to Home',
  approveExecute: 'Approve & Execute Plan',
  executing: 'Executing Plan…',
  seeAll: 'See all →',
  getStarted: 'Get started →',
  whatsThis: "What's this?",
  currentMode: 'Current mode',
  tapToExpand: 'Tap to expand',
  highestPriority: 'Highest Priority',
  dragToAdjust: 'Drag to adjust',
  planVerified: 'Plan verified',
  aiActive: 'AI Active',
  live: 'LIVE',
  ready: 'Ready',
  source: 'SOURCE',
  done: 'DONE',
  active: 'ACTIVE',
  filtered: 'FILTERED',
  new: 'NEW',
};

export const ANOMALY_NOTICE = {
  title: 'Cashflow Anomaly Detected',
  detail: 'Scheduled bill payment exceeds average monthly range by 18%',
  badge: 'ACTION REQUIRED',
};

export const ALLOCATION_NOTICE = {
  icon: '⏱️',
  text: 'Yield Optimisation Timing Window Active',
  badge: 'AUTO-ROUTING ENABLED',
};

export const ALLOCATION_SOURCE = {
  avatar: 'SA',
  label: 'Multiplier Account (Surplus)',
  sub: 'Available: S$ 12,450.00',
  tag: 'AUTO',
};

export const FINANCE = {
  yieldLift: '+2.4% p.a.',
};

export const AUTONOMY_MODES = {
  Low: { style: 'Notify Only', pill: 'Notify Only', cls: 'text-blue-600', bg: '#2563EB', ring: 'border-blue-100 bg-blue-50' },
  Medium: { style: 'Ask First', pill: 'Ask First', cls: 'text-[#D81E05]', bg: '#D81E05', ring: 'border-red-100 bg-red-50' },
  High: { style: 'Auto-Cap · S$500', pill: 'Auto-Cap · S$500', cls: 'text-green-600', bg: '#16A34A', ring: 'border-green-100 bg-green-50' },
};

export const ALLOC_ROUTES = [
  { to: 'LionGlobal SGD MMF', amt: 'S$1,000', yield: '3.85% p.a.', icon: '💰', color: '#2563EB' },
  { to: 'Home Loan Reserve', amt: 'S$200', yield: 'Selected goal horizon', icon: '🏠', color: '#16A34A' },
  { to: 'FRANK Auto-pay', amt: 'S$1,240', yield: 'Clears balance', icon: '💳', color: '#9333EA' },
];

export const AGENT_STATUSES: AgentStatus[] = [
  { id: '1', icon: '🤖', name: 'Yield Optimizer', status: 'OPTIMAL', color: 'border-green-200 bg-green-50', text: 'text-green-900', badge: 'bg-green-100 text-green-800' },
  { id: '2', icon: '🛡️', name: 'Risk Sentinel', status: 'BALANCED', color: 'border-blue-200 bg-blue-50', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' },
  { id: '3', icon: '⚡', name: 'Liquidity Router', status: 'ACTIVE', color: 'border-purple-200 bg-purple-50', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800' },
  { id: '4', icon: '⚖️', name: 'Tax Guard', status: 'MONITORING', color: 'border-amber-200 bg-amber-50', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' },
];

export const AGENT_RECOMMENDATIONS: AgentRecommendation[] = [
  { id: 'cashflow', icon: '💸', label: 'Cashflow Agent', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', name: 'Cashflow Forecast', status: 'Surplus Verified', conf: 94, finding: 'S$1,340 monthly surplus confirmed.', action: 'Route S$1,000 → LionGlobal MMF at 3.85% p.a.' },
  { id: 'spending', icon: '🛒', label: 'Spending Agent', color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', name: 'Spending Pattern', status: 'Outliers Filtered', conf: 87, finding: 'F&B +18% vs last month · Dining Out.', action: 'Soft cap S$420/mo · Alert at 80%.' },
  { id: 'goal', icon: '🎯', label: 'Goal Agent', color: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800', name: 'Goal Optimiser', status: 'Goals Tested', conf: 91, finding: 'Home, education and retirement tested against the selected horizon.', action: 'Adjust monthly contributions before activating.' },
  { id: 'protection', icon: '🛡️', label: 'Protection Agent', color: 'bg-purple-50 border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', name: 'Protection & Opps', status: 'GE Gap Identified', conf: 89, finding: 'Life cover gap: S$160K vs recommended.', action: 'GE FlexiLife Health plan · est. S$28/mo.' },
];

export const HELP_SECTIONS = [
  {
    id: '1',
    icon: '🧠',
    title: 'Multi-Agent Autonomous Strategy',
    sub: 'How decisions are generated and validated',
    items: [
      { label: 'Continuous Monitoring', text: 'Autonomous agents monitor idle cash yields, tax offsets, and market volatility in real time to suggest optimal rebalancing paths.' },
      { label: 'Human-in-the-Loop', text: 'Every surplus allocation route requires structural verification before capital movement occurs.' },
    ],
  },
  {
    id: '2',
    icon: '🔒',
    title: 'Security & Custody',
    sub: 'Bank-grade encryption and isolated execution',
    items: [
      { label: 'Encrypted Routing', text: 'All API payloads use AES-256 end-to-end encryption with zero plain-text credential persistence.' },
    ],
  },
];

export const GOVERNANCE_GUARDRAILS = [
  { icon: '🛡️', label: 'Maximum Drawdown Cap', sub: 'Hard stop triggered at 5% daily variance' },
  { icon: '🔐', label: 'Zero Unverified Transfers', sub: 'Multi-factor authentication enforced on exterior routing' },
];

export const ACCOUNTS: FinancialAccount[] = [
  { id: 'frank', avatar: 'FRA', avatarBg: '#E8A07A', label: 'OCBC FRANK Account', sub: '•••  •••  •', bal: 'S$ •,•••.••', field: 'Available balance', field2: 'Debit card no.', field2val: '•• •  ••••  ••••  • ••' },
  { id: 'three60', avatar: '360', avatarBg: '#7AB5E8', label: 'OCBC 360 Account', sub: '•••• 4892', bal: 'S$24,180.33', field: 'Available balance', field2: 'Savings bonus', field2val: 'S$12.80/mo' },
  { id: 'mmf', avatar: 'MMF', avatarBg: '#89C48A', label: 'LionGlobal SGD MMF', sub: 'Auto-surplus', bal: 'S$8,500.00', field: 'Available balance', field2: 'Yield p.a.', field2val: '3.85%' },
];

export const CARDS: FinancialAccount[] = [
  { id: 'frank-card', avatar: 'FRA', avatarBg: '#E8A07A', label: 'OCBC FRANK Card', sub: '•••• 1107', bal: 'S$1,240.80', field: 'Outstanding', field2: 'Cashback (MTD)', field2val: 'S$18.40' }
];

export const INVESTMENTS: FinancialAccount[] = [
  { id: 'sec', avatar: 'SGX', avatarBg: '#B07AE8', label: 'OCBC Securities', sub: 'Portfolio', bal: 'S$18,450.00', field: 'Market value', field2: 'Return (MTD)', field2val: '+3.2%  ▲' }
];

export const FINANCE_METRICS = {
  monthlySurplus: 1340,
  mmfYield: '3.85%',
  yieldLift: '0.05% → 3.85%',
  btoPct: 68,
  btoCurrent: 'S$40,800',
  btoTarget: 'S$60K',
  btoTargetLong: 'S$60,000',
  btoDeadline: 'Dec 2027',
  emergencyFund: 'S$24,000',
  portfolio: 'S$18,450',
  portfolioTarget: 'S$50K',
  portfolioReturn: '+3.2%',
  protectionGap: 'S$160K',
  gePremium: 'S$28/mo',
  estimatedGain: '+S$340/mo',
  wealthByTimeline: { '5': '+S$200K', '10': '+S$500K' },
  splitDefault: 60,
  timelineDefault: '5',
};

// Offline fixtures mirror the Alex MockPass sandbox household.
export const FALLBACK_MYINFO = {
  success: true,
  authenticatedAt: '',
  authMethod: 'OWNLY_MOCKPASS_OAUTH2',
  authProvider: 'OWNLYplans MockPass Sandbox',
  personaId: 'alex_family',
  personaName: 'Alex Lim Family',
  segment: 'Young Family with One Child',
  user: {
    nric: 'S****23A',
    name: 'Alex Lim',
    age: 31,
    citizenship: 'Singapore Citizen',
    maritalStatus: 'Married',
    employment: 'Product Lead (Technology)',
    monthlyGrossIncome: 5500,
    monthlyTakeHome: 4400,
    cpf: { oa: 42000, sa: 28000, ma: 18000 },
    verified: true,
  },
  partner: {
    nric: 'S****56B', name: 'Lila Tan', age: 29, citizenship: 'Singapore Citizen',
    employment: 'Marketing Manager', monthlyGrossIncome: 4800, monthlyTakeHome: 3840,
    cpf: { oa: 38000, sa: 22000, ma: 16000 }, linked: true,
  },
  household: {
    segment: 'Young Family with One Child',
    dependentsCount: 1,
    dependents: [
      { name: 'Percy Lim', relation: 'Child', age: 3, birthDate: '2023-04-18', nric: 'T****91Z' },
    ],
    housing: { type: '4-Room BTO (Pending)', town: 'Tengah Garden District', downpaymentRequired: 96000, downpaymentAccumulated: 80000, keyCollectionDate: '2028-09', monthlyLoanInstalment: 0, outstandingLoanBalance: 0 },
  },
};

export const FALLBACK_FAMILY_MEMBERS = [
  { id: 'spouse', name: 'Lila Tan', relation: 'Spouse', maskedNric: 'S****56B' },
  { id: 'child-1', name: 'Percy Lim', relation: 'Child', maskedNric: 'T****91Z' },
];

export const FALLBACK_SGFINDEX_INSTITUTIONS = [
  { id: 'ocbc', name: 'OCBC Bank', detail: 'Deposits, cards & investments' },
  { id: 'dbs', name: 'DBS Bank', detail: 'Multiplier Account' },
  { id: 'uob', name: 'UOB Bank', detail: 'One Account' },
  { id: 'cpf', name: 'CPF Board', detail: 'OA · SA · MediSave' },
  { id: 'iras', name: 'IRAS', detail: 'Notice of Assessment' },
];

export const FALLBACK_SGFINDEX_AGGREGATE = {
  success: true,
  summary: {
    totalLiquidCash: 36000,
    totalInvestments: 14200,
    householdCpfTotal: 164000,
    totalAssets: 214200,
    totalLiabilities: 0,
    netWorth: 214200,
    monthlyHouseholdIncome: 10300,
    monthlyHouseholdTakeHome: 8240,
    monthlyHouseholdExpenses: 6900,
    monthlySurplus: 1340,
    emergencyFund: 28000,
    emergencyBufferMonths: 4.1,
  },
};

export const PLAN_MILESTONES: Record<string, Milestone[]> = {
  '5': [
    { year: 'Year 1', icon: '💰', title: 'Emergency Fund Complete', detail: 'S$24,000 fully funded · 3-month buffer secured' },
    { year: 'Year 5', icon: '🏠', title: 'Home Loan Reserve', detail: '12 months of mortgage payments targeted outside the emergency fund' },
    { year: 'Year 3', icon: '🛡️', title: 'Protection Optimised', detail: 'Life + health coverage gap closed · GE FlexiLife active' },
    { year: 'Year 4', icon: '📈', title: 'Portfolio Growth', detail: 'Investment target S$50,000 · MMF + equities diversified' },
    { year: 'Year 5', icon: '✨', title: 'Financial Freedom', detail: 'Net worth S$200,000+ · Passive income S$800/mo' },
  ],
  '10': [
    { year: 'Year 10', icon: '🏠', title: 'Home Loan Reserve', detail: 'Lower monthly contribution across the longer goal horizon' },
    { year: 'Year 4', icon: '👶', title: 'Education Fund Starts', detail: 'Child education pot · S$300/mo allocation begins' },
    { year: 'Year 6', icon: '📈', title: 'Investment Milestone', detail: 'Equity portfolio S$120,000 · Diversified across asset class' },
    { year: 'Year 8', icon: '🏢', title: 'Property Planning', detail: 'Investment property capital target S$200K · Planning begins' },
    { year: 'Year 10', icon: '🌅', title: 'Early Retirement Prep', detail: 'Retirement corpus S$500,000 · FIRE pathway at age 55' },
  ],
};

// Canonical OCBC-only balances, mirrored from backend/data/personas.json.
// SGFinDex totals also include S$13,000 held at DBS/UOB and S$164,000 in CPF.
export const MOCK_OCBC_ACCOUNTS = [
  { id: 'frank', label: 'OCBC FRANK Account', maskedNumber: '•••• 0002', balance: 4550, debitCardNumber: '4532-7814-9206-1148', avatarLabel: 'FRA', avatarBg: '#EE6C4D' },
  { id: '360', label: 'OCBC 360 Account', maskedNumber: '•••• 0001', balance: 18450, debitCardNumber: '5241-6830-1759-4027', avatarLabel: '360', avatarBg: '#60A5FA' },
];

export const MOCK_OCBC_POSITION = {
  deposits: 23000,
  investments: 14200,
  cardBalance: 0,
  total: 37200,
};
