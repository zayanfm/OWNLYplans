const householdStore = require('../models/householdStore');
const { money } = require('../utils/finance');

const SHARED_OWNERS = ['joint', 'household', undefined, null];
const isShared = (owner) => SHARED_OWNERS.includes(owner);

const contributionError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Who puts in what. Shared bills are split in proportion to each adult's take-home pay; what is
 * left is each person's own money. Each person chooses how much of it goes to the family pot
 * (shared goals) and how much to their own goals (e.g. their retirement). Anything not chosen
 * stays free; nothing is allocated on anyone's behalf.
 */
class ContributionService {
  adults(household) {
    const { primaryUser, partner } = household;
    return [
      { member: 'primary', person: primaryUser },
      ...(partner && !partner.left ? [{ member: 'partner', person: partner }] : [])
    ];
  }

  /**
   * @param goals planned goals (from goalModel.buildGoals), used to suggest amounts
   * @param options.extraShared extra monthly money added to the family pot (what-if "save more")
   */
  summarise(household, goals = [], { premium = 0, extraShared = 0 } = {}) {
    const adults = this.adults(household);
    const commitments = household.financials.commitments || [];
    const sharedBills = commitments.filter((item) => isShared(item.owner)).reduce((sum, item) => sum + item.monthlyAmount, 0);
    const totalTakeHome = adults.reduce((sum, { person }) => sum + Number(person.monthlyTakeHome || 0), 0) || 1;

    const people = adults.map(({ member, person }) => {
      const takeHome = Number(person.monthlyTakeHome || 0);
      const billShare = takeHome / totalTakeHome;
      const personalBills = commitments.filter((item) => item.owner === member).reduce((sum, item) => sum + item.monthlyAmount, 0);
      return {
        member,
        name: person.name,
        takeHome,
        billShare: Number(billShare.toFixed(3)),
        sharedBills: Math.round(sharedBills * billShare),
        personalBills,
        leftover: Math.max(0, Math.round(takeHome - sharedBills * billShare - personalBills))
      };
    });

    // Suggestions: the family pot's needs (plus protection) split in proportion to what each
    // person has left; then each person's own goals from the rest of their money.
    const sharedNeed = goals.filter((goal) => isShared(goal.owner)).reduce((sum, goal) => sum + goal.requiredMonthly, 0) + premium;
    const totalLeftover = people.reduce((sum, person) => sum + person.leftover, 0) || 1;
    const stored = householdStore.getContributions(household.id);
    // Suggestions: each person's fair share of the family pot's needs, by what they have left. If
    // someone has already chosen less than theirs, the others' suggestions cover the rest.
    const chosenShared = people.filter((person) => stored[person.member])
      .reduce((sum, person) => sum + Math.min(person.leftover, stored[person.member].toShared), 0);
    const openLeftover = people.filter((person) => !stored[person.member]).reduce((sum, person) => sum + person.leftover, 0) || 1;

    people.forEach((person) => {
      const fairShare = Math.ceil(sharedNeed * person.leftover / totalLeftover);
      const coverRest = stored[person.member] ? 0 : Math.ceil(Math.max(0, sharedNeed - chosenShared) * person.leftover / openLeftover);
      const suggestedShared = Math.min(person.leftover, Math.max(fairShare, coverRest));
      const personalNeed = goals.filter((goal) => goal.owner === person.member).reduce((sum, goal) => sum + goal.requiredMonthly, 0);
      const suggestedPersonal = Math.min(person.leftover - suggestedShared, personalNeed);
      const choice = stored[person.member];
      // Amounts above what someone now has left (e.g. after a pay cut) are capped, never borrowed.
      const toShared = Math.min(person.leftover, choice ? choice.toShared : suggestedShared);
      const toPersonal = Math.min(person.leftover - toShared, choice ? choice.toPersonal : suggestedPersonal);
      Object.assign(person, {
        suggested: { toShared: suggestedShared, toPersonal: suggestedPersonal },
        toShared,
        toPersonal,
        keptFree: person.leftover - toShared - toPersonal,
        status: choice ? 'CONFIRMED' : person.member === 'partner' ? 'PROPOSED' : 'SUGGESTED',
        confirmedBy: choice?.confirmedBy || null
      });
    });

    // What-if "save more": the extra goes into the family pot out of each person's free money.
    let extraLeft = Math.round(extraShared);
    people.forEach((person, index) => {
      const share = index === people.length - 1 ? extraLeft : Math.round(extraShared * person.leftover / totalLeftover);
      const moved = Math.min(person.keptFree, share, extraLeft);
      person.toShared += moved;
      person.keptFree -= moved;
      extraLeft -= moved;
    });

    const contributedShared = people.reduce((sum, person) => sum + person.toShared, 0);
    return {
      billSplit: { method: 'INCOME_PROPORTIONAL', note: 'Shared bills are split in proportion to take-home pay.' },
      sharedBills,
      people,
      familyPot: {
        contributed: contributedShared,
        protectionPremium: premium,
        available: Math.max(0, contributedShared - premium)
      },
      personalPots: Object.fromEntries(people.map((person) => [person.member, person.toPersonal]))
    };
  }

  /**
   * Sets a person's own amounts. Only that person can change them; the partner's choice is
   * simulated in the sandbox with actor 'partner', standing in for their own app.
   */
  setContribution(household, member, { toShared, toPersonal } = {}, actor = 'primary') {
    if (!['primary', 'partner'].includes(member)) throw contributionError(400, 'member must be primary or partner');
    if (member !== actor) {
      const name = member === 'partner' ? household.partner?.name : household.primaryUser.name;
      throw contributionError(403, `Only ${String(name).split(' ')[0]} can set their own contribution`);
    }
    const person = this.summarise(household).people.find((item) => item.member === member);
    if (!person) throw contributionError(404, 'That person is not in this household');
    const shared = Number(toShared);
    const personal = Number(toPersonal);
    if (![shared, personal].every((value) => Number.isFinite(value) && value >= 0)) {
      throw contributionError(400, 'Amounts must be zero or more');
    }
    if (shared + personal > person.leftover) {
      throw contributionError(400, `That is more than the ${money(person.leftover)} left after bills`);
    }
    return householdStore.saveContribution(household.id, member, {
      toShared: Math.round(shared),
      toPersonal: Math.round(personal),
      confirmedBy: actor,
      confirmedAt: new Date().toISOString()
    });
  }
}

module.exports = new ContributionService();
module.exports.isShared = isShared;
