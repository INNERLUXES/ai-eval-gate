# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

## Adding or changing a check

1. Describe the check in docs/checks.md first: its fields, when it passes, and an example.
2. Add a test with a small, made-up answer where the result can be worked out by hand.
3. A check that cannot be applied stops the run with an input error; it never passes quietly.

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the files it is given and writes only when `--output` is given. It opens no network connection and calls no model.
- Never commit real customer conversations or answers that hold personal data, even as fixtures.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
