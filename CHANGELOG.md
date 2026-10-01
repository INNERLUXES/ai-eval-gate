# Changes

## 1.0.0

First release.

- Test set and answers as JSON Lines; cases grouped by category.
- Ten checks: contains, not_contains, equals, one_of, regex, not_regex, max_chars, json_valid, json_keys, no_personal_data.
- Gate on the overall pass rate, on each category, on the drop since a baseline report, and on any case that passed before and fails now.
- Reports as text, Markdown and JSON; the JSON report is the baseline for the next release.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
