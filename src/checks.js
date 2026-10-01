// The checks an answer can be held to. Each returns { pass, detail }.
// docs/checks.md describes every type with an example.

function text(value, check) {
  return check.ignoreCase ? value.toLowerCase() : value;
}

function needle(check) {
  if (typeof check.value !== 'string' || check.value === '') throw new Error(`check "${check.type}" needs a non-empty "value"`);
  return check.ignoreCase ? check.value.toLowerCase() : check.value;
}

function regex(check) {
  if (typeof check.pattern !== 'string' || check.pattern === '') throw new Error(`check "${check.type}" needs a "pattern"`);
  if (check.pattern.length > 500) throw new Error(`check "${check.type}": pattern longer than 500 characters`);
  return new RegExp(check.pattern, check.ignoreCase ? 'i' : '');
}

function parseJson(output) {
  const t = output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(t);
}

// Card numbers are confirmed with the Luhn checksum, so ordinary long numbers are not reported.
export function luhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return digits.length >= 13 && sum % 10 === 0;
}

// Personal data the answer must not contain: email addresses, card numbers (Luhn) and US social security numbers.
export function findPersonalData(output) {
  const found = [];
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(output)) found.push('email address');
  for (const m of output.matchAll(/\b(?:\d[ -]?){13,19}\b/g)) {
    if (luhn(m[0].replace(/[ -]/g, ''))) {
      found.push('card number');
      break;
    }
  }
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(output)) found.push('social security number');
  return found;
}

export const CHECK_TYPES = {
  contains: (output, check) => ({ pass: text(output, check).includes(needle(check)), detail: `must contain "${check.value}"` }),
  not_contains: (output, check) => ({ pass: !text(output, check).includes(needle(check)), detail: `must not contain "${check.value}"` }),
  equals: (output, check) => ({ pass: text(output.trim(), check) === needle(check).trim(), detail: `must equal "${check.value}"` }),
  one_of: (output, check) => {
    if (!Array.isArray(check.values) || check.values.length === 0) throw new Error('check "one_of" needs a non-empty "values" array');
    const t = text(output.trim(), check);
    return { pass: check.values.some((v) => t === (check.ignoreCase ? String(v).toLowerCase() : String(v))), detail: `must be one of ${check.values.map((v) => `"${v}"`).join(', ')}` };
  },
  regex: (output, check) => ({ pass: regex(check).test(output), detail: `must match /${check.pattern}/` }),
  not_regex: (output, check) => ({ pass: !regex(check).test(output), detail: `must not match /${check.pattern}/` }),
  max_chars: (output, check) => {
    if (!Number.isInteger(check.value) || check.value < 1) throw new Error('check "max_chars" needs a positive whole "value"');
    return { pass: output.length <= check.value, detail: `at most ${check.value} characters (has ${output.length})` };
  },
  json_valid: (output) => {
    try {
      parseJson(output);
      return { pass: true, detail: 'must be valid JSON' };
    } catch {
      return { pass: false, detail: 'must be valid JSON' };
    }
  },
  json_keys: (output, check) => {
    if (!Array.isArray(check.keys) || check.keys.length === 0) throw new Error('check "json_keys" needs a non-empty "keys" array');
    let data;
    try {
      data = parseJson(output);
    } catch {
      return { pass: false, detail: 'must be JSON with the keys ' + check.keys.join(', ') };
    }
    const missing = check.keys.filter((k) => data === null || typeof data !== 'object' || !Object.prototype.hasOwnProperty.call(data, k));
    return { pass: missing.length === 0, detail: missing.length ? `JSON is missing ${missing.join(', ')}` : `JSON has ${check.keys.join(', ')}` };
  },
  no_personal_data: (output) => {
    const found = findPersonalData(output);
    return { pass: found.length === 0, detail: found.length ? `contains personal data: ${found.join(', ')}` : 'no personal data' };
  }
};

// Runs one check. An unknown type or a broken check is an input error, not a failed answer.
export function runCheck(output, check) {
  if (check === null || typeof check !== 'object' || typeof check.type !== 'string') throw new Error('every check needs a "type"');
  const fn = CHECK_TYPES[check.type];
  if (!fn) throw new Error(`unknown check type "${check.type}"`);
  return fn(output, check);
}
