// Report formats: text for a terminal, Markdown for a pull request or job summary, JSON to keep as the next baseline.

import { pct } from './evaluate.js';

function cell(t) {
  return String(t).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function toText(r) {
  const lines = [`ai-eval-gate: ${r.summary.passed} of ${r.summary.total} cases pass (${pct(r.summary.passRate)})`, ''];
  for (const c of r.summary.categories) lines.push(`  ${c.name}: ${c.passed}/${c.total} (${pct(c.passRate)})`);
  const failed = r.result.cases.filter((c) => !c.pass);
  if (failed.length) {
    lines.push('', 'Failing cases:');
    for (const c of failed) lines.push(`  ${c.id} [${c.category}]: ${c.failures.join('; ')}`);
  }
  if (r.comparison) {
    lines.push('', `Against the baseline: ${r.comparison.passRateBefore === null ? 'no pass rate' : pct(r.comparison.passRateBefore)} before`);
    if (r.comparison.regressions.length) lines.push(`  regressions: ${r.comparison.regressions.join(', ')}`);
    if (r.comparison.fixed.length) lines.push(`  fixed: ${r.comparison.fixed.join(', ')}`);
  }
  if (r.result.extra.length) lines.push('', `Answers with no case in the test set: ${r.result.extra.join(', ')}`);
  lines.push('', r.gate.pass ? 'GATE: PASS' : `GATE: FAIL - ${r.gate.reasons.join('; ')}`);
  return lines.join('\n') + '\n';
}

export function toMarkdown(r) {
  const lines = [`## ai-eval-gate: ${r.gate.pass ? 'pass' : 'fail'}`, '', `${r.summary.passed} of ${r.summary.total} cases pass (${pct(r.summary.passRate)})`, '',
    '| Category | Passed | Rate |', '| --- | --- | --- |'];
  for (const c of r.summary.categories) lines.push(`| ${cell(c.name)} | ${c.passed}/${c.total} | ${pct(c.passRate)} |`);
  const failed = r.result.cases.filter((c) => !c.pass);
  if (failed.length) {
    lines.push('', '| Failing case | Category | Why |', '| --- | --- | --- |');
    for (const c of failed) lines.push(`| \`${cell(c.id)}\` | ${cell(c.category)} | ${cell(c.failures.join('; '))} |`);
  }
  if (!r.gate.pass) lines.push('', `**Gate failed:** ${cell(r.gate.reasons.join('; '))}`);
  return lines.join('\n') + '\n';
}

export function toJson(r) {
  return JSON.stringify({
    total: r.summary.total,
    passed: r.summary.passed,
    passRate: r.summary.passRate,
    categories: r.summary.categories,
    gate: r.gate,
    comparison: r.comparison,
    cases: r.result.cases.map((c) => ({ id: c.id, category: c.category, pass: c.pass, failures: c.failures })),
    extraAnswers: r.result.extra
  }, null, 2) + '\n';
}
