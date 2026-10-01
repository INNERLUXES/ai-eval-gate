import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArgs, main, toMarkdown } from '../src/index.js';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const ex = (f) => join(root, 'examples', f);
const quiet = { out: () => {}, err: () => {} };

test('parseArgs reads options and refuses bad input', () => {
  const o = parseArgs(['t.jsonl', 'a.jsonl', '--min-pass', '0.9', '--min-category', '0.5', '--allow-regressions', '--format', 'json']);
  assert.equal(o.minPass, 0.9);
  assert.equal(o.minCategory, 0.5);
  assert.equal(o.allowRegressions, true);
  assert.throws(() => parseArgs(['t.jsonl']), /test set and the answers/);
  assert.throws(() => parseArgs(['t.jsonl', 'a.jsonl', '--min-pass', '90']), /from 0 to 1/);
  assert.throws(() => parseArgs(['t.jsonl', 'a.jsonl', '--format', 'xml']), /unknown format/);
});

test('release 1 of the example: 7 of 8 pass, the email in card-in-chat fails', async () => {
  let out = '';
  const code = await main([ex('tests.jsonl'), ex('answers-v1.jsonl'), '--format', 'json'], { out: (t) => { out += t; }, err: () => {} });
  const r = JSON.parse(out);
  assert.equal(code, 1);
  assert.equal(r.passed, 7);
  assert.deepEqual(r.cases.filter((c) => !c.pass).map((c) => c.id), ['card-in-chat']);
});

test('release 2 against the baseline: the gate fails on the regression even though the pass rate held', async () => {
  let out = '';
  const code = await main([ex('tests.jsonl'), ex('answers-v2.jsonl'), '--baseline', ex('baseline-v1.json'), '--min-pass', '0.8', '--format', 'json'],
    { out: (t) => { out += t; }, err: () => {} });
  const r = JSON.parse(out);
  assert.equal(code, 1);
  assert.equal(r.passRate, 7 / 8);
  assert.deepEqual(r.comparison.regressions, ['order-status-json']);
  assert.deepEqual(r.comparison.fixed, ['card-in-chat']);
  assert.equal(await main([ex('tests.jsonl'), ex('answers-v2.jsonl'), '--baseline', ex('baseline-v1.json'), '--min-pass', '0.8', '--allow-regressions'], quiet), 0);
});

test('Markdown escapes pipes; input errors give exit code 2', async () => {
  const md = toMarkdown({ gate: { pass: false, reasons: ['a|b'] }, summary: { passed: 0, total: 1, passRate: 0, categories: [{ name: 'x|y', passed: 0, total: 1, passRate: 0 }] },
    result: { cases: [{ id: 'c|d', category: 'x|y', pass: false, failures: ['e|f'] }], extra: [] } });
  assert.match(md, /x\\\|y/);
  assert.match(md, /`c\\\|d`/);
  assert.equal(await main(['missing.jsonl', ex('answers-v1.jsonl')], quiet), 2);
  assert.equal(await main(['--help'], quiet), 0);
});
