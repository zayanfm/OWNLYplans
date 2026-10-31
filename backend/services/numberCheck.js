// "The AI cannot be wrong silently": every amount, percentage and month count in AI-written
// text must match a figure produced by the calculation engine, or the text is not shown.

const PATTERNS = [
  { kind: 'money', re: /S\$\s?(\d[\d,]*(?:\.\d+)?)\s?([kKmM])?(?![a-zA-Z])/g },
  { kind: 'percent', re: /(\d+(?:\.\d+)?)\s?%/g },
  { kind: 'months', re: /(\d+(?:\.\d+)?)\s?months?\b/gi }
];
const SCALE = { k: 1e3, K: 1e3, m: 1e6, M: 1e6 };

const extract = (text = '') => PATTERNS.flatMap(({ kind, re }) => (
  [...String(text).matchAll(re)].map((match) => ({
    kind,
    raw: match[0].trim(),
    value: Number(match[1].replace(/,/g, '')) * (SCALE[match[2]] || 1)
  }))
));

// Every number the engine produced, including figures inside its own explanatory strings.
// Rates are also accepted in percent form (0.045 -> 4.5).
const collectAllowed = (sources) => {
  const allowed = new Set();
  const walk = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      allowed.add(value);
      if (Math.abs(value) < 1) allowed.add(Number((value * 100).toFixed(4)));
    } else if (typeof value === 'string') {
      extract(value).forEach((item) => allowed.add(item.value));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  sources.forEach(walk);
  return [...allowed];
};

// Rounded figures are accepted ("S$16k" for 16,000; "4.1 months" for 4.06).
const isKnown = (value, allowed) => allowed.some((known) => Math.abs(known - value) <= Math.max(0.05, Math.abs(known) * 0.005));

/**
 * Checks AI text against engine output. Returns which figures could not be traced back.
 * Text with no figures passes; text with any untraceable figure fails.
 */
const verify = (text, ...sources) => {
  const found = extract(text);
  const allowed = collectAllowed(sources);
  const mismatches = found.filter((item) => !isKnown(item.value, allowed)).map((item) => item.raw);
  return { checked: found.length, mismatches, passed: mismatches.length === 0 };
};

module.exports = { verify, extract };
