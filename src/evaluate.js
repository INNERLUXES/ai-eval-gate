// Scores the answers against the test set, summarizes by category, compares with a baseline and decides the gate.

import { runCheck } from './checks.js';

// Returns { cases: [{ id, category, pass, missing, failures: [detail] }] }.
export function evaluate(testSet, answers) {
  const cases = testSet.map((c) => {
    if (!answers.has(c.id)) return { id: c.id, category: c.category, pass: false, missing: true, failures: ['no answer for this case'] };
    const output = answers.get(c.id);
    const failures = [];
    c.checks.forEach((check, i) => {
      let result;
      try {
        result = runCheck(output, check);
      } catch (error) {
        throw new Error(`case "${c.id}", check ${i + 1}: ${error.message}`);
      }
      if (!result.pass) failures.push(result.detail);
    });
    return { id: c.id, category: c.category, pass: failures.length === 0, missing: false, failures };
  });
  const extra = [...answers.keys()].filter((id) => !testSet.some((c) => c.id === id));
  return { cases, extra };
}

function rate(list) {
  return list.length ? list.filter((c) => c.pass).length / list.length : 0;
}

export function summarize(result) {
  const categories = {};
  for (const c of result.cases) {
    if (!categories[c.category]) categories[c.category] = [];
    categories[c.category].push(c);
  }
  return {
    total: result.cases.length,
    passed: result.cases.filter((c) => c.pass).length,
    passRate: rate(result.cases),
    categories: Object.keys(categories).sort().map((name) => ({
      name,
      total: categories[name].length,
      passed: categories[name].filter((c) => c.pass).length,
      passRate: rate(categories[name])
    }))
  };
}

// baseline: a JSON report written earlier by this tool (--format json). Regressions = cases that passed then and fail now.
export function compare(result, baseline) {
  if (!baseline || !Array.isArray(baseline.cases)) return null;
  const before = new Map(baseline.cases.map((c) => [c.id, c.pass]));
  const regressions = result.cases.filter((c) => before.get(c.id) === true && !c.pass).map((c) => c.id);
  const fixed = result.cases.filter((c) => before.get(c.id) === false && c.pass).map((c) => c.id);
  return { passRateBefore: typeof baseline.passRate === 'number' ? baseline.passRate : null, regressions, fixed };
}

// options: { minPass (0..1), minCategory (0..1 or null), maxDrop (0..1), allowRegressions (bool) }
export function gate(summary, comparison, options) {
  const reasons = [];
  if (summary.passRate < options.minPass) reasons.push(`pass rate ${pct(summary.passRate)} is below ${pct(options.minPass)}`);
  if (options.minCategory !== null && options.minCategory !== undefined) {
    for (const c of summary.categories) if (c.passRate < options.minCategory) reasons.push(`category "${c.name}" at ${pct(c.passRate)} is below ${pct(options.minCategory)}`);
  }
  if (comparison) {
    if (comparison.passRateBefore !== null && comparison.passRateBefore - summary.passRate > options.maxDrop + 1e-9) {
      reasons.push(`pass rate fell from ${pct(comparison.passRateBefore)} to ${pct(summary.passRate)}`);
    }
    if (!options.allowRegressions && comparison.regressions.length) reasons.push(`${comparison.regressions.length} case(s) passed before and fail now`);
  }
  return { pass: reasons.length === 0, reasons };
}

export function pct(x) {
  return `${(Math.round(x * 1000) / 10).toFixed(1)}%`;
}
