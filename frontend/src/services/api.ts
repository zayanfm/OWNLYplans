import { API_BASE_URL } from '../constants/appConfig';
import type { OwnlyPlan, PlanMode, PlanRouteId, PredictionScenario } from '../components/plan/types';

export interface PersonaInfo {
  id: string;
  name: string;
  segment: string;
  primaryUser: string;
  housing: string;
}

export interface MockPassAuthResponse {
  success: boolean;
  authenticatedAt: string;
  authMethod: string;
  authProvider?: string;
  personaId: string;
  personaName: string;
  segment: string;
  user: {
    nric: string;
    name: string;
    age: number;
    citizenship: string;
    maritalStatus: string;
    employment: string;
    monthlyGrossIncome: number;
    monthlyTakeHome: number;
    cpf: { oa: number; sa: number; ma: number };
    verified: boolean;
  };
  partner?: {
    nric: string;
    name: string;
    age: number;
    citizenship: string;
    employment: string;
    monthlyGrossIncome: number;
    monthlyTakeHome: number;
    cpf: { oa: number; sa: number; ma: number };
    linked: boolean;
  } | null;
  household: {
    segment: string;
    dependentsCount: number;
    dependents: any[];
    housing: any;
  };
}

export interface FamilyInviteMember {
  name: string;
  relation: string;
  nric: string;
  status?: 'PENDING' | 'APPROVED';
}

export interface FamilyInviteStatus {
  success: boolean;
  invitedAt: string | null;
  allApproved: boolean;
  members: FamilyInviteMember[];
}

export type AccountSharing = 'FULL' | 'TOTAL_ONLY' | 'PRIVATE';

export interface WorkspaceAccount {
  owner: 'primary' | 'partner' | 'joint';
  sharing: AccountSharing;
  status: 'CONNECTED' | 'AWAITING_CONSENT';
  countsTowardTotals: boolean;
  type: string;
  number: string | null;
  holder: string;
  role: string | null;
  balance: number | null;
  interestRate: number | null;
}

export interface HouseholdWorkspace {
  success: boolean;
  lastSynced: string;
  sources: string[];
  partnerConsent: 'NONE' | 'NOT_INVITED' | 'PENDING' | 'APPROVED' | 'LEFT';
  summary: {
    totalLiquidCash: number;
    totalInvestments: number;
    householdCpfTotal: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    monthlyHouseholdIncome: number;
    monthlyHouseholdTakeHome: number;
    monthlyHouseholdExpenses: number;
    monthlySurplus: number;
    emergencyFund: number;
    emergencyBufferMonths: number;
  };
  accounts: WorkspaceAccount[];
  investments: any[];
}

export type GoalStatus = 'ON_TRACK' | 'AT_RISK' | 'REACHED';

export interface SupportItem {
  id: string;
  name: string;
  agency: string;
  goalKey: 'housing' | 'education' | null;
  fundType: 'CASH' | 'RESTRICTED_CDA' | 'CPF' | 'VOUCHER';
  restricted: boolean;
  status: 'AVAILABLE' | 'RECEIVING' | 'RECEIVED' | 'UPCOMING' | 'NOT_ELIGIBLE';
  amount: number;
  reason: string;
  action: string;
  nextDate: string | null;
}

export type GoalInputStatus = 'CONFIRMED' | 'NEEDS_DECISION' | 'AWAITING_PARTNER' | 'OFF';
export type EducationPath = 'UNIVERSITY' | 'POLYTECHNIC' | 'UNDECIDED';

