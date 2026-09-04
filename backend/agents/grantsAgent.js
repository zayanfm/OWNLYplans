const grantsCatalog = require('../data/grantsCatalog.json');

class GrantsAgent {
  async analyze(household) {
    const { primaryUser, partner, housing, dependents, financials } = household;
    const householdIncome = financials.householdMonthlyIncome || 10000;

    const eligibleGrants = [];
    let totalGrantValue = 0;

    // 1. Check Enhanced CPF Housing Grant (EHG)
    const ehgConfig = grantsCatalog.grants.find(g => g.id === 'ehg_housing_grant');
    if (housing && (housing.firstTimer || housing.type.includes('BTO'))) {
      if (householdIncome <= 9000) {
        let ehgAmount = 10000;
        for (const tier of ehgConfig.calculator.tiers) {
          if (householdIncome <= tier.maxIncome) {
            ehgAmount = tier.amount;
            break;
          }
        }

        eligibleGrants.push({
          id: 'ehg_housing_grant',
          name: 'Enhanced CPF Housing Grant (EHG)',
          category: 'HOUSING',
          amount: ehgAmount,
          status: 'ELIGIBLE_UNCLAIMED',
          agency: 'HDB / CPF Board',
          reason: `Combined income of S$${householdIncome.toLocaleString()} qualifies for S$${ehgAmount.toLocaleString()} first-timer grant.`,
          action: 'Auto-apply during flat booking via HDB Flat Portal integration'
        });
        totalGrantValue += ehgAmount;
      } else if (householdIncome <= 14000 && housing.type.includes('BTO')) {
        // High income ceiling still qualifies for base CPF housing grant if buying resale or standard BTO subsidised price
        eligibleGrants.push({
          id: 'bto_subsidised_pricing',
          name: 'HDB Market Discount & Subsidised Pricing',
          category: 'HOUSING',
          amount: 45000,
          status: 'APPLIED',
          agency: 'HDB',
          reason: `BTO pricing is already discounted ~25% against prevailing market resale prices.`,
          action: 'Reflected in BTO purchase contract'
        });
        totalGrantValue += 45000;
      }
    }

    // 2. Check Baby Bonus & CDA
    const babyBonusConfig = grantsCatalog.grants.find(g => g.id === 'baby_bonus_cda');
    if (dependents && dependents.some(d => d.age <= 12)) {
      const youngChild = dependents.find(d => d.age <= 12);
      const grantAmount = babyBonusConfig.benefits.firstStepGrant + babyBonusConfig.benefits.dollarForDollarMatchLimit;

      eligibleGrants.push({
        id: 'baby_bonus_cda',
        name: 'Baby Bonus CDA & First Step Grant',
        category: 'FAMILY',
        amount: grantAmount,
        status: 'ELIGIBLE_ACTION_REQUIRED',
        agency: 'MSF / OCBC',
        reason: `Eligible for S$5,000 First Step Grant + up to S$4,000 dollar-for-dollar co-matching for ${youngChild.name}.`,
        action: 'Pre-open OCBC CDA account to unlock instantaneous government matching'
      });
      totalGrantValue += grantAmount;
    }

    // 3. Climate Friendly Households Voucher
    eligibleGrants.push({
      id: 'climate_vouchers',
      name: 'Climate Friendly Households Programme',
      category: 'LIFESTYLE',
      amount: 300,
      status: 'AVAILABLE',
      agency: 'NEA',
      reason: 'All Singapore Citizen HDB households receive S$300 for eco-certified water/energy appliances.',
      action: 'Claim at RedeemSG via Singpass'
    });
    totalGrantValue += 300;

    // 4. Silver Support for Elderly Parents
    if (dependents && dependents.some(d => d.age >= 65)) {
      const elderly = dependents.find(d => d.age >= 65);
      eligibleGrants.push({
        id: 'silver_support',
        name: `Silver Support Scheme (${elderly.name})`,
        category: 'ELDERLY',
        amount: 4320, // S$1080/quarter
        status: 'ASSESSED_AUTOMATIC',
        agency: 'CPF Board',
        reason: `Quarterly cash supplement for elderly family members living in HDB flats.`,
        action: 'Automatic direct deposit into senior CPF/Bank account'
      });
      totalGrantValue += 4320;
    }

    return {
      agentId: 'grants_agent',
      agentName: 'Grants & Government Benefits Agent',
      status: 'BENEFITS_DISCOVERED',
      confidence: 0.98,
      totalGrantValue,
      unclaimedCount: eligibleGrants.filter(g => g.status.includes('ELIGIBLE')).length,
      grants: eligibleGrants,
      findings: [
        `Discovered S$${totalGrantValue.toLocaleString()} in eligible government schemes and housing subsidies.`,
        `Immediate action available: Pre-open OCBC CDA for S$5,000 upfront First Step Grant.`,
        `Singpass RedeemSG S$300 Climate Voucher is ready for redemption.`
      ]
    };
  }
}

module.exports = new GrantsAgent();
