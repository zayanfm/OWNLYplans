// Shared, deterministic finance helpers. All money is in SGD; rates are annual.

const futureValue = (current, monthly, annualRate, months) => {
  const monthlyRate = annualRate / 12;
  if (!monthlyRate) return Math.round(current + monthly * months);
  const growth = Math.pow(1 + monthlyRate, months);
  return Math.round(current * growth + monthly * ((growth - 1) / monthlyRate));
};

const requiredMonthly = (current, target, months, annualRate) => {
  if (months <= 0) return Math.max(0, Math.ceil(target - current));
  const monthlyRate = annualRate / 12;
  const growth = Math.pow(1 + monthlyRate, months);
  const factor = monthlyRate ? (growth - 1) / monthlyRate : months;
  return Math.max(0, Math.ceil((target - current * growth) / factor));
};

// Months needed to reach the target, or null if it is not reached within 50 years.
const monthsToReach = (current, target, monthly, annualRate) => {
  if (current >= target) return 0;
  for (let months = 1; months <= 600; months += 1) {
    if (futureValue(current, monthly, annualRate, months) >= target) return months;
  }
  return null;
};

const parseMonth = (isoMonth) => {
  const [year, month] = String(isoMonth).split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1);
};

const monthsUntil = (isoMonth, from = new Date()) => {
  const target = parseMonth(isoMonth);
  return Math.max(0, (target.getFullYear() - from.getFullYear()) * 12 + target.getMonth() - from.getMonth());
};

const addMonthsIso = (months, from = new Date()) => {
  const date = new Date(from.getFullYear(), from.getMonth() + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const money = (value) => `S$${Math.round(value).toLocaleString('en-SG')}`;

module.exports = { futureValue, requiredMonthly, monthsToReach, monthsUntil, addMonthsIso, parseMonth, money };
