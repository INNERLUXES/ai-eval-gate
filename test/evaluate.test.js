import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonl, loadTestSet, loadAnswers, evaluate, summarize, compare, gate, pct } from '../src/index.js';

const tests = [
  '# comment',
  '{"id": "a", "category": "x", "checks": [{"type": "contains", "value": "yes"}]}',
  '',
  '{"id": "b", "category": "x", "checks": [{"type": "contains", "value": "yes"}]}',
  '{"id": "c", "checks": [{"type": "contains", "value": "yes"}]}'
].join('\n');

test('parseJsonl skips blank and comment lines and names the bad line', () => {
  assert.equal(parseJsonl('\n# x\n{"a":1}\n', 't').length, 1);
  assert.throws(() => parseJsonl('{"a":1}\n{oops', 'answers'), /answers line 2: not valid JSON/);
  assert.throws(() => parseJsonl('[1]', 'answers'), /must be a JSON object/);
});

test('loadTestSet and loadAnswers refuse duplicates and missing fields', () => {
  assert.equal(loadTestSet(tests).length, 3);
  assert.equal(loadTestSet(tests)[2].category, 'general');
  assert.throws(() => loadTestSet('{"id": "a", "checks": []}'), /non-empty array/);
  assert.throws(() => loadTestSet('{"id": "a", "checks": [{"type": "json_valid"}]}\n{"id": "a", "checks": [{"type": "json_valid"}]}'), /appears twice/);
  assert.throws(() => loadAnswers('{"id": "a", "output": 5}'), /must be a string/);
  assert.throws(() => loadTestSet('# nothing'), /no cases/);
});

test('evaluate: a missing answer fails its case; extra answers are listed', () => {
  const answers = loadAnswers('{"id": "a", "output": "yes"}\n{"id": "b", "output": "no"}\n{"id": "z", "output": "yes"}');
  const r = evaluate(loadTestSet(tests), answers);
  assert.deepEqual(r.cases.map((c) => [c.id, c.pass, c.missing]), [['a', true, false], ['b', false, false], ['c', false, true]]);
  assert.deepEqual(r.extra, ['z']);
  const s = summarize(r);
  assert.equal(s.passed, 1);
  assert.deepEqual(s.categories.map((c) => [c.name, c.passed, c.total]), [['general', 0, 1], ['x', 1, 2]]);
});

test('compare finds regressions and fixes against a baseline report', () => {
  const now = { cases: [{ id: 'a', pass: false }, { id: 'b', pass: true }, { id: 'c', pass: true }] };
  const before = { passRate: 0.5, cases: [{ id: 'a', pass: true }, { id: 'b', pass: false }] };
  assert.deepEqual(compare(now, before), { passRateBefore: 0.5, regressions: ['a'], fixed: ['b'] });
  assert.equal(compare(now, null), null);
});

test('gate: overall line, category line, drop and regressions', () => {
  const summary = { passRate: 0.75, categories: [{ name: 'x', passRate: 0.5 }, { name: 'y', passRate: 1 }] };
  const opts = { minPass: 0.7, minCategory: null, maxDrop: 0, allowRegressions: false };
  assert.equal(gate(summary, null, opts).pass, true);
  assert.match(gate(summary, null, { ...opts, minPass: 0.8 }).reasons[0], /75\.0% is below 80\.0%/);
  assert.match(gate(summary, null, { ...opts, minCategory: 0.6 }).reasons[0], /category "x"/);
  assert.match(gate(summary, { passRateBefore: 0.8, regressions: [], fixed: [] }, opts).reasons[0], /fell from 80\.0% to 75\.0%/);
  assert.equal(gate(summary, { passRateBefore: 0.8, regressions: [], fixed: [] }, { ...opts, maxDrop: 0.05 }).pass, true);
  assert.equal(gate(summary, { passRateBefore: 0.75, regressions: ['a'], fixed: [] }, { ...opts, allowRegressions: true }).pass, true);
  assert.equal(pct(2 / 3), '66.7%');
});
