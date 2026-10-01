# Limits

- **Meaning.** The checks are rules on the text. An answer that says the right thing in unexpected words can fail a `contains` check, and a wrong answer that happens to contain the right words can pass. Write checks on the facts that must appear and the things that must never appear, and keep a person reviewing a sample.
- **Personal data.** Only email addresses, card numbers that pass the Luhn checksum and US social security numbers are found. Names, addresses, phone numbers and identifiers of other countries are not.
- **One answer per case.** Models vary from run to run. Run the model several times and give each run its own answers file if you need to measure that spread; the tool scores one file at a time.
- **Producing the answers.** The tool calls no model. The answers come from your own pipeline, with the same model settings as production.
- **The test set itself.** A gate is only as good as its cases. Add a case for every real failure found in production, so it can never come back unnoticed.
