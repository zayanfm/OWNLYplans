class GoalsAgent {
  async analyze(household) {
    const { housing, financials, dependents, primaryUser, partner } = household;
    const monthlySurplus = financials.monthlySurplus || 1340;

    const goals = [];

    // Goal 1: Housing Milestone (BTO / Private / Resale)
    if (housing && housing.type.includes('BTO')) {
      const targetAmount = housing.downpaymentRequired || 96000;
      const currentAccumulated = housing.downpaymentAccumulated || 80000;
      const shortfall = Math.max(0, targetAmount - currentAccumulated);
      const monthsRemaining = 24; // e.g., key collection in Dec 2027
      const requiredMonthly = Number((shortfall / monthsRemaining).toFixed(0));

      goals.push({
        id: 'goal_bto_downpayment',
        name: `${housing.type} Key Collection`,
        category: 'HOUSING',
        targetAmount,
        currentAmount: currentAccumulated,
        shortfall,
        deadline: housing.keyCollectionDate || '2027-12',
        monthsRemaining,
        requiredMonthlyAllocation: requiredMonthly,
        suggestedMonthlyAllocation: Math.min(monthlySurplus * 0.5, requiredMonthly),
        onTrack: currentAccumulated + (monthlySurplus * 0.5 * monthsRemaining) >= targetAmount,
        projectedCompletionDate: '2027-11',
        icon: 'home',
        status: 'ON_TRACK'
      });
    } else if (housing && housing.estimatedPrice) {
      goals.push({
        id: 'goal_mortgage_paydown',
        name: `${housing.type} Mortgage Optimization`,
        category: 'HOUSING',
        targetAmount: housing.estimatedPrice,
        currentAmount: (housing.estimatedPrice - (housing.mortgageOutstanding || 0)),
        deadline: '2035-12',
        suggestedMonthlyAllocation: Math.min(monthlySurplus * 0.4, 800),
        onTrack: true,
        icon: 'home',
        status: 'ON_TRACK'
      });
    }

    // Goal 2: Child Education / Family Future (if dependents exist)
    if (dependents && dependents.length > 0) {
      const child = dependents[0];
      const targetAmount = 50000;
      const currentAmount = 5000; // Seeded CDA
      const yearsToUni = Math.max(1, 21 - (child.age || 0));
      const requiredMonthly = Number(((targetAmount - currentAmount) / (yearsToUni * 12)).toFixed(0));

      goals.push({
        id: 'goal_child_education',
        name: `${child.name}'s Tertiary Education Fund`,
        category: 'EDUCATION',
        targetAmount,
        currentAmount,
        shortfall: targetAmount - currentAmount,
        deadline: `2042-01`,
        requiredMonthlyAllocation: requiredMonthly,
        suggestedMonthlyAllocation: Math.min(monthlySurplus * 0.3, requiredMonthly),
        onTrack: true,
        projectedCompletionDate: '2041-06',
        icon: 'graduation-cap',
        status: 'OPTIMIZED'
      });
    }

    // Goal 3: Retirement / Long-term Compounding
    const retirementAge = 65;
    const currentAge = primaryUser.age || 31;
    const yearsToRetirement = retirementAge - currentAge;
    const combinedCpfSa = (primaryUser.cpf.sa || 0) + (partner && partner.cpf ? partner.cpf.sa : 0);

    goals.push({
      id: 'goal_retirement_compounding',
      name: 'Household Retirement Freedom Pot',
      category: 'RETIREMENT',
      targetAmount: 800000,
      currentAmount: combinedCpfSa + 14200,
      deadline: `2055-12`,
      yearsRemaining: yearsToRetirement,
      suggestedMonthlyAllocation: Number((monthlySurplus * 0.2).toFixed(0)),
      compoundingVehicle: 'OCBC RoboInvest & CPF SA (4.0% p.a.)',
      onTrack: true,
      icon: 'trending-up',
      status: 'COMPOUNDING'
    });

    return {
      agentId: 'goals_agent',
      agentName: 'Multi-Generational Goals Agent',
      status: 'ON_TRACK',
      confidence: 0.94,
      totalGoalsCount: goals.length,
      goals,
      findings: [
        `BTO 4-Room downpayment requires S$16,000 top-up over 24 months (S$667/mo needed).`,
        `Child education fund trajectory is on track with 20-year compound horizon.`,
        `Combined household CPF SA compounding at 4.08% p.a. provides strong retirement anchor.`
      ],
      recommendedSplit: {
        housingMilestone: 0.50, // 50% of surplus
        childEducation: 0.30,   // 30% of surplus
        wealthGrowth: 0.20      // 20% of surplus
      }
    };
  }
}

module.exports = new GoalsAgent();