// What the family decided for one goal, plus the suggestion it started from.
export interface GoalInput {
  key: string;
  type: 'EMERGENCY' | 'HOUSING' | 'EDUCATION' | 'RETIREMENT' | 'CUSTOM';
  owner: 'household' | 'primary' | 'partner';
  enabled: boolean;
  confirmed?: boolean;
  confirmedBy?: string | null;
  source: string;
  status: GoalInputStatus;
  months?: number;
  withinMonths?: number;
  amount?: number;
  dueDate?: string;
  childName?: string;
  childIndex?: number;
  path?: EducationPath;
  startYear?: number;
  years?: number;
  annualCost?: number;
  adultName?: string;
  retireAge?: number;
  name?: string;
  suggested?: Partial<GoalInput>;
}

export interface FamilyGoal {
  id: string;
  key: string;
  routeKey: 'emergency' | 'housing' | 'education' | 'wealth' | 'custom';
  name: string;
  category: 'EMERGENCY' | 'HOUSING' | 'EDUCATION' | 'RETIREMENT' | 'CUSTOM';
  inputStatus: GoalInputStatus;
  planned: boolean;
  source: string;
  input: GoalInput;
  priority: number;
  targetAmount: number;
  currentAmount: number;
  shortfall: number;
  deadline: string;
  monthsRemaining: number;
  requiredMonthlyAllocation: number;
  annualRate: number;
  dependsOn: string[];
  basis: string;
  icon: string;
  suggestedMonthlyAllocation: number;
  projectedCompletion: string | null;
  status: GoalStatus | GoalInputStatus;
  support: SupportItem[];
}

export interface Commitment {
  id: string;
  label: string;
  category: string;
  monthlyAmount: number;
  essential: boolean;
  owner?: string;
}

export interface FamilyPicture {
  success: boolean;
  householdId: string;
  cashflow: {
    income: Array<{ owner: string; name: string; monthlyTakeHome: number }>;
    totalTakeHome: number;
    commitments: Commitment[];
    groups: Array<{ category: string; label: string; monthlyAmount: number; items: Commitment[]; benchmark: { amount: number; label: string; source: string } | null }>;
    totalCommitments: number;
    essentialMonthly: number;
    flexibleMonthly: number;
    freeToPlan: number;
    method: string;
  };
  goals: FamilyGoal[];
  fundingGap: number;
  totalRequiredMonthly: number;
  support: {
    totalGrantValue: number;
    restrictedValue: number;
    flexibleValue: number;
    upcomingDates: Array<{ grantId: string; name: string; date: string }>;
    notEligible: SupportItem[];
    disclaimer: string;
  };
  findings: string[];
}

export type PlanOptionId = 'balanced' | 'home_first' | 'education_first' | 'custom';

export interface PlanGoalOutcome {
  key: string;
  routeKey: FamilyGoal['routeKey'];
  name: string;
  targetAmount: number;
  startingAmount: number;
  deadline: string;
  requiredMonthly: number;
  monthlyNow: number;
  completesBy: string | null;
  projectedAtDeadline: number;
  status: 'ON_TRACK' | 'AT_RISK';
}

export interface PlanOption {
  id: PlanOptionId;
  name: string;
  tagline: string;
  routes: { emergency: number; housing: number; education: number; custom: number; wealth: number };
  unallocated: number;
  goals: PlanGoalOutcome[];
  stepUps: Array<{ month: string; fromGoal: string; amount: number; text: string }>;
  allOnTrack: boolean;
  atRisk: string[];
  recommended: boolean;
  tradeOffs: string[];
  // Only on the family's own plan: the order and amounts they chose.
  definition?: { order: string[]; monthlyOverrides: Record<string, number> };
}

export interface PlanOptions {
  success: boolean;
  monthlySurplus: number;
  protectionPremium: number;
  investable: number;
  lumpSum: { amount: number; toGoal: string; reason: string } | null;
  recommendedPlanId: PlanOptionId;
  needsDecision: Array<{ key: string; name: string; status: GoalInputStatus }>;
  plans: PlanOption[];
}

export interface ScenarioLevers {
  extraChild: boolean;
  incomeChangePct: number;
  schoolFeesMonthly: number;
  extraSavingsMonthly: number;
}

