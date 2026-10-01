# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "ai-eval-gate security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include a small made-up test set and answers file that show the problem, what you expected and what happened.

## Scope

In scope:

- an input that makes the tool hang or use unbounded memory
- a report that copies personal data found in an answer
- a Markdown report that breaks its table
- a broken check that passes instead of stopping the run
- anything that makes the tool open a network connection, or read or write a file it was not given

Out of scope: the model and the prompts that produced the answers; docs/limits.md lists what rule checks cannot see.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
