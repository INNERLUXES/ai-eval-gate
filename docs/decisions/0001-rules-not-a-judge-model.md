# 1. Rules, not a judge model

## Context

Answers of a language model can be scored by a second model acting as a judge, or by rules written for each case. A judge model understands meaning but costs money on every run, changes when its provider updates it, and needs its own evaluation.

## Decision

The tool scores answers with rules only: text that must or must not appear, patterns, formats, length and personal data.

## Consequences

The same answers always get the same score, the gate runs on every commit at no cost, and a failure points at the exact rule that broke. Meaning that cannot be written as a rule is left to a person reviewing a sample, as docs/limits.md says.
