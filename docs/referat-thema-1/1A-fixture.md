# Shared fixture for application-host resource isolation

This is step 2 of the [A1 experiment contract](./1A-experiment-contract.md).
Niklas owns the fixture tooling shared with assignments 1B and 1C
([issues #9](https://github.com/NiklasSkulll/arsnova.eu/issues/9) and
[#10](https://github.com/NiklasSkulll/arsnova.eu/issues/10)). The existing
[Issue #456 reference fixtures](../../libs/shared-types/src/moderation-prompt-context-fixtures.ts)
remain the authoritative source for the six questions and their metadata.

## Generate and inspect offline

Use the Node version in `.nvmrc`, for example `nvm use`, and build the shared
library before running the CLI:

```bash
npm run build -w @arsnova/shared-types
npm run load:resource-isolation:fixture -- --validate
npm run load:resource-isolation:fixture:test
```

The validation summary reports the version, seed, SHA-256 hash, counts and shared
ownership. To inspect the full JSON without npm's command banner:

```bash
node scripts/load/resource-isolation-fixture.mjs --print > /tmp/arsnova-1a-fixture.json
```

Both modes operate without network, database, model downloads or environment
credentials. They do not create sessions, seed a database or run a benchmark.
Lab preparation in the later experiment runner must instantiate five separate
analysis sessions from the same fixture and keep the live session separate.

## Contents and projections

| Section                      | Meaning                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `reference`                  | Six original texts and complete question metadata, including `PENDING` states, vote counts, scores, uncertainty and the participant basis of 200 |
| `counterCases`               | Available zero votes (`unrated`), unavailable votes (`missing-votes`), uncertain NLP (`uncertain-nlp`) and pending moderation (`pending`)        |
| `analysis.questions`         | Exactly 500 eligible, distinct raw texts: six projected reference rows, two counter-case rows and 492 filler rows                                |
| `analysis.exclusionControls` | Three additional rows with `PENDING`, `ARCHIVED` and `DELETED` status; keep these out of the actual analysis input                               |

Every call returns independent data. Mutating an A1 projection cannot change the
shared reference fixture or another generated copy. The original pairings A/B,
C/D and E/F remain context-test assumptions, not real encoder expectations.

In the A1 analysis projection, reference `PINNED` stays pinned; other reference
states become `ACTIVE`. Positive and negative vote counts are preserved, and
`upvoteCount` is the signed net count. The participant basis stays 200 and is
independent of the 500-arrival live workload. Pending/archived/deleted controls
must be stored with their declared status when a later lab loader is implemented.
They bring the stored A1 question count to 503 while the eligible count stays 500.

Unavailable votes stay unavailable in the context counter-case and are not
converted to zero-valued analysis rows. The zero-vote case has explicit available
zero counts and zero scores. The uncertain case reuses the existing uncertain
NLP metadata. These metadata cases do not activate the disabled Q&A classifier.

The filler reuses the existing German reference sentences because the protocol
uses locale `de`. Seeded sentence selection and numeric suffixes make all 500
analysis texts distinct before normalization. The two selected analysis
counter-cases receive a `(0)` suffix; their context versions retain the original
text. Filler suffixes start at `(1)` and end at `(492)`.

This controlled corpus intentionally repeats a small vocabulary. It exercises
the 500-item path without raw-text deduplication reducing the workload, but does
not represent broad linguistic diversity or demonstrate model quality. Actual
payload sizes, sidecar calls and successful normalization still need a lab pilot.

## Identity and reproducibility

The default version is `resource-isolation-fixture-v1`; its seed is decimal
`438314513` (`0x1a202611`). Other unsigned 32-bit decimal seeds are accepted:

```bash
node scripts/load/resource-isolation-fixture.mjs --validate --seed 0
node scripts/load/resource-isolation-fixture.mjs --print --seed 0
```

Filler selection uses the unsigned recurrence
`state = (1664525 * state + 1013904223) modulo 2^32`, followed by
`state modulo 6` to select a reference sentence. This is a reproducibility
mechanism, not a cryptographic random generator or representative sampling model.

Hash material is the entire fixture: compact UTF-8 JSON with recursively sorted
object keys and preserved array order, without a trailing newline. SHA-256 is
computed over those bytes. The CLI adds a newline for terminal output; exclude
that newline when independently hashing a printed file. This local serialization
contract does not claim conformance to a separate JSON canonicalization standard.

For the default fixture at step 2, the hash is:

```text
da24eeb3db1f7e08399583f527bf5f889ccb98cddd67fd0be84ec0e4dea17ded
```

The versioned
[fixture manifest](../../scripts/load/fixtures/resource-isolation-v1.manifest.json)
records this default identity and is checked against generated content by a
regression test. It identifies test inputs; it is not a run manifest and contains
no claim about approved hardware, a release baseline or measurement results.

Record the generated version, seed and hash in each run manifest. A change in
texts, metadata, projection, seed or source fixture changes the hash. Compare
hashes before comparing measurements and record any deliberate fixture revision.
Runtime session/question IDs and credentials belong to a separate ephemeral lab
mapping and are not added to the canonical fixture. When validating loaded data,
map it back to fixture keys before comparing content; do not confuse the runtime
mapping with the hashed artifact.

## Verification

The fixture tests exercise reference preservation, missing-versus-zero votes,
eligibility, unique texts, real shared-schema compatibility, seed boundaries,
independent copies, canonical serialization and hash sensitivity. CLI tests run
the actual process, compare summaries with printed content and reject invalid
modes/seeds. They also supply unusable connection settings to verify that fixture
generation does not require configured services.

`npm test` and `npm run test:coverage` run the fixture test command; the existing
CI coverage job therefore includes these checks. Shared-types are built before
these Node tests so they read the current public package exports.
