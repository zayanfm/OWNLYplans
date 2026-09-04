# OWNLYplans — AI-Powered Family Financial Engine (OCBC Digital)

OWNLYplans is an AI-driven, multi-agent family financial cockpit embedded inside the OCBC Digital mobile ecosystem. It brings household finances, multi-generational life milestones, Singapore government support schemes, and OCBC banking products into an adaptive, explainable, and human-in-the-loop platform.

---

### Core Value Pillars ("The White Paper Blueprint")
1. **Household Financial View**: Consolidate multi-bank accounts, CPF (OA/SA/MA), IRAS, and life partner finances via **MockPass** (Singpass/MyInfo simulation) and **SGFinDex**.
2. **Progressive Financial Planning**: Adaptive monthly surplus optimization across high-yield cash sweeps (LionGlobal SGD MMF @ 3.85% p.a.), housing pots, and family milestones.
3. **"We Guide. You Decide."**: Explainable AI recommendations with explicit confidence scores, transparent trade-offs, and user-controlled autonomy levels (*Notify & Wait*, *24h Window*, *Full Auto*).
4. **"Stay Connected" RM Advisory Handoff**: Context-rich household financial snapshot export for OCBC Relationship Managers with granular privacy consent filtering.

---

### Architecture & Multi-Agent Framework

```
                          ┌────────────────────────────┐
                          │  React Native Expo Client  │
                          └─────────────┬──────────────┘
                                        │ (REST / JSON)
                                        ▼
                          ┌────────────────────────────┐
                          │     Express API Gateway    │
                          └─────────────┬──────────────┘
                                        │
             ┌──────────────────────────┼─────────────────────────┐
             ▼                          ▼                         ▼
   ┌──────────────────┐       ┌──────────────────┐      ┌──────────────────┐
   │ MockPass Service │       │ SGFinDex Service │      │ Household Store  │
   │ (Singpass/MyInfo)│       │ (Banks, CPF, SGX)│      │  (State Engine)  │
   └──────────────────┘       └──────────────────┘      └──────────────────┘
                                        │
                                        ▼
             ┌────────────────────────────────────────────────────┐
             │       Multi-Agent Financial Intelligence Engine    │
             ├─────────────────┬──────────────────┬───────────────┤
             │  Health & Risk  │ Multi-Gen Goals  │ Grants Finder │
             │      Agent      │      Agent       │     Agent     │
             └─────────────────┴──────────────────┴───────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │      Orchestrator Agent     │
                         │  (Next-Best Actions & XAI)  │
                         └─────────────────────────────┘
```

#### Specialized AI Agents
- **Household Health & Risk Agent**: Evaluates emergency buffer months, savings rate, idle cash drag (0.05% vs 3.85%), and Great Eastern life/mortgage protection gaps.
- **Multi-Generational Goals Agent**: Manages BTO 4-Room downpayment deadlines, child education horizons, and CPF retirement compounding.
- **Grants & Government Benefits Agent**: Discovers Enhanced CPF Housing Grant (EHG), Baby Bonus / Child Development Account (CDA) matching, and Climate Vouchers.
- **Orchestrator Agent**: Synthesizes agent telemetry into ranked, explainable Next-Best Actions (NBAs) and powers the conversational AI assistant.

---

### Singapore Personas (MockPass)
- `alex_mary_bto`: **Alex Tan & Mary Lim** — 25-34 Dual Income, Pending 4-Room BTO (Tengah), 1 infant dependent. Discovers S$54,300 in grants + S$1,340 monthly surplus.
- `sandwich_family`: **David Tan & Grace Wong** — 35-49 Sandwiched Generation Family, 2 school-going children + elderly parent, S$350,000 protection gap.
- `single_achiever`: **Chloe Teo** — 21-29 Emerging Affluent Single, optimizing CPF OA + LionGlobal MMF for private property aspiration.

---

### API Reference
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service status & health diagnostics |
| `/api/auth/mockpass` | `POST` | Singpass MockPass login & MyInfo profile |
| `/api/auth/personas` | `GET` | List available Singapore personas |
| `/api/auth/switch-persona` | `POST` | Switch active household persona |
| `/api/sgfindex/aggregate` | `GET` | Aggregated multi-bank, CPF, and net worth data |
| `/api/agents/analyze` | `POST` | Run 4-agent parallel financial analysis & NBAs |
| `/api/agents/chat` | `POST` | Explainable, context-aware AI chatbot |
| `/api/agents/status` | `GET` | Live telemetry of all 4 AI agents |
| `/api/finance/overview` | `GET` | Household cashflow, surplus routes & milestones |
| `/api/finance/approve-plan`| `POST` | Approve & activate progressive financial plan |
| `/api/rm/household-summary`| `POST` | Generate consent-filtered RM briefing packet |

---

### Verification & Testing
```powershell
# Run backend test suites
cd backend
node tests/agents.test.js    # Unit tests for agents & calculation rules
node tests/api.test.js       # Integration tests for all REST endpoints
node tests/e2e.test.js       # Multi-persona End-to-End user journeys

# Run frontend typecheck
cd ../frontend
npx tsc --noEmit
```