export interface ScenarioResult {
  success: boolean;
  levers: ScenarioLevers;
  planId: PlanOptionId;
  surplusBefore: number;
  surplusAfter: number;
  monthlyGapToClose: number;
  goals: Array<{
    key: string;
    name: string;
    isNew: boolean;
    before: { monthlyNow: number; completesBy: string | null; status: string; targetAmount: number } | null;
    after: { monthlyNow: number; completesBy: string | null; status: string; targetAmount: number };
  }>;
  summary: string[];
  recommendedPlanIdAfter: PlanOptionId;
}

export interface PlanProposal {
  id: string;
  proposedAt: string;
  status: 'PENDING' | 'AGREED' | 'SUGGESTED_CHANGE';
  planId: PlanOptionId;
  planName: string;
  proposedBy: string;
  reviewer: string;
  note: string | null;
  finalPlanId?: PlanOptionId;
  response: { decision: string; message: string; suggestedPlanId?: PlanOptionId } | null;
}

export interface GrowOverview {
  success: boolean;
  readiness: {
    ready: boolean;
    checks: Array<{ id: string; label: string; detail: string; passed: boolean }>;
    suggestions: Array<{ goalKey: string; goalName: string; monthlyAmount: number; product: string; horizon: string }>;
    totalMonthly: number;
    handoff: { label: string; destination: string; note: string } | null;
    blockedReason: string | null;
  };
  advisory: {
    recommended: boolean;
    flags: Array<{ id: string; label: string }>;
    title: string;
    reason: string;
  };
}

export interface PlanReview {
  id: string;
  detectedFor: string;
  trigger: { type: string; description: string };
  surplusBefore: number;
  surplusAfter: number;
  changes: ScenarioResult['goals'];
  suggestions: Array<{ id: 'accept' | 'revise' | 'reject'; label: string; detail: string }>;
}

export interface NextBestAction {
  id: string;
  title: string;
  category: string;
  confidence: number;
  impact: string;
  reason: string;
  urgency: string;
  badge: string;
  actionPayload: any;
}

export interface AgentAnalysisData {
  householdId: string;
  householdName: string;
  analyzedAt: string;
  overallHealthScore: number;
  totalGrantsAvailable: number;
  agents: {
    health: any;
    goals: any;
    grants: any;
  };
  nextBestActions: NextBestAction[];
  executiveSummary: string;
  intelligenceSource?: 'GEMINI_2_5_FLASH' | 'DETERMINISTIC_FALLBACK';
  calculationSource?: 'DETERMINISTIC_RULE_ENGINE';
  verification?: AiVerification;
  aiSynthesis?: {
    executiveSummary: string;
    familyPriorities: string[];
    watchouts: string[];
  };
}

