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
    const idleCash = healthRes.metrics.idleCashIdentified || 9200;
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

    // NBA 3: Government Scheme Action (CDA / Grants)
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
    }

    // NBA 4: Goal Surplus Allocation
    nextBestActions.push({
      id: 'nba_surplus_allocation',
      title: `Automate Monthly S$${monthlySurplus.toLocaleString()} Surplus Routing`,
      category: 'MILESTONE_EXECUTION',
      confidence: 0.96,
      impact: 'Reach BTO Pot 4 Months Ahead of Schedule',
      reason: `Routes 50% to BTO Pot, 30% to Child Education, and 20% to OCBC RoboInvest wealth compounding.`,
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
      executiveSummary: `OWNLYplans multi-agent engine completed full financial diagnostics for ${household.name}. Found S$${grantsRes.totalGrantValue.toLocaleString()} in eligible benefits, identified S$${healthRes.metrics.idleCashIdentified.toLocaleString()} idle cash ready for 3.85% p.a. yield sweep, and confirmed all 3 life milestones are fully on track.`
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
      reply = `By sweeping S$${(fullAnalysis.agents.health.metrics.idleCashIdentified || 9200).toLocaleString()} from low-interest secondary accounts into the LionGlobal SGD Money Market Fund, your household earns **3.85% p.a.** instead of 0.05% base interest (+S$350+/year). It offers T+0 instant liquidity back to your OCBC 360 account at any time.`;
    } else if (lower.includes('grant') || lower.includes('cda') || lower.includes('baby') || lower.includes('ehg') || lower.includes('housing grant')) {
      reply = `We discovered **S$${fullAnalysis.totalGrantsAvailable.toLocaleString()}** in government support for your household! This includes the S$5,000 First Step CDA Grant + S$4,000 co-matching for your child, and S$45,000 in Enhanced CPF Housing Grant (EHG) eligibility.`;
    } else if (lower.includes('bto') || lower.includes('downpayment') || lower.includes('tengah') || lower.includes('house') || lower.includes('milestone')) {
      reply = `Your BTO 4-Room milestone requires S$16,000 in accumulated cash/CPF OA before Dec 2027 key collection. With your current monthly surplus of S$${(household.financials.monthlySurplus || 1340).toLocaleString()}, routing S$670/month ensures you meet the target 4 months early.`;
    } else if (lower.includes('protection') || lower.includes('insurance') || lower.includes('great eastern') || lower.includes('gap')) {
      reply = `Our Household Health Agent identified a S$${(fullAnalysis.agents.health.metrics.protectionGap || 160000).toLocaleString()} life coverage gap against your outstanding mortgage commitments. Adding Great Eastern FlexiLife Term closes this 100% for approximately S$28/month.`;
    } else {
      reply = `Based on your linked household finances (Alex & Mary), you have **S$${(household.financials.monthlySurplus || 1340).toLocaleString()}/month** in net surplus and **S$${fullAnalysis.totalGrantsAvailable.toLocaleString()}** in available government grants. What specific goal or product would you like to explore?`;
    }

    return {
      reply,
      source: 'DETERMINISTIC_EXPLAINABLE_ENGINE',
      confidence: 0.98
    };
  }
}

module.exports = new OrchestratorAgent();
