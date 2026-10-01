# 2. A regression fails the gate even when the pass rate holds

## Context

A new prompt often fixes some answers and breaks others. The overall pass rate can stay the same while a case that customers depend on stops working.

## Decision

With a baseline, any case that passed in the last accepted release and fails now fails the gate, unless the team passes `--allow-regressions` on purpose.

## Consequences

Trading one working answer for another needs a visible decision in the pipeline, not a lucky average. The release 2 example in the README shows the case.
