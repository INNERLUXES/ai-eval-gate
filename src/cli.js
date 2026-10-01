// Command line: ai-eval-gate <tests.jsonl> <answers.jsonl> [options]

import { readFile, writeFile } from 'node:fs/promises';
import { loadTestSet, loadAnswers } from './load.js';
import { evaluate, summarize, compare, gate } from './evaluate.js';
import { toText, toMarkdown, toJson } from './report.js';

const FORMATS = { text: toText, markdown: toMarkdown, json: toJson };

export const USAGE = `Usage: ai-eval-gate <tests.jsonl> <answers.jsonl> [options]

Scores the answers an AI model gave against a test set and fails when quality is below the agreed line,
or worse than the last release.

Options:
  --min-pass <0..1>       lowest overall pass rate that passes the gate (default: 1)
  --min-category <0..1>   lowest pass rate allowed in any one category (default: off)
  --baseline <file>       a JSON report from the last release, to compare with
  --max-drop <0..1>       how far the pass rate may fall below the baseline (default: 0)
  --allow-regressions     do not fail when a case that passed before fails now
  --format <name>         text, markdown or json (default: text)
  --output <file>         write the report to a file instead of the screen
  --help                  show this text
`;

function share(name, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error(`${name} takes a number from 0 to 1`);
  return n;
}

export function parseArgs(argv) {
  const o = { tests: null, answers: null, minPass: 1, minCategory: null, baseline: null, maxDrop: 0, allowRegressions: false, format: 'text', output: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`);
      i += 1;
      return v;
    };
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--min-pass') o.minPass = share(a, next());
    else if (a === '--min-category') o.minCategory = share(a, next());
    else if (a === '--max-drop') o.maxDrop = share(a, next());
    else if (a === '--baseline') o.baseline = next();
    else if (a === '--allow-regressions') o.allowRegressions = true;
    else if (a === '--format') o.format = next();
    else if (a === '--output') o.output = next();
    else if (a.startsWith('-')) throw new Error(`unknown option ${a}`);
    else if (o.tests === null) o.tests = a;
    else if (o.answers === null) o.answers = a;
    else throw new Error(`unexpected argument ${a}`);
  }
  if (!o.help) {
    if (!o.tests || !o.answers) throw new Error('give the test set and the answers file');
    if (!FORMATS[o.format]) throw new Error(`unknown format ${o.format}`);
  }
  return o;
}

// Exit code: 0 gate passes, 1 gate fails, 2 usage or input error.
export async function main(argv, io = { out: (t) => process.stdout.write(t), err: (t) => process.stderr.write(t) }) {
  let o;
  try {
    o = parseArgs(argv);
  } catch (error) {
    io.err(`ai-eval-gate: ${error.message}\n\n${USAGE}`);
    return 2;
  }
  if (o.help) {
    io.out(USAGE);
    return 0;
  }
  let report;
  try {
    const testSet = loadTestSet(await readFile(o.tests, 'utf8'));
    const answers = loadAnswers(await readFile(o.answers, 'utf8'));
    const baseline = o.baseline ? JSON.parse(await readFile(o.baseline, 'utf8')) : null;
    const result = evaluate(testSet, answers);
    const summary = summarize(result);
    const comparison = compare(result, baseline);
    report = { result, summary, comparison, gate: gate(summary, comparison, o) };
  } catch (error) {
    io.err(`ai-eval-gate: ${error.message}\n`);
    return 2;
  }
  const out = FORMATS[o.format](report);
  if (o.output) await writeFile(o.output, out, 'utf8');
  else io.out(out);
  return report.gate.pass ? 0 : 1;
}
