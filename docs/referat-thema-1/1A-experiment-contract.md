# 1A experiment contract: resource isolation on the application host

**Owner:** Niklas (role X). **Contract version:** 1.
**Recorded:** 2026-11-07. **Status:** specified; measurement prerequisites open.
**Assignment:** [fork issue #6](https://github.com/NiklasSkulll/arsnova.eu/issues/6).

This document fixes the intended comparisons and decision rules before collecting
confirmatory measurements. It implements step 1 of the agreed seven-step A1
implementation plan. The fixture, load instrumentation,
resource collector, fault injector and experiment runner are later deliverables;
their behavior below is a requirement, not a claim that they already exist.

## Question, hypotheses and counter-alternative

**Individual title:** Protecting live moderation signals from optional spaCy
analysis on the Release 1.3 application host.

**Question:** Under the declared workload, can the application host run optional
word-cloud smoothing without exceeding the live-action budgets below?

- **H1:** Normal spaCy operation (V2) stays within both the relative and absolute
  p95 regression budgets against analysis without spaCy (V1), and meets the live
  error budget.
- **H2:** CPU throttling (V3) and delayed responses (V4) also stay within those
  live budgets against V1. Analysis duration and fallback frequency may increase;
  live isolation and analysis availability are evaluated separately.
- **Counter-alternative:** Keep `NLP_ENABLED=false` and use the existing lexical
  word cloud. Compare its reduced operating effort and resource demand with the
  limited benefit of merging inflected word forms.

V0 versus V1 measures the additional analysis path without spaCy. V1 versus V2
measures the additional spaCy path, including backend transport, parsing and
aggregation costs. Container metrics help locate resource competition; those
comparisons alone cannot attribute a delay to one particular process or function.

## Authority and baseline selection

The [exam specification](../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md), sections
4.1.1, 4.1.3 and 4.3, and
[ADR-0035](../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md)
define the scope and system boundaries. The
[research dossier](./1A-ressourcenisolation-app-host.md), section 10, supplies
experiment proposals. This contract selects explicit rules from those proposals;
they are experimental decisions, not previously verified performance properties.
Implementation details must be rechecked against the selected baseline.

| Item                          | Recorded state or requirement                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Local preparation branch      | `feature-1A-resource-isolation`                                                                                             |
| Inspected source commit       | `93bcf2e9288f66efafe809b617a93e70ba14de27`                                                                                  |
| Local `v1.3.0` tag target     | `87c39334619fbcb0c5782b061da1ba0df0ba3142`                                                                                  |
| Approved measurement baseline | Pending examiner/lab-owner confirmation; neither local reference above is automatically selected                            |
| Lab provision                 | Dependency of [issue #8](https://github.com/NiklasSkulll/arsnova.eu/issues/8); actual hardware and access remain unverified |
| Intended application host     | 8 vCPU / 16 GB RAM, as required by ADR-0035; actual hardware must be recorded                                               |
| Preparation runtime           | Node 24.18.0, matching `.nvmrc`; record the actual generator and application runtimes separately                            |
| Spending                      | No new paid resources authorized by this contract; confirm any additional cost before provisioning                          |

Before the first confirmatory run, record the approved application commit,
release tag, image identities, environment, fixture hash and contract revision.
Use the same application and sidecar images across variants. Keep the application
release code unchanged; identify measurement-tool commits separately. Local pilots
may prepare the tools but cannot replace a run on the approved baseline.

## Fixed environment and data

- Run only in an isolated lab with synthetic data. Record the target as a lab
  alias; retain connection details and credentials outside committed evidence.
- Use isolated container names, networks, volumes and ports. A different Compose
  project name alone is insufficient when `container_name` is explicitly set.
- Keep `app`, PostgreSQL, Redis and the PDF worker present. Run no PDF exports,
  backups, builds or unrelated benchmarks during a measurement.
- Keep `QA_NLP_ENABLED=false`, `WORD_CLOUD_SEMANTIC_ENABLED=false`,
  `QA_SUMMARY_ENABLED=false` and `OPEN_WEIGHT_LLM_ENABLED=false`. Do not start the
  encoder or LLM profiles. This choice limits the conclusion to that flag set.
- Keep `NLP_TIMEOUT_MS=5000` and `NLP_CACHE_TTL_SECONDS=1800`. Record effective
  resolved Compose values, not only values in an environment-file example.
- Use valid host tokens and participant capabilities through existing tRPC
  procedures. Session codes do not authorize requests. Obtain fresh credentials
  for each run and keep them out of reports and command output.
- Reuse the six reference texts and rankings from
  [`moderation-prompt-context-fixtures.ts`](../../libs/shared-types/src/moderation-prompt-context-fixtures.ts).
  Preserve the original reference fixture for 1C. Its A/B, C/D and E/F topic pairs
  are deterministic fixture groupings, not expected real-model output.
- For A1, prepare five separate analysis sessions with identical synthetic
  content, 500 eligible questions each, a fixed seed and recorded content hash.
  Include the reference texts, counter-cases and deterministic filler. Document
  the A1 projection to `ACTIVE`/`PINNED`; `analyzeQa` excludes `PENDING` questions.
  Record room size and reference rankings separately from the live-session size.
- Use a separate live session so `qa.submit` cannot mutate the analysis corpus.
  Verify identical corpus content and eligibility before and after every run.
  Generated database IDs may differ; hash the canonical fixture content and
  record its mapping to runtime data outside identity-free summaries.
- Place the load generator outside the measured application host where possible.
  Otherwise record its resource competition and restrict hardware conclusions.

The inspected production Compose gives spaCy 1 CPU, 1 GiB RAM and 64 PIDs, with
`network_mode: none`. App, PostgreSQL and Redis have no corresponding explicit
limits there. These are configuration facts, not measured memory consumption or
guaranteed resource reservations. Do not add limits to those services for A1.

## Workload and timing

The primary live profile is a **500-participant join wave**, based on
[`500-live-session.yml`](../../scripts/load/artillery/500-live-session.yml).
It does not establish 500 continuously connected or continuously active clients.

| Parameter                | Preregistered value                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Warm-up                  | 60 seconds, excluded from measured samples, using disposable sessions with the same scenario types                                           |
| Measured interval        | 300 seconds; collection and analysis schedules share one monotonic start time                                                                |
| Live arrivals            | 500 scheduled participants over the first 90 seconds                                                                                         |
| Per participant          | Join, status WebSocket subscription, session/question reads, one quiz vote, one tempo vote; every fifth participant submits one Q&A question |
| Intended mutation counts | 500 joins, 500 quiz votes, 100 Q&A submissions, 500 tempo votes                                                                              |
| Quiz question            | One active, untimed single-choice question throughout the live mutation phase                                                                |
| Results transition       | Scheduled at second 270; no early reveal based on successful-vote count                                                                      |
| Analysis clients         | Five independent host sessions, at most one analysis in flight per session                                                                   |
| Analysis schedule        | One call per host every 10 seconds, with fixed offsets 0/2/4/6/8 seconds; no catch-up burst                                                  |
| Analysis input           | `mode: 'LEXICAL'`, `locale: 'de'`, `metric: 'TOP'`, `normalization: 'LEMMA'`, `limit: 500`, `refresh: true`                                  |
| Repetitions              | Five complete blocks; each contains V0–V4 once in a seeded random order                                                                      |
| Optional outage          | V5 is a separately reported extension and does not replace a required variant                                                                |

This fixes a burst workload inside a five-minute observation interval. The quiet
tail is not sustained live traffic. Record actual connection concurrency and
timestamps so readers can distinguish arrivals, mutations, fan-out and idle time.
The existing Artillery runner needs later adaptation for this timing contract;
its current completion-driven reveal is not an implementation of this schedule.

A busy analysis session skips its next scheduled slot and records the skip; it
does not queue hidden work or move future slots. Record scheduled, started,
completed, rejected, timed-out and skipped calls, plus scheduler lateness and
in-flight work remaining at the end. Thus slower variants cannot appear to
preserve isolation merely by silently reducing the offered workload. Do not start
new work after the interval. Mark outstanding work as unfinished at the cutoff,
allow at most 60 seconds for draining, then cancel remaining work and stop the
run's generators/proxy. Report cleanup separately and use this policy for every
variant; late completions do not improve the measured-window availability rate.

## Variants

| Variant      | `NLP_ENABLED` | spaCy state                                         | Analysis load                    |
| ------------ | ------------- | --------------------------------------------------- | -------------------------------- |
| V0           | `false`       | Stopped                                             | None                             |
| V1           | `false`       | Stopped                                             | Fixed schedule; lexical fallback |
| V2           | `true`        | 1 CPU / 1 GiB, healthy real models                  | Fixed schedule                   |
| V3           | `true`        | 0.25 CPU / 1 GiB, healthy real models               | Fixed schedule                   |
| V4           | `true`        | 1 CPU / 1 GiB, real models behind a lab delay proxy | Fixed schedule                   |
| V5, optional | `true`        | Stopped after preparation                           | Fixed schedule                   |

V4 delays `/normalize` responses by 6000 ms before forwarding the request,
exceeding the configured 5000 ms client timeout. Preserve request/response
contracts and do not delay the health endpoint. Record the proxy source/image,
configuration and socket routing as an explicit variant. Verify the timeout with
a contract test; a client timeout does not prove upstream computation stopped.

Recreate the relevant lab containers and prepare fresh session data per run.
Wait for readiness and use the same warm-up before measuring. Restore CPU limits,
socket routing and flags between variants. Record container identities and
counter baselines; do not subtract process-lifetime p95 values or memory peaks.

## Measurements and decision rules

For each live action, retain attempt counts, outcomes and duration samples.
Report p50/p95/p99 of successful calls using nearest-rank percentiles and evaluate
budgets before display rounding. Record failed-call durations separately. An
empty successful sample set is unavailable, never zero latency or a passing gate.

Count every failed attempted live action, including 429 responses, transport
errors and unexpected authorization/phase rejections. Also report these classes
separately. Account for dependency-blocked and unsent scheduled actions explicitly;
an incomplete workload cannot pass by reducing the denominator. Skipped quiz
votes after an early reveal are not successful measurements. Do not automatically
retry measured mutations; a failed logical action must remain visible.

| Criterion                    | Rule, applied per action and paired repetition                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live p95 regression          | For V2, V3 and V4 against V1 in the same block: `candidateP95 <= baselineP95 * 1.10` **and** `candidateP95 - baselineP95 <= 50 ms`                                                                                                          |
| Live error budget            | Failed attempted calls / attempted calls `<= 0.005`; require nonempty samples and complete scheduled-work accounting                                                                                                                        |
| Live workload coverage       | For each action, `(failed attempted calls + unsent scheduled calls) / scheduled calls <= 0.005`; classify dependency-blocked calls as unsent and count each logical action once                                                             |
| Absolute vote target         | Successful `vote.submit` p95 `<= 1000 ms`, reported for V0–V4 as an experimental target for this profile                                                                                                                                    |
| Normal analysis availability | In V2, scheduled calls that fall back, fail, are rejected/skipped or remain unfinished / all scheduled calls `<= 0.01`; count each scheduled call once and report the individual outcome classes and response-only fallback rate separately |
| Normal spaCy throttling      | V2 `delta(nr_throttled) / delta(nr_periods) <= 0.05`, only when both readings refer to the same container and the denominator is positive                                                                                                   |
| Normal spaCy memory          | V2 cgroup peak `<= 80%` of the effective 1 GiB limit; distinguish whole-container peak including warm-up from sampled measurement-window maximum                                                                                            |
| OOM events                   | No increase in recorded `oom_kill` events for measured services                                                                                                                                                                             |

The same live budgets test H2; elevated fallback or skipped analysis slots in
V3/V4 are outcomes to explain, not evidence that analysis remained available.
Report V0→V1 regressions with the same limits to identify analysis-path overhead.
If V1 already misses the absolute vote target, do not attribute that pre-existing
failure to spaCy. Require all five complete paired repetitions to meet a rule
before reporting that rule as met; show individual runs and their range rather
than hiding failures in an average. No post-hoc outlier removal is allowed.

These are A1 acceptance rules. The
[capacity document](../capacity-estimate-16gb-16cores.md), section 7, proposes
vote-latency SLOs for 50 active participants and a 15-minute error window; this
500-arrival, five-minute experiment cannot certify those production SLOs.

The existing
[`compare-load-report.mjs`](../../scripts/load/compare-load-report.mjs) selects
the larger tolerance when relative and absolute budgets share one rule. Express
the two p95 conditions as separate rules, or use an explicitly tested evaluator
that requires both. Apply inclusive boundaries as written above; do not inherit a
helper's exclusive comparison accidentally.

Collect container CPU/RAM/PIDs every two seconds, cgroup CPU counters before and
after the interval, memory peaks and OOM events, plus host memory/swap and load.
Record raw units, actual sample cadence, missing samples and collection failures.
Use timestamped counter differences. Keep Docker's
cache-adjusted memory display distinct from cgroup memory values.
Capture selected `health.stats` and authenticated `health.securityStats` fields
before/after and during the run. Existing server histograms have their own
windows/caches; they supplement the client measurements rather than replacing
them. The existing runtime-metrics event-loop sample describes the generator,
not the backend. Backend event-loop instrumentation, if needed, is a separately
declared experiment applied consistently to all compared runs.

## Evidence, invalid runs and rollback

Store sanitized evidence under `evidenz/1A/<variant>/<run>/` with:

- A manifest containing contract/tool/application revisions, approved release
  identity, all service image IDs/digests, actual hardware/OS/Docker/cgroup
  versions, generator placement, fixture identity, effective flags/limits,
  timing, block number and randomization seed/order.
- Live outcome/duration samples, analysis outcomes and schedule accounting,
  resource time series and counter snapshots, selected diagnostic metrics and
  the resulting budget evaluation.
- A sanitized resolved Compose configuration built from an explicit allowlist;
  no full environment, unrestricted `docker inspect`, raw request headers or
  unfiltered logs. Keep tokens, secrets, credentials, IPs and runtime participant
  identities out of committed artifacts. Use pseudonymous run-local labels.

Use instrumented tools with deterministic contract tests first. Then run a small
local pilot to verify setup, corpus eligibility, timings, real spaCy calls,
fallback paths, collection overhead and cleanup. Mark pilot data as such and
exclude it from confirmatory comparisons. Before confirmatory runs, version any
necessary protocol change with its reason; never silently change a threshold or
substitute a more favorable workload after inspecting confirmatory results.

Wrong flags/fixtures, lost outcome data, unplanned container restarts, missing
required resource metrics or unrelated host load make a run incomplete or
invalid. Retain it with the reason and repeat its block under the declared
conditions. Expected V3/V4 degradation and budget failures are valid outcomes,
not reasons to discard a run. Stop unsafe lab resource exhaustion and record the
aborted result. Never replace a failed measurement with invented values.

Rollback restores the recorded baseline: stop generators and the delay proxy,
restore the original socket path and spaCy CPU limit, set `NLP_ENABLED=false`,
recreate the app to apply the environment, and stop spaCy. Verify application,
PostgreSQL and Redis health plus a lexical analysis and one live-action smoke.
Only remove data/containers belonging to this experiment's lab resources.

## Prerequisites and completion boundary

Before confirmatory measurements, resolve and record:

- Examiner/lab-owner approval of the baseline commit, lab hardware and reference
  manifest, including the assignment split where required.
- Lab access, isolated resources, generator placement and available resource
  counters, plus any lab-specific limitations or cost authorization.
- Fixture seed/hash, exact room size/rankings, runner and image identities,
  effective timing and a demonstrated recovery to the baseline.
- Pilot and tool-test results, plus the frozen revision of this contract.

Step 1 is complete when the contract is documented and checked. It does not
approve a release baseline, claim that the later tools exist or report measured
capacity. The resulting decision must state whether to keep smoothing disabled,
allow it under the measured limits, or require a further experiment, with its
operating effort and resource consequence.

Niklas owns the A1 experiment and the shared fixture/live-action tooling supplied
to issues #9 and #10; mark reused contributions and data explicitly. Jonas's lab
provision is shared infrastructure, not Niklas's measurement evidence. The later
handout/slides must disclose AI assistance and identify the individual work.
API timings and status fan-out indicate signal-delivery behavior; they do not
measure browser rendering, teaching quality or the viability of an additional
LLM on the application host.
