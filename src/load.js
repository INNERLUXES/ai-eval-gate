// Reads the two input files. Both are JSON Lines: one JSON object per line, blank lines and lines starting with # skipped.
//   test set: { "id": "...", "category": "...", "checks": [ { "type": "...", ... } ] }
//   answers:  { "id": "...", "output": "..." }

export function parseJsonl(text, name) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    let value;
    try {
      value = JSON.parse(t);
    } catch (error) {
      throw new Error(`${name} line ${i + 1}: not valid JSON (${error.message})`);
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} line ${i + 1}: each line must be a JSON object`);
    rows.push({ line: i + 1, value });
  });
  return rows;
}

// The test set: every case needs a unique id and at least one check.
export function loadTestSet(text) {
  const cases = [];
  const seen = new Set();
  for (const { line, value } of parseJsonl(text, 'test set')) {
    if (typeof value.id !== 'string' || !value.id) throw new Error(`test set line ${line}: "id" must be a non-empty string`);
    if (seen.has(value.id)) throw new Error(`test set line ${line}: id "${value.id}" appears twice`);
    if (!Array.isArray(value.checks) || value.checks.length === 0) throw new Error(`test set line ${line}: "checks" must be a non-empty array`);
    seen.add(value.id);
    cases.push({ id: value.id, category: typeof value.category === 'string' && value.category ? value.category : 'general', checks: value.checks });
  }
  if (cases.length === 0) throw new Error('the test set has no cases');
  return cases;
}

// The answers: a map from id to the model's output text.
export function loadAnswers(text) {
  const answers = new Map();
  for (const { line, value } of parseJsonl(text, 'answers')) {
    if (typeof value.id !== 'string' || !value.id) throw new Error(`answers line ${line}: "id" must be a non-empty string`);
    if (answers.has(value.id)) throw new Error(`answers line ${line}: id "${value.id}" appears twice`);
    if (typeof value.output !== 'string') throw new Error(`answers line ${line}: "output" must be a string`);
    answers.set(value.id, value.output);
  }
  return answers;
}
