# ai-eval-gate

Stops an AI release from shipping when its answers got worse.

A new prompt, a new model version or a new retrieval setting can fix one answer and quietly break another. Unit tests do not see it, because the code did not change; the answers did. This tool scores the answers a model gave against a test set of your own examples, compares them with the last release, and fails the build when:

- the share of passing cases is below the line you agreed,
- one category (safety, format, policy) falls below its own line,
- the pass rate dropped since the last release, or
- a case that passed before fails now, even if the overall rate stayed the same.

Plain JavaScript, no dependencies. It reads files, calls no model and opens no network connection: you produce the answers with your own model and pipeline, and this tool judges them.

```
npm test
```

```
ℹ tests 15
ℹ pass 15
ℹ fail 0
```

## Quick start

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/ai-eval-gate.git
cd ai-eval-gate
node bin/ai-eval-gate.js examples/tests.jsonl examples/answers-v2.jsonl --baseline examples/baseline-v1.json --min-pass 0.8
```

```
ai-eval-gate: 7 of 8 cases pass (87.5%)

  format: 1/2 (50.0%)
  policy: 3/3 (100.0%)
  safety: 3/3 (100.0%)

Failing cases:
  order-status-json [format]: must be valid JSON; must be JSON with the keys order_id, status

Against the baseline: 87.5% before
  regressions: order-status-json
  fixed: card-in-chat

GATE: FAIL - 1 case(s) passed before and fail now
```

Release 2 of the made-up support assistant in `examples/` stopped leaking an email address, but its new prompt broke the JSON the order page needs. The pass rate is the same as release 1; the gate still fails, because a case that worked before is broken.

## The two input files

Both are JSON Lines: one JSON object per line; blank lines and lines starting with `#` are skipped.

`tests.jsonl`, one case per line:

```json
{"id": "order-status-json", "category": "format", "checks": [{"type": "json_valid"}, {"type": "json_keys", "keys": ["order_id", "status"]}]}
```

`answers.jsonl`, what the model said for each case:

```json
{"id": "order-status-json", "output": "{\"order_id\": \"A-1042\", \"status\": \"shipped\"}"}
```

## Checks

`contains`, `not_contains`, `equals`, `one_of`, `regex`, `not_regex`, `max_chars`, `json_valid`, `json_keys` and `no_personal_data` (email addresses, card numbers confirmed with the Luhn checksum, US social security numbers). Text checks take `"ignoreCase": true`. Every type is described with an example in [docs/checks.md](docs/checks.md).

## Options

```
--min-pass <0..1>       lowest overall pass rate that passes the gate (default: 1)
--min-category <0..1>   lowest pass rate allowed in any one category
--baseline <file>       a JSON report from the last release
--max-drop <0..1>       how far the pass rate may fall below the baseline (default: 0)
--allow-regressions     do not fail when a case that passed before fails now
--format <name>         text, markdown or json
--output <file>         write the report to a file
```

Exit codes: `0` the gate passes, `1` it fails, `2` a usage or input error.

## In a pipeline

```yaml
- name: Answers of this release
  run: python scripts/run_model.py tests.jsonl > answers.jsonl   # your own step
- name: AI evaluation gate
  run: node ai-eval-gate/bin/ai-eval-gate.js tests.jsonl answers.jsonl --baseline eval/baseline.json --min-pass 0.95 --format markdown >> "$GITHUB_STEP_SUMMARY"
```

Keep the JSON report of each accepted release (`--format json --output eval/baseline.json`) as the baseline for the next one.

## What it is not

It does not judge meaning the way a person or a second model would; it checks what can be written as a rule. That covers more than it seems (facts that must appear, words that must not, formats, length, personal data), and it is repeatable and free to run on every commit. [docs/limits.md](docs/limits.md) lists what it cannot see.

## Background

- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/): sensitive information disclosure and improper output handling are two of the risks the checks catch.
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework): measuring an AI system before and after each change.
- How AI software is built and released: [AI software development services](https://innerluxes.dev/artificial-intelligence/software-development).

## License

MIT
