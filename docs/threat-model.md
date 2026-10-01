# Threat model

## What the tool touches

- It reads the test set, the answers file and, with `--baseline`, one JSON report.
- It writes only when `--output` is given, and only that file.
- It opens no network connection, calls no model and runs nothing from the files it reads.

## What could go wrong, and what stops it

| Risk | Control |
| --- | --- |
| A pattern in the test set makes matching take very long | Patterns are limited to 500 characters; test sets come from your own repository |
| An answer holds personal data that then lands in a report or log | The report names the kind of data found, never the value itself |
| A Markdown report breaks its table or injects markup | Pipes and line breaks in ids, categories and messages are escaped |
| A broken check silently passes | Unknown types and missing fields stop the run with exit code 2 |
| A missing answer goes unnoticed | A case with no answer fails |

## Out of scope

The model, the prompts and the data the answers came from.
