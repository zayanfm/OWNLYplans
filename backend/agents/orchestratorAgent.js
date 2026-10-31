const healthAgent = require('./healthAgent');
const goalsAgent = require('./goalsAgent');
const grantsAgent = require('./grantsAgent');
const geminiService = require('../services/geminiService');
const optimiserService = require('../services/optimiserService');
const growService = require('../services/growService');

class OrchestratorAgent {
  async runFullAnalysis(household, options = {}) {
    // 1. Run specialized agents in parallel
    const [healthRes, goalsRes, grantsRes] = await Promise.all([
      healthAgent.analyze(household),
      goalsAgent.analyze(household),
      grantsAgent.analyze(household)
    ]);

    const monthlySurplus = household.financials.monthlySurplus || 1340;

    // 2. Synthesize prioritized Next-Best Actions (NBAs)
    const nextBestActions = [];

    // NBA 1: Earn more on the emergency buffer (LionGlobal SGD MMF keeps it T+0 liquid)
    const bufferToMove = healthRes.metrics.lowYieldBuffer || 0;
    const idleCash = healthRes.metrics.idleCashIdentified || 0;
    const annualYieldGain = Number((bufferToMove * (0.0385 - 0.0005)).toFixed(0));
    if (bufferToMove > 0) {
      nextBestActions.push({
        id: 'nba_sweep_mmf',
        title: 'Earn More on Your Emergency Buffer',
        category: 'CASHFLOW',
        confidence: 0.95,
        impact: `+S$${annualYieldGain.toLocaleString()}/year Net Yield`,
        reason: `Your S$${bufferToMove.toLocaleString()} emergency buffer earns 0.05% base interest. LionGlobal SGD MMF has no lock-in and T+0 withdrawal, so the buffer stays available.`,
        urgency: 'HIGH',
        badge: 'Immediate Yield Lift',
        actionPayload: {
          type: 'AUTO_SWEEP',
          source: 'OCBC emergency buffer',
          destination: 'LionGlobal SGD Money Market Fund',
          amount: bufferToMove
        }
      });
    }

    // NBA 5: Household subscription review (derived from mock linked transactions)
    const spendingInsights = household.spendingInsights;
    if (spendingInsights && spendingInsights.reviewableMonthlySavings > 0) {
      const reviewable = spendingInsights.recurringSubscriptions.filter(item => item.recommendation === 'REVIEW');
      const monthlySavings = spendingInsights.reviewableMonthlySavings;
      nextBestActions.push({
        id: 'nba_subscription_savings',
        title: `Review S$${monthlySavings.toFixed(0)}/month in Low-Use Subscriptions`,
        category: 'SPENDING',
        confidence: 0.88,
        impact: `+S$${(monthlySavings * 60).toLocaleString()} toward family goals over 5 years`,
        reason: `${reviewable.length} recurring subscriptions were flagged for review from the ${spendingInsights.analysisWindowDays}-day linked-account pattern.`,
        urgency: 'LOW',
        badge: 'Family Choice',
        actionPayload: {
          type: 'REVIEW_SUBSCRIPTIONS',
          monthlySavings,
          merchants: reviewable.map(item => ({ merchant: item.merchant, monthlyAmount: item.monthlyAmount }))
        }
      });
    }

    // NBA 2: Protection Gap Closure (Great Eastern FlexiLife)
    if (healthRes.metrics.protectionGap > 0) {
      nextBestActions.push({
        id: 'nba_close_protection',
        title: `Close S$${healthRes.metrics.protectionGap.toLocaleString()} Family Protection Gap`,
        category: 'PROTECTION',
        confidence: 0.94,
        impact: '100% Mortgage & Dependent Security',
        reason: `Great Eastern GREAT FlexiLife provides complete mortgage protection and income safety net for ~S$28/month.`,
        urgency: 'MEDIUM',
        badge: 'Family Safety Net',
        actionPayload: {
          type: 'INSURANCE_RIDER',
          product: 'Great Eastern GREAT FlexiLife Term',
          coverageAmount: healthRes.metrics.protectionGap,
          monthlyPremiumEstimate: 28
        }
      });
    }

    // NBA 3: Government support that is available now (estimates from published rules).
    const availableSupport = grantsRes.grants.filter(g => g.status === 'AVAILABLE' && g.amount > 0);
    if (availableSupport.length > 0) {
      const topGrant = availableSupport.sort((a, b) => b.amount - a.amount)[0];
      nextBestActions.push({
        id: `nba_grant_${topGrant.id}`,
        title: `Unlock up to S$${topGrant.amount.toLocaleString()} via ${topGrant.name}`,
        category: 'GOVERNMENT_SCHEME',
        confidence: 0.9,
        impact: `+S$${topGrant.amount.toLocaleString()} estimated ${topGrant.restricted ? 'restricted' : 'flexible'} support`,
        reason: topGrant.reason,
        urgency: topGrant.nextDate ? 'MEDIUM' : 'LOW',
        badge: 'Government Support',
        actionPayload: {
          type: 'CLAIM_GRANT',
          grantId: topGrant.id,
          actionStep: topGrant.action,
          deadline: topGrant.nextDate
        }
      });
    }

    // NBA 4: Goal Surplus Allocation from the optimiser's recommended plan
    const recommendedPlan = optimiserService.optimise(household).plans.find(plan => plan.recommended);

    // NBA 6: Advisory pathway, triggered by planning complexity rather than wealth alone
    const advisory = growService.advisory(household, recommendedPlan, healthRes);
    if (advisory.recommended) {
      nextBestActions.push({
        id: 'nba_advisory_review',
        title: advisory.title,
        category: 'ADVISORY',
        confidence: 0.9,
        impact: 'One conversation covering home, protection and education',
        reason: `${advisory.reason} ${advisory.flags.map(flag => flag.label).join('; ')}.`,
        urgency: 'LOW',
        badge: 'Human Advice',
        actionPayload: { type: 'BOOK_ADVISER', flags: advisory.flags.map(flag => flag.id) }
      });
    }
    nextBestActions.push({
      id: 'nba_surplus_allocation',
      title: `Automate Monthly S$${monthlySurplus.toLocaleString()} Surplus Routing`,
      category: 'MILESTONE_EXECUTION',
      confidence: 0.96,
      impact: `Funds ${recommendedPlan.goals.length} family goals from one monthly surplus`,
      reason: `${recommendedPlan.name} plan: S$${recommendedPlan.routes.housing}/month home, S$${recommendedPlan.routes.education}/month education, S$${recommendedPlan.routes.emergency}/month emergency buffer and S$${recommendedPlan.routes.wealth}/month retirement, stepping up as earlier goals finish.`,
      urgency: 'MEDIUM',
      badge: 'Automated Growth',
      actionPayload: {
        type: 'ALLOCATION_ROUTE',
        planId: recommendedPlan.id,
        splits: {
          housingGoal: recommendedPlan.routes.housing,
          childGoal: recommendedPlan.routes.education,
          emergencyBuffer: recommendedPlan.routes.emergency,
          wealthGrowth: recommendedPlan.routes.wealth
        }
      }
    });

    const benefitSummary = grantsRes.totalGrantValue > 0
      ? `estimated S$${grantsRes.totalGrantValue.toLocaleString()} in available or upcoming government support`
      : 'found no further government support from the consented data';
    const deterministicSummary = `OWNLYplans completed financial diagnostics for ${household.name}, ${benefitSummary}, identified S$${healthRes.metrics.idleCashIdentified.toLocaleString()} in spare cash, and assessed ${goalsRes.goals.length} family goals.`;
    const fallbackNarrative = {
      executiveSummary: deterministicSummary,
      familyPriorities: ['Prepare for the BTO purchase', 'Fund Percy’s education', 'Strengthen long-term family wealth'],
      watchouts: ['Investment returns are not guaranteed', 'Keep the emergency reserve liquid']
    };
    const narrativeResult = options.skipNarrative
      ? { data: fallbackNarrative, source: 'DETERMINISTIC_FALLBACK' }
      : await geminiService.generateJsonWithMeta(
        `Synthesize an explainable family-finance narrative from these verified calculations. Do not alter, invent or recalculate any number.\n\nHousehold: ${JSON.stringify({ name: household.name, financials: household.financials, housing: household.housing, dependents: household.dependents })}\n\nAgent results: ${JSON.stringify({ health: healthRes, goals: goalsRes, grants: grantsRes })}\n\nReturn this schema: { "executiveSummary": "string", "familyPriorities": ["string"], "watchouts": ["string"] }`,
        fallbackNarrative
      );

    const aiSynthesis = narrativeResult.data && typeof narrativeResult.data.executiveSummary === 'string'
      ? narrativeResult.data
      : fallbackNarrative;

    const synthesis = {
      householdId: household.id,
      householdName: household.name,
      analyzedAt: new Date().toISOString(),
      orchestratorStatus: 'SYNTHESIS_COMPLETE',
      overallHealthScore: healthRes.score,
      totalGrantsAvailable: grantsRes.totalGrantValue,
      agents: {
        health: healthRes,
        goals: goalsRes,
        grants: grantsRes
      },
      nextBestActions,
      executiveSummary: aiSynthesis.executiveSummary,
      aiSynthesis,
      intelligenceSource: narrativeResult.source,
      calculationSource: 'DETERMINISTIC_RULE_ENGINE'
    };

    return synthesis;
  }

