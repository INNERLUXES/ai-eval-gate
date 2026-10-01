# Secure defaults

- **Strict by default.** `--min-pass` starts at 1: every case must pass until you choose a lower line on purpose.
- **Regressions fail.** With a baseline, a case that passed before and fails now fails the gate unless `--allow-regressions` is given.
- **No network, no model calls.** The tool only reads the files it is given.
- **No dependencies.** Node 22 or newer and nothing else.
- **Fails closed.** A gate failure gives exit code 1; a usage or input error gives exit code 2, never 0.
- **No values in reports.** Personal data is reported by kind, not copied into the report.
