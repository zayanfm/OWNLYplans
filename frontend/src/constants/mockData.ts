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
  first: 'Mary', 
  partner: 'Zayan', 
  segment: '25–44 Dual Income' 
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
  { to: 'BTO Goal Pot', amt: 'S$200', yield: 'Dec 2027 target', icon: '🏠', color: '#16A34A' },
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
  { id: 'goal', icon: '🎯', label: 'Goal Agent', color: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800', name: 'Goal Optimiser', status: 'MMF Yield Maxed', conf: 91, finding: 'BTO goal S$60K · Dec 2027 · On track ✓', action: '+S$200/mo allocation · hit target 2 months early.' },
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

export const PLAN_MILESTONES: Record<string, Milestone[]> = {
  '5': [
    { year: 'Year 1', icon: '💰', title: 'Emergency Fund Complete', detail: 'S$24,000 fully funded · 3-month buffer secured' },
    { year: 'Year 2', icon: '🏠', title: 'BTO Key Collection', detail: 'S$60,000 goal hit · Down payment & stamp duty ready' },
    { year: 'Year 3', icon: '🛡️', title: 'Protection Optimised', detail: 'Life + health coverage gap closed · GE FlexiLife active' },
    { year: 'Year 4', icon: '📈', title: 'Portfolio Growth', detail: 'Investment target S$50,000 · MMF + equities diversified' },
    { year: 'Year 5', icon: '✨', title: 'Financial Freedom', detail: 'Net worth S$200,000+ · Passive income S$800/mo' },
  ],
  '10': [
    { year: 'Year 2', icon: '🏠', title: 'BTO Key Collection', detail: 'S$60,000 goal hit · Down payment ready' },
    { year: 'Year 4', icon: '👶', title: 'Education Fund Starts', detail: 'Child education pot · S$300/mo allocation begins' },
    { year: 'Year 6', icon: '📈', title: 'Investment Milestone', detail: 'Equity portfolio S$120,000 · Diversified across asset class' },
    { year: 'Year 8', icon: '🏢', title: 'Property Planning', detail: 'Investment property capital target S$200K · Planning begins' },
    { year: 'Year 10', icon: '🌅', title: 'Early Retirement Prep', detail: 'Retirement corpus S$500,000 · FIRE pathway at age 55' },
  ],
};