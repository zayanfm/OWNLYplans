const healthAgent = require('./healthAgent');
const goalsAgent = require('./goalsAgent');
const grantsAgent = require('./grantsAgent');
const geminiService = require('../services/geminiService');

class OrchestratorAgent {
  async runFullAnalysis(household) {
    // 1. Run specialized agents in parallel
    const [healthRes, goalsRes, grantsRes] = await Promise.all([
      healthAgent.analyze(household),
      goalsAgent.analyze(household),
      grantsAgent.analyze(household)
    ]);

    const monthlySurplus = household.financials.monthlySurplus || 1340;

    // 2. Synthesize prioritized Next-Best Actions (NBAs)
    const nextBestActions = [];

    // NBA 1: Cashflow Yield Lift (LionGlobal SGD MMF)
    const idleCash = healthRes.metrics.idleCashIdentified || 0;
    const annualYieldGain = Number((idleCash * (0.0385 - 0.0005)).toFixed(0));
    nextBestActions.push({
      id: 'nba_sweep_mmf',
      title: 'Sweep Idle Cash to LionGlobal SGD MMF',
      category: 'CASHFLOW',
      confidence: 0.98,
      impact: `+S$${annualYieldGain}/year Net Yield`,
      reason: `Boosts annual yield on S$${idleCash.toLocaleString()} secondary bank cash from 0.05% to 3.85% p.a. with zero lock-in.`,
      urgency: 'HIGH',
      badge: 'Immediate Yield Lift',
      actionPayload: {
        type: 'AUTO_SWEEP',
        source: 'DBS & Secondary Accounts',
        destination: 'LionGlobal SGD Money Market Fund',
        amount: idleCash
      }
    });

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

    // NBA 3: Government scheme action — only confirmed eligibility can carry a dollar value.
    const unclaimedGrants = grantsRes.grants.filter(g => g.status.includes('ELIGIBLE'));
    if (unclaimedGrants.length > 0) {
      const topGrant = unclaimedGrants[0];
      nextBestActions.push({
        id: `nba_grant_${topGrant.id}`,
        title: `Claim S$${topGrant.amount.toLocaleString()} via ${topGrant.name}`,
        category: 'GOVERNMENT_SCHEME',
        confidence: 0.97,
        impact: `+S$${topGrant.amount.toLocaleString()} Unlocked Benefits`,
        reason: topGrant.reason,
        urgency: 'HIGH',
        badge: 'Government Funded',
        actionPayload: {
          type: 'CLAIM_GRANT',
          grantId: topGrant.id,
          actionStep: topGrant.action
        }
      });
    } else if (grantsRes.grants.some(g => g.status === 'VERIFY_ELIGIBILITY')) {
      const review = grantsRes.grants.find(g => g.status === 'VERIFY_ELIGIBILITY');
      nextBestActions.push({
        id: 'nba_government_support_review',
        title: 'Verify Family Support Eligibility',
        category: 'GOVERNMENT_SCHEME',
        confidence: 0.99,
        impact: 'Avoid counting unverified benefits in the plan',
        reason: review.reason,
        urgency: 'LOW',
        badge: 'Check Eligibility',
        actionPayload: { type: 'REVIEW_ELIGIBILITY', actionStep: review.action }
      });
    }

    // NBA 4: Goal Surplus Allocation
    nextBestActions.push({
      id: 'nba_surplus_allocation',
      title: `Automate Monthly S$${monthlySurplus.toLocaleString()} Surplus Routing`,
      category: 'MILESTONE_EXECUTION',
      confidence: 0.96,
      impact: 'Fund three family goals from one monthly surplus',
      reason: 'Routes 50% to the home-loan reserve, 30% to children’s education, and 20% to retirement and liquid wealth.',
      urgency: 'MEDIUM',
      badge: 'Automated Growth',
      actionPayload: {
        type: 'ALLOCATION_ROUTE',
        splits: {
          housingGoal: Number((monthlySurplus * 0.5).toFixed(0)),
          childGoal: Number((monthlySurplus * 0.3).toFixed(0)),
          wealthGrowth: Number((monthlySurplus * 0.2).toFixed(0))
        }
      }
    });

    const benefitSummary = grantsRes.totalGrantValue > 0
      ? `confirmed S$${grantsRes.totalGrantValue.toLocaleString()} in eligible benefits`
      : 'flagged government support for eligibility verification without counting it as plan funding';
    const deterministicSummary = `OWNLYplans completed financial diagnostics for ${household.name}, ${benefitSummary}, identified S$${healthRes.metrics.idleCashIdentified.toLocaleString()} in potentially idle cash, and assessed ${goalsRes.goals.length} family goals.`;
    const fallbackNarrative = {
      executiveSummary: deterministicSummary,
      familyPriorities: ['Protect mortgage payments', 'Fund two children’s education', 'Strengthen retirement liquidity'],
      watchouts: ['Investment returns are not guaranteed', 'Keep the emergency reserve liquid']
    };
    const narrativeResult = await geminiService.generateJsonWithMeta(
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
    const fullAnalysis = await this.runFullAnalysis(household);
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
      reply = `The analysis found S$${fullAnalysis.agents.health.metrics.idleCashIdentified.toLocaleString()} above operational cash thresholds. Moving it to a higher-yield option could improve returns, but the quoted rate and liquidity terms must be verified before execution and the S$${household.financials.emergencyFund.toLocaleString()} emergency floor stays untouched.`;
    } else if (lower.includes('grant') || lower.includes('cda') || lower.includes('baby') || lower.includes('ehg') || lower.includes('housing grant')) {
      reply = fullAnalysis.totalGrantsAvailable > 0
        ? `We confirmed **S$${fullAnalysis.totalGrantsAvailable.toLocaleString()}** in support from the available household data. Review each scheme’s current agency criteria before acting.`
        : `No grant value is included in your plan yet. Freya’s MockPass record shows American citizenship, while child and co-owner citizenship is not in the consented dataset, so citizen-only schemes must be verified first.`;
    } else if (lower.includes('bto') || lower.includes('downpayment') || lower.includes('tengah') || lower.includes('house') || lower.includes('milestone')) {
      reply = `Your current home-loan instalment is S$${Number(household.housing.monthlyLoanInstalment || 0).toLocaleString()}/month. OWNLYplan uses a 12-month mortgage-payment reserve as the home goal and protects the separate S$${household.financials.emergencyFund.toLocaleString()} emergency floor.`;
    } else if (lower.includes('protection') || lower.includes('insurance') || lower.includes('great eastern') || lower.includes('gap')) {
      reply = `Our Household Health Agent identified a S$${(fullAnalysis.agents.health.metrics.protectionGap || 160000).toLocaleString()} life coverage gap against your outstanding mortgage commitments. Adding Great Eastern FlexiLife Term closes this 100% for approximately S$28/month.`;
    } else {
      reply = `Based on ${household.name}'s linked finances, you have **S$${household.financials.monthlySurplus.toLocaleString()}/month** in surplus. No unverified government support is counted in the plan. Would you like to explore the home reserve, education, retirement, or protection goal?`;
    }

    return {
      reply,
      source: 'DETERMINISTIC_EXPLAINABLE_ENGINE',
      confidence: 0.98
    };
  }
}

module.exports = new OrchestratorAgent();