// Result of checking AI-written text against the planning engine's figures.
export interface AiVerification {
  figuresChecked: number;
  mismatches: string[];
  outcome: 'ENGINE_TEXT' | 'AI_TEXT_VERIFIED' | 'AI_TEXT_REPLACED';
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

class ApiService {
  private baseUrl = API_BASE_URL;

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const error: Error & { status?: number } = new Error(body?.error || `HTTP Error ${res.status}: ${res.statusText}`);
        error.status = res.status;
        throw error;
      }
      return await res.json();
    } catch (err: any) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Auth & MockPass. The interactive flow is completed in the system browser.
  async beginMockpassLogin(returnUrl: string): Promise<{
    success: boolean;
    authorizationUrl: string;
    state: string;
    provider: string;
    protocol: string;
  }> {
    return this.request(`/api/auth/mockpass/start?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  async completeMockpassLogin(sessionId: string): Promise<MockPassAuthResponse> {
    return this.request<MockPassAuthResponse>(`/api/auth/mockpass/session/${encodeURIComponent(sessionId)}`);
  }

  async getMockpassLoginResult(state: string): Promise<{
    success: boolean;
    status: 'PENDING' | 'COMPLETED';
    sessionId?: string;
  }> {
    return this.request(`/api/auth/mockpass/result?state=${encodeURIComponent(state)}`);
  }

  /** @deprecated MockPass authentication must be completed interactively. */
  async mockpassLogin(): Promise<MockPassAuthResponse> {
    return this.request<MockPassAuthResponse>('/api/auth/mockpass', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  async getPersonas(): Promise<{ success: boolean; personas: PersonaInfo[] }> {
    return this.request<{ success: boolean; personas: PersonaInfo[] }>('/api/auth/personas');
  }

  async switchPersona(personaId: string): Promise<MockPassAuthResponse> {
    return this.request<MockPassAuthResponse>('/api/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ personaId })
    });
  }

  async linkPartner(partnerData: any): Promise<any> {
    return this.request('/api/auth/partner/link', {
      method: 'POST',
      body: JSON.stringify(partnerData)
    });
  }

  async inviteFamily(members: FamilyInviteMember[]): Promise<{ success: boolean; invitedAt: string; members: FamilyInviteMember[] }> {
    return this.request('/api/auth/family/invite', {
      method: 'POST',
      body: JSON.stringify({ members })
    });
  }

  async getFamilyStatus(): Promise<FamilyInviteStatus> {
    return this.request<FamilyInviteStatus>('/api/auth/family/status');
  }

  // Family Financial Workspace (Singpass MyInfo + OCBC accounts)
  async getWorkspace(householdId?: string): Promise<HouseholdWorkspace> {
    const q = householdId ? `?householdId=${encodeURIComponent(householdId)}` : '';
    return this.request<HouseholdWorkspace>(`/api/household/workspace${q}`);
  }

  async setAccountSharing(accountNumber: string, sharing: AccountSharing, householdId?: string): Promise<{ success: boolean }> {
    return this.request('/api/household/sharing', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, sharing, householdId })
    });
  }

  // Our Family Picture: cash flow, goals with dependencies, support per goal
  async getPicture(householdId?: string): Promise<FamilyPicture> {
    const q = householdId ? `?householdId=${encodeURIComponent(householdId)}` : '';
    return this.request<FamilyPicture>(`/api/household/picture${q}`);
  }

  // Goals: suggestions the family confirms, edits, switches off or adds to
  async updateGoal(key: string, patch: Partial<GoalInput>): Promise<{ success: boolean; goal: GoalInput }> {
    return this.request(`/api/household/goals/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(patch)
    });
  }

  // Anyone can leave: the partner (simulated from their own app) or you, which deletes the plan.
  async leaveHousehold(member: 'primary' | 'partner'): Promise<{ success: boolean; reviewNote?: string; deleted?: boolean }> {
    return this.request('/api/household/leave', {
      method: 'POST',
      body: JSON.stringify({ member })
    });
  }

  async addGoal(goal: { name: string; amount: number; dueDate: string }): Promise<{ success: boolean; goal: GoalInput }> {
    return this.request('/api/household/goals', {
      method: 'POST',
      body: JSON.stringify(goal)
    });
  }

  async removeGoal(key: string): Promise<{ success: boolean }> {
    return this.request(`/api/household/goals/${encodeURIComponent(key)}`, { method: 'DELETE' });
  }

  // Decision engine: plan options, what-if scenarios and partner proposals
  async getPlanOptions(householdId?: string): Promise<PlanOptions> {
    const q = householdId ? `?householdId=${encodeURIComponent(householdId)}` : '';
    return this.request<PlanOptions>(`/api/scenarios/plans${q}`);
  }

  async customPlan(order: string[], monthlyOverrides: Record<string, number>): Promise<{ success: boolean; investable: number; plan: PlanOption; recommendedPlanId: PlanOptionId }> {
    return this.request('/api/scenarios/plans/custom', {
      method: 'POST',
      body: JSON.stringify({ order, monthlyOverrides })
    });
  }

  async simulateScenario(levers: Partial<ScenarioLevers>, planId?: PlanOptionId): Promise<ScenarioResult> {
    return this.request<ScenarioResult>('/api/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify({ levers, planId })
    });
  }

  async proposePlan(planId: PlanOptionId, note?: string): Promise<{ success: boolean; proposal: PlanProposal }> {
    return this.request('/api/scenarios/proposals', {
      method: 'POST',
      body: JSON.stringify({ planId, note })
    });
  }

  async getLatestProposal(): Promise<{ success: boolean; proposal: PlanProposal | null }> {
    return this.request('/api/scenarios/proposals/latest');
  }

  async resolveProposal(planId: PlanOptionId): Promise<{ success: boolean; proposal: PlanProposal }> {
    return this.request('/api/scenarios/proposals/resolve', {
      method: 'POST',
      body: JSON.stringify({ planId })
    });
  }

  // Grow: investment readiness, advisory trigger and plan check-ins
  async getGrowOverview(): Promise<GrowOverview> {
    return this.request<GrowOverview>('/api/grow/overview');
  }

  async simulateReview(): Promise<{ success: boolean; review: PlanReview }> {
    return this.request('/api/grow/reviews/simulate', { method: 'POST', body: '{}' });
  }

  async respondToReview(reviewId: string, decision: 'accept' | 'revise' | 'reject'): Promise<{ success: boolean }> {
    return this.request('/api/grow/reviews/respond', {
      method: 'POST',
      body: JSON.stringify({ reviewId, decision })
    });
  }

  // Multi-Agent Engine
  async analyzeAgents(householdId?: string): Promise<{ success: boolean; data: AgentAnalysisData }> {
    return this.request<{ success: boolean; data: AgentAnalysisData }>('/api/agents/analyze', {
      method: 'POST',
      body: JSON.stringify({ householdId })
    });
  }

  async sendChatMessage(message: string, history: ChatMessage[] = [], householdId?: string): Promise<{ success: boolean; reply: string; source: string; confidence: number; verification?: AiVerification }> {
    return this.request('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, householdId })
    });
  }

  async getAgentTelemetry(): Promise<any> {
    return this.request('/api/agents/status');
  }

  // Surplus Planner & Execution
  async getFinanceOverview(householdId?: string): Promise<any> {
    const q = householdId ? `?householdId=${encodeURIComponent(householdId)}` : '';
    return this.request(`/api/finance/overview${q}`);
  }

  async generatePlan(payload: {
    timeline?: string;
    split?: Record<PlanRouteId, number>;
    mode?: PlanMode;
    priorities?: PlanRouteId[];
    protection?: { enabled: boolean; tier: 'essential' | 'enhanced' };
    predictionScenario?: PredictionScenario;
    planId?: PlanOptionId;
    householdId?: string;
  }): Promise<{ success: boolean; plan: OwnlyPlan }> {
    return this.request('/api/finance/plan', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async approvePlan(plan: OwnlyPlan | Record<string, unknown>, householdId?: string): Promise<any> {
    return this.request('/api/finance/approve-plan', {
      method: 'POST',
      body: JSON.stringify({ plan, householdId })
    });
  }

  // A transfer runs only when the owner of the source account confirms it.
  async executeRoute(routeId: string, amount: number, fromAccount: string, confirmedBy: 'primary' | 'partner', householdId?: string): Promise<any> {
    return this.request('/api/finance/execute-route', {
      method: 'POST',
      body: JSON.stringify({ routeId, amount, fromAccount, confirmedBy, householdId })
    });
  }

  // Relationship Manager Summary
  async exportRMSummary(consentOptions: any = {}, householdId?: string): Promise<any> {
    return this.request('/api/rm/household-summary', {
      method: 'POST',
      body: JSON.stringify({ consentOptions, householdId })
    });
  }
}

export const api = new ApiService();
export default api;
