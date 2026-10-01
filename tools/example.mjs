// Runs the README example: release 2 of the made-up assistant against the release 1 baseline.
// The gate must FAIL there (a case that passed before fails now), so this script exits 0 only when it does.

import { main } from '../src/index.js';

let out = '';
const code = await main(
  ['examples/tests.jsonl', 'examples/answers-v2.jsonl', '--baseline', 'examples/baseline-v1.json', '--min-pass', '0.8'],
  { out: (t) => { out += t; }, err: (t) => process.stderr.write(t) }
);
process.stdout.write(out);
if (code !== 1 || !out.includes('regressions: order-status-json')) {
  console.error(`example: expected the gate to fail on the order-status-json regression, got exit code ${code}`);
  process.exit(1);
}
