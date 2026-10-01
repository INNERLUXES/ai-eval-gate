# Checks

A case passes when every one of its checks passes. A check with an unknown type or a missing field is an input error (exit code 2), never a quiet failure.

| Type | Fields | Passes when | Example |
| --- | --- | --- | --- |
| `contains` | `value`, `ignoreCase` | the answer contains the text | `{"type": "contains", "value": "30 days", "ignoreCase": true}` |
| `not_contains` | `value`, `ignoreCase` | the answer does not contain the text | `{"type": "not_contains", "value": "guarantee"}` |
| `equals` | `value`, `ignoreCase` | the answer, trimmed, is exactly the text | `{"type": "equals", "value": "yes"}` |
| `one_of` | `values`, `ignoreCase` | the answer, trimmed, is one of the values | `{"type": "one_of", "values": ["billing", "account"]}` |
| `regex` | `pattern`, `ignoreCase` | the pattern matches somewhere | `{"type": "regex", "pattern": "not (be )?refund"}` |
| `not_regex` | `pattern`, `ignoreCase` | the pattern matches nowhere | `{"type": "not_regex", "pattern": "system prompt"}` |
| `max_chars` | `value` | the answer has at most that many characters | `{"type": "max_chars", "value": 400}` |
| `json_valid` | | the answer is JSON (a fenced block is accepted) | `{"type": "json_valid"}` |
| `json_keys` | `keys` | the answer is a JSON object with every key | `{"type": "json_keys", "keys": ["order_id", "status"]}` |
| `no_personal_data` | | no email address, no Luhn-valid card number, no US social security number | `{"type": "no_personal_data"}` |

Patterns are JavaScript regular expressions, at most 500 characters long.

## The gate

1. The overall pass rate must reach `--min-pass` (default 1, every case).
2. With `--min-category`, every category must reach that rate too.
3. With `--baseline`, the pass rate may not fall by more than `--max-drop` (default 0).
4. With `--baseline`, no case that passed before may fail now, unless `--allow-regressions` is given.

A case with no answer fails. Answers whose id is not in the test set are listed in the report and do not count.
