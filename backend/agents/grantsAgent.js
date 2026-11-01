const catalog = require('../data/grantsCatalog.json');
const { monthsUntil, money } = require('../utils/finance');

const findScheme = (id) => catalog.grants.find((grant) => grant.id === id);

const ageInYears = (birthDate, now = new Date()) => {
  const birth = new Date(birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age;
};

const addYearsAndMonths = (isoDate, years, months = 0) => {
  const date = new Date(isoDate);
  date.setFullYear(date.getFullYear() + years);
  date.setMonth(date.getMonth() + months);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Government Family Support Planner. Applies the published rules in grantsCatalog.json to the
 * MyInfo-verified household. Every amount is an estimate to confirm with the agency, restricted
 * funds (CDA, CPF) are kept apart from flexible cash, and each item names the goal it supports.
 */
class GrantsAgent {
  async analyze(household, options = {}) {
    const now = options.now || new Date();
    const { primaryUser, housing = {}, dependents = [], financials } = household;
    const grants = [];
    const isCitizen = (person) => String(person?.citizenship || '').toLowerCase().includes('singapore');

    // Housing: Enhanced CPF Housing Grant (household income ceiling).
    const ehg = findScheme('ehg_housing_grant');
    if (ehg && String(housing.type || '').includes('BTO')) {
      const income = Number(financials.householdMonthlyIncome || 0);
      const ceiling = ehg.eligibilityCriteria.maxMonthlyIncome;
      const tier = ehg.calculator.tiers.find((item) => income <= item.maxIncome);
      const eligible = housing.firstTimer && isCitizen(primaryUser) && Boolean(tier);
      grants.push({
        id: ehg.id, name: ehg.name, agency: ehg.agency, goalKey: 'housing',
        fundType: 'CPF', restricted: true,
        status: eligible ? 'AVAILABLE' : 'NOT_ELIGIBLE',
        amount: eligible ? tier.amount : 0,
        reason: eligible
          ? `First-timer household earning ${money(income)}/month falls in the ${money(tier.amount)} tier.`
          : `Household income of ${money(income)}/month is above the ${money(ceiling)} ceiling.`,
        action: eligible ? ehg.actionRecommendation : 'No action needed; recheck if household income changes before the flat application.',
        nextDate: null
      });
    }

    // Children: Baby Bonus Cash Gift and Child Development Account.
    const babyBonus = findScheme('baby_bonus_cda');
    dependents.filter((child) => child.relation === 'Child' && isCitizen(child) && child.birthDate).forEach((child) => {
      const age = ageInYears(child.birthDate, now);
      if (!babyBonus || age > babyBonus.eligibilityCriteria.childAgeMax) return;
      const firstName = String(child.name).split(' ')[0];
      const cda = child.cda || {};
      const cdaCloses = cda.closesOn || `${new Date(child.birthDate).getFullYear() + 12}-12`;
      const cashGiftEnds = addYearsAndMonths(child.birthDate, 6, 6);

      grants.push({
        id: `cash_gift_${firstName.toLowerCase()}`, childName: child.name, name: `Baby Bonus Cash Gift (${firstName})`, agency: babyBonus.agency, goalKey: 'education',
        fundType: 'CASH', restricted: false,
        status: monthsUntil(cashGiftEnds, now) > 0 ? 'RECEIVING' : 'RECEIVED',
        amount: babyBonus.benefits.cashGift,
        reason: `Paid to you in instalments until ${firstName} is 6½. It is flexible cash, so you can choose to set it aside for education.`,
        action: `Check the remaining instalments on LifeSG and consider routing them to ${firstName}'s education goal.`,
        nextDate: cashGiftEnds
      });

      grants.push({
        id: `cda_first_step_${firstName.toLowerCase()}`, childName: child.name, name: `CDA First Step Grant (${firstName})`, agency: babyBonus.agency, goalKey: 'education',
        fundType: 'RESTRICTED_CDA', restricted: true,
        status: cda.firstStepGrantReceived ? 'RECEIVED' : 'AVAILABLE',
        amount: babyBonus.benefits.firstStepGrant,
        reason: `Already in ${firstName}'s CDA and counted in the education goal's starting balance. CDA funds are restricted to approved childcare, preschool and healthcare uses.`,
        action: cda.firstStepGrantReceived ? 'No action needed.' : babyBonus.actionRecommendation,
        nextDate: null
      });

      const matchingLeft = Math.max(0, babyBonus.benefits.dollarForDollarMatchLimit - Number(cda.governmentMatched || 0));
      if (matchingLeft > 0) {
        grants.push({
          id: `cda_matching_${firstName.toLowerCase()}`, childName: child.name, name: `CDA dollar-for-dollar matching (${firstName})`, agency: babyBonus.agency, goalKey: 'education',
          fundType: 'RESTRICTED_CDA', restricted: true,
          status: 'AVAILABLE',
          amount: matchingLeft,
          reason: `${money(Number(cda.governmentMatched || 0))} of the ${money(babyBonus.benefits.dollarForDollarMatchLimit)} matching cap is used. Each dollar you deposit is matched until the cap.`,
          action: `Deposit up to ${money(matchingLeft)} into ${firstName}'s OCBC CDA before ${cdaCloses} to receive up to ${money(matchingLeft)} more.`,
          nextDate: cdaCloses
        });
      }
    });

    // Housing-linked vouchers once the household lives in its HDB flat.
    const climate = findScheme('climate_vouchers');
    if (climate && String(housing.type || '').includes('BTO')) {
      const pending = Number(housing.mortgageOutstanding || 0) === 0;
      grants.push({
        id: climate.id, name: climate.name, agency: climate.agency, goalKey: 'housing',
        fundType: 'VOUCHER', restricted: true,
        status: pending ? 'UPCOMING' : 'AVAILABLE',
        amount: climate.amount,
        reason: pending
          ? `Available to HDB households, so it applies after key collection (${housing.keyCollectionDate}).`
          : 'Available to HDB households.',
        action: climate.actionRecommendation,
        nextDate: pending ? housing.keyCollectionDate : null
      });
    }

    // GST Voucher: individual assessable income ceiling.
    const gst = findScheme('gst_voucher_cash_medisave');
    if (gst) {
      const assessable = Number(primaryUser.monthlyGrossIncome || 0) * 12;
      const eligible = assessable <= gst.eligibilityCriteria.assessableIncomeMax;
      grants.push({
        id: gst.id, name: gst.name, agency: gst.agency, goalKey: null,
        fundType: 'CASH', restricted: false,
        status: eligible ? 'AVAILABLE' : 'NOT_ELIGIBLE',
        amount: eligible ? gst.annualAmount : 0,
        reason: eligible
          ? `Assessable income of ${money(assessable)} is within the ${money(gst.eligibilityCriteria.assessableIncomeMax)} limit.`
          : `Assessable income of about ${money(assessable)} is above the ${money(gst.eligibilityCriteria.assessableIncomeMax)} limit.`,
        action: eligible ? gst.actionRecommendation : 'No action needed.',
        nextDate: null
      });
    }

    const unclaimed = grants.filter((grant) => ['AVAILABLE', 'UPCOMING'].includes(grant.status));
    const totalGrantValue = unclaimed.reduce((sum, grant) => sum + grant.amount, 0);
    const restrictedValue = unclaimed.filter((grant) => grant.restricted).reduce((sum, grant) => sum + grant.amount, 0);
    const upcomingDates = grants.filter((grant) => grant.nextDate && grant.status !== 'NOT_ELIGIBLE')
      .map((grant) => ({ grantId: grant.id, name: grant.name, date: grant.nextDate }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      agentId: 'grants_agent', agentName: 'Grants & Government Benefits Agent',
      status: 'ESTIMATED', confidence: 0.9,
      totalGrantValue,
      restrictedValue,
      flexibleValue: totalGrantValue - restrictedValue,
      unclaimedCount: unclaimed.length,
      grants,
      upcomingDates,
      disclaimer: 'Estimates from published scheme rules and MyInfo data. Confirm with the agency before relying on them.',
      findings: [
        totalGrantValue > 0
          ? `About ${money(totalGrantValue)} in support is still available or upcoming, of which ${money(restrictedValue)} is restricted to specific uses.`
          : 'No further support was found from the consented household data.',
        ...grants.filter((grant) => grant.status === 'NOT_ELIGIBLE').map((grant) => `${grant.name}: ${grant.reason}`)
      ]
    };
  }
}

module.exports = new GrantsAgent();