  async handleChat(household, history, message) {
    // Check if Gemini can provide dynamic chat
    const fullAnalysis = await this.runFullAnalysis(household, { skipNarrative: true });
    const geminiReply = await geminiService.generateChatResponse(fullAnalysis, history, message);

    if (geminiReply) {
      return {
        reply: geminiReply,
        source: 'GEMINI_LLM_MULTI_AGENT',
        confidence: 0.96
      };
    }

    // Deterministic Chat responses for high-confidence financial Q&A
    const lower = message.toLowerCase();
    let reply = "";

    if (lower.includes('mmf') || lower.includes('lionglobal') || lower.includes('sweep') || lower.includes('yield') || lower.includes('interest')) {
      reply = `Your S$${household.financials.emergencyFund.toLocaleString()} emergency floor earns base interest today. Holding it in a T+0 money market fund could improve returns while keeping it available; the quoted rate and liquidity terms must be verified before execution. Beyond that floor and a month of working cash, S$${fullAnalysis.agents.health.metrics.idleCashIdentified.toLocaleString()} is spare.`;
    } else if (lower.includes('grant') || lower.includes('cda') || lower.includes('baby') || lower.includes('ehg') || lower.includes('housing grant')) {
      reply = fullAnalysis.totalGrantsAvailable > 0
        ? `About **S$${fullAnalysis.totalGrantsAvailable.toLocaleString()}** in support is still available or upcoming, estimated from published scheme rules and your MyInfo data. Restricted funds such as CDA money are kept apart from flexible cash. Confirm with the agency before acting.`
        : `No further government support was found from your MyInfo data. Schemes you are not eligible for are listed with the reason.`;
    } else if (lower.includes('bto') || lower.includes('downpayment') || lower.includes('tengah') || lower.includes('house') || lower.includes('milestone')) {
      reply = String(household.housing.type || '').includes('BTO')
        ? `Your BTO purchase fund currently has S$${Number(household.housing.downpaymentAccumulated || 0).toLocaleString()} toward its S$${Number(household.housing.downpaymentRequired || 0).toLocaleString()} target. OWNLYplan tests the remaining amount against your selected 5- or 10-year horizon.`
        : `Your current home-loan instalment is S$${Number(household.housing.monthlyLoanInstalment || 0).toLocaleString()}/month. OWNLYplan uses a 12-month mortgage-payment reserve as the home goal and protects the separate S$${household.financials.emergencyFund.toLocaleString()} emergency floor.`;
    } else if (lower.includes('protection') || lower.includes('insurance') || lower.includes('great eastern') || lower.includes('gap')) {
      reply = `Our Household Health Agent identified a S$${(fullAnalysis.agents.health.metrics.protectionGap || 160000).toLocaleString()} life coverage gap against your outstanding mortgage commitments. Adding Great Eastern FlexiLife Term closes this 100% for approximately S$28/month.`;
    } else {
      reply = `Based on ${household.name}'s linked finances, you have **S$${household.financials.monthlySurplus.toLocaleString()}/month** in surplus. Government support is shown as an estimate until confirmed. Would you like to explore the home reserve, education, retirement, or protection goal?`;
    }

    return {
      reply,
      source: 'DETERMINISTIC_EXPLAINABLE_ENGINE',
      confidence: 0.98
    };
  }
}

module.exports = new OrchestratorAgent();
