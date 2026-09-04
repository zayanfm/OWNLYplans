const addYearsIso = (years) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 7);
};

const requiredMonthly = (current, target, months, annualRate) => {
  const monthlyRate = annualRate / 12;
  const growth = Math.pow(1 + monthlyRate, months);
  const factor = monthlyRate ? (growth - 1) / monthlyRate : months;
  return Math.max(0, Math.ceil((target - current * growth) / factor));
};

class GoalsAgent {
  async analyze(household, options = {}) {
    const { housing = {}, financials, dependents = [], primaryUser, accounts } = household;
    const monthlySurplus = Number(financials.monthlySurplus || 0);
    const timelineYears = Number(options.timelineYears || 5);
    const months = timelineYears * 12;
    const deadline = addYearsIso(timelineYears);
    const liquidCash = [...(accounts.ocbc || []), ...(accounts.otherBanks || [])]
      .reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const investments = (accounts.investments || []).reduce((sum, item) => sum + Number(item.value || 0), 0);
    const availableBeyondEmergency = Math.max(0, liquidCash - Number(financials.emergencyFund || 0));
    const split = { housing: 0.5, education: 0.3, wealth: 0.2 };

    const homeTarget = Number(housing.monthlyLoanInstalment || 1500) * 12;
    const homeMonthly = Math.round(monthlySurplus * split.housing);
    const homeNeeded = requiredMonthly(availableBeyondEmergency, homeTarget, months, 0.015);
    const educationTarget = Math.max(30000, dependents.length * 30000);
    const educationCurrent = Math.min(8000, liquidCash * 0.2);
    const educationMonthly = Math.round(monthlySurplus * split.education);
    const educationNeeded = requiredMonthly(educationCurrent, educationTarget, months, 0.045);
    const retirementCurrent = Number(primaryUser.cpf?.sa || 0) + investments;
    const retirementTarget = 120000;
    const retirementMonthly = Math.round(monthlySurplus * split.wealth);
    const retirementNeeded = requiredMonthly(retirementCurrent, retirementTarget, months, 0.045);

    const goals = [
      {
        id: 'goal_home_reserve', name: 'Home Loan Safety Reserve', category: 'HOUSING',
        targetAmount: homeTarget, currentAmount: availableBeyondEmergency,
        shortfall: Math.max(0, homeTarget - availableBeyondEmergency), deadline, monthsRemaining: months,
        requiredMonthlyAllocation: homeNeeded, suggestedMonthlyAllocation: homeMonthly,
        onTrack: homeMonthly >= homeNeeded, icon: 'home', status: homeMonthly >= homeNeeded ? 'ON_TRACK' : 'AT_RISK'
      },
      {
        id: 'goal_child_education', name: `${dependents.length || 1}-Child Education Fund`, category: 'EDUCATION',
        targetAmount: educationTarget, currentAmount: educationCurrent,
        shortfall: Math.max(0, educationTarget - educationCurrent), deadline, monthsRemaining: months,
        requiredMonthlyAllocation: educationNeeded, suggestedMonthlyAllocation: educationMonthly,
        onTrack: educationMonthly >= educationNeeded, icon: 'graduation-cap', status: educationMonthly >= educationNeeded ? 'ON_TRACK' : 'AT_RISK'
      },
      {
        id: 'goal_retirement_compounding', name: 'Retirement & Liquid Wealth', category: 'RETIREMENT',
        targetAmount: retirementTarget, currentAmount: retirementCurrent,
        shortfall: Math.max(0, retirementTarget - retirementCurrent), deadline, yearsRemaining: timelineYears,
        requiredMonthlyAllocation: retirementNeeded, suggestedMonthlyAllocation: retirementMonthly,
        compoundingVehicle: 'OCBC RoboInvest & CPF SA', onTrack: retirementMonthly >= retirementNeeded,
        icon: 'trending-up', status: retirementMonthly >= retirementNeeded ? 'ON_TRACK' : 'AT_RISK'
      }
    ];

    return {
      agentId: 'goals_agent', agentName: 'Multi-Generational Goals Agent', status: 'ANALYZED', confidence: 0.9,
      timelineYears, totalGoalsCount: goals.length, goals,
      findings: [
        `A S$${homeTarget.toLocaleString()} reserve would cover 12 months of current home-loan instalments.`,
        `The education target is S$30,000 per child and is tested against the selected ${timelineYears}-year horizon.`,
        'Retirement planning starts from linked investments and CPF SA; returns are assumptions, not guarantees.'
      ],
      recommendedSplit: { housingMilestone: split.housing, childEducation: split.education, wealthGrowth: split.wealth }
    };
  }
}

module.exports = new GoalsAgent();
