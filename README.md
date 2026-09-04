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
- **Multi-Generational Goals Agent**: Tests home-loan resilience, children’s education, and retirement against the family’s selected 5- or 10-year target horizon.
- **Grants & Government Benefits Agent**: Surfaces support to verify, and only counts a benefit when the consented household data establishes eligibility.
- **Orchestrator Agent**: Synthesizes agent telemetry into ranked, explainable Next-Best Actions (NBAs) and powers the conversational AI assistant.

---

### Household planning fixture

Authentication identities come from the official `@opengovsg/mockpass` MyInfo v3 dataset. The financial-planning engine currently uses this separate household fixture for its simulated SGFinDex, transaction and goal data:
- `freya_family`: **Freya Lim Guo En** — married household, two school-age children, existing 5-room HDB home and S$1,340 monthly surplus.
- `sandwich_family`: **David Tan & Grace Wong** — 35-49 Sandwiched Generation Family, 2 school-going children + elderly parent, S$350,000 protection gap.
- `single_achiever`: **Chloe Teo** — 21-29 Emerging Affluent Single, optimizing CPF OA + LionGlobal MMF for private property aspiration.

---

### API Reference
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service status & health diagnostics |
| `/api/auth/mockpass/start` | `GET` | Start interactive MockPass MyInfo v3 authorization |
| `/api/auth/mockpass/callback` | `GET` | Exchange the MockPass authorization code |
| `/api/auth/mockpass/session/:id` | `GET` | Consume the authenticated MyInfo profile |
| `/api/sgfindex/aggregate` | `GET` | Aggregated multi-bank, CPF, and net worth data |
| `/api/agents/analyze` | `POST` | Run 4-agent parallel financial analysis & NBAs |
| `/api/agents/chat` | `POST` | Explainable, context-aware AI chatbot |
| `/api/agents/status` | `GET` | Live telemetry of all 4 AI agents |
| `/api/finance/overview` | `GET` | Household cashflow, surplus routes & milestones |
| `/api/finance/approve-plan`| `POST` | Approve & activate progressive financial plan |
| `/api/rm/household-summary`| `POST` | Generate consent-filtered RM briefing packet |

---

### Verification & Testing

### Local development

Run the backend and Expo in separate terminals. For a physical phone, keep the phone and computer on the same network and start Expo in LAN mode. The app automatically derives the API host from Expo's development host. Set `EXPO_PUBLIC_API_BASE_URL` from `frontend/.env.example` only for tunnel mode or a custom/deployed backend.

`npm start` also launches the installed official MockPass service on port `5156`. Both ports `5000` and `5156` must be reachable from a physical phone. The browser login uses MockPass's real login, consent, authorization-code, token and MyInfo person endpoints. Configuration is documented in `backend/.env.example`.

The default development identity is `S9812382B` (`FREYA LIM GUO EN`). MockPass selects it automatically and still presents the MyInfo disclosure-consent screen. Set `SHOW_LOGIN_PAGE=true` to manually choose another built-in `[MyInfo]` identity.

```powershell
cd backend
npm start

# Separate terminal
cd frontend
npm start
```

#### Optional Gemini enhancement

The financial calculations and eligibility checks always run through the deterministic agents so their numbers remain reproducible. To enable Gemini 2.5 Flash for narrative synthesis and chatbot explanations, copy `backend/.env.example` to `backend/.env` and provide `GEMINI_API_KEY`. Without a key—or if Gemini is unavailable—the API explicitly reports `DETERMINISTIC_FALLBACK` and the journey continues with local explanations.

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
