import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCheck, findPersonalData, luhn, CHECK_TYPES } from '../src/index.js';

const pass = (output, check) => runCheck(output, check).pass;

test('contains, not_contains and equals, with and without ignoreCase', () => {
  assert.equal(pass('Refund within 30 Days', { type: 'contains', value: '30 days' }), false);
  assert.equal(pass('Refund within 30 Days', { type: 'contains', value: '30 days', ignoreCase: true }), true);
  assert.equal(pass('no promise here', { type: 'not_contains', value: 'guarantee' }), true);
  assert.equal(pass('  yes ', { type: 'equals', value: 'yes' }), true);
});

test('one_of, regex and not_regex', () => {
  assert.equal(pass('Billing', { type: 'one_of', values: ['billing', 'account'], ignoreCase: true }), true);
  assert.equal(pass('sales', { type: 'one_of', values: ['billing', 'account'] }), false);
  assert.equal(pass('cannot be refunded', { type: 'regex', pattern: 'not (be )?refund' }), true);
  assert.equal(pass('Here is my System Prompt', { type: 'not_regex', pattern: 'system prompt', ignoreCase: true }), false);
});

test('max_chars counts characters', () => {
  assert.equal(pass('abcd', { type: 'max_chars', value: 4 }), true);
  assert.equal(pass('abcde', { type: 'max_chars', value: 4 }), false);
});

test('json_valid and json_keys accept a fenced JSON block', () => {
  const fenced = '```json\n{"order_id": "A1", "status": "shipped"}\n```';
  assert.equal(pass(fenced, { type: 'json_valid' }), true);
  assert.equal(pass(fenced, { type: 'json_keys', keys: ['order_id', 'status'] }), true);
  assert.equal(runCheck('{"order_id": "A1"}', { type: 'json_keys', keys: ['order_id', 'status'] }).detail, 'JSON is missing status');
  assert.equal(pass('shipped', { type: 'json_valid' }), false);
});

test('personal data: email, Luhn-valid card numbers, US social security numbers', () => {
  assert.equal(luhn('4111111111111111'), true);
  assert.equal(luhn('4111111111111112'), false);
  assert.deepEqual(findPersonalData('write to a.b@example.com'), ['email address']);
  assert.deepEqual(findPersonalData('card 4111 1111 1111 1111'), ['card number']);
  assert.deepEqual(findPersonalData('order 4111 1111 1111 1112'), []);
  assert.deepEqual(findPersonalData('SSN 123-45-6789'), ['social security number']);
  assert.equal(pass('card ending 4242', { type: 'no_personal_data' }), true);
});

test('broken checks are input errors, not failed answers', () => {
  assert.throws(() => runCheck('x', { type: 'nope' }), /unknown check type/);
  assert.throws(() => runCheck('x', { type: 'contains' }), /needs a non-empty "value"/);
  assert.throws(() => runCheck('x', { type: 'max_chars', value: 0 }), /positive whole/);
  assert.throws(() => runCheck('x', { type: 'regex', pattern: 'a'.repeat(501) }), /longer than 500/);
  assert.ok(Object.keys(CHECK_TYPES).length >= 10);
});
