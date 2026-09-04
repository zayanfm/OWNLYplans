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
  aiSynthesis?: {
    executiveSummary: string;
    familyPriorities: string[];
    watchouts: string[];
  };
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
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
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

  // SGFinDex Aggregation
  async getSgFinDexAggregate(householdId?: string): Promise<any> {
    const q = householdId ? `?householdId=${encodeURIComponent(householdId)}` : '';
    return this.request(`/api/sgfindex/aggregate${q}`);
  }

  // Multi-Agent Engine
  async analyzeAgents(householdId?: string): Promise<{ success: boolean; data: AgentAnalysisData }> {
    return this.request<{ success: boolean; data: AgentAnalysisData }>('/api/agents/analyze', {
      method: 'POST',
      body: JSON.stringify({ householdId })
    });
  }

  async sendChatMessage(message: string, history: ChatMessage[] = [], householdId?: string): Promise<{ success: boolean; reply: string; source: string; confidence: number }> {
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

  async executeRoute(routeId: string, amount: number, householdId?: string): Promise<any> {
    return this.request('/api/finance/execute-route', {
      method: 'POST',
      body: JSON.stringify({ routeId, amount, householdId })
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
