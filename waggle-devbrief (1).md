# Waggle: Developer Brief

Autonomous launch research. A creator submits a token, Waggle returns where it structurally fits: which chain, which venue, which hour window.

Version 1.0, September 2026. Complete brief, written for a team taking this to production.

---

## 0. How to read this

Sections 1 to 3 are the argument. Sections 4 to 11 are the build. Sections 12 to 17 are what keeps it alive once it ships. Section 18 onward is scheduling and sign off.

A working front end prototype exists with sample data wired to the shapes described here. Treat it as the visual and interaction specification, not as production code. Where this document and the prototype disagree, this document wins.

## 1. What the product is

There are too many chains and far too many launchpads for a creator to evaluate by hand, and the comparison that would settle it does not exist in public. Waggle is that comparison, computed continuously and published.

Two surfaces, one engine:

The public dashboards, free and open, showing hour by chain survival, a launchpad comparison table, and coverage. These earn citations and traffic.

The fit report, personalised, built from a submitted description or URL. This is the part that is paid.

**The product is the data pipeline, not the report.** A polished report built on a stale snapshot is worse than nothing, because it carries confidence it has not earned. Engineering effort should follow that sentence.

## 2. Non goals

No price prediction, no trading signals, no portfolio features, no chain of its own, no token. No paid placement of any venue, ever. No adjacent features until launch research is genuinely good, because every addition dilutes the one thing this could be cited for.

## 3. Rules that constrain implementation

These are not brand copy. Each one has a technical consequence.

**Never phrase output as a prediction of success.** Response bodies describe structural fit. No field may be named `score_success`, `win_probability` or anything a client could render as a forecast.

**Never hide the method.** Weights, definitions, thresholds and queries are served by a public endpoint and rendered on a public page. Changing any of them bumps a version and is announced.

**Never accept payment from a venue.** Not for placement, not for a score, not for removal of a score. State this publicly.

**Never present raw volume as demand.** Raw and adjusted always travel together, with the adjustment method linked.

**Never show a figure without its sample size and confidence.** This applies to the API and the UI equally.

**Submissions are confidential.** A creator submitting an unlaunched project is handing over commercially sensitive material. It never appears in public output in any form.

## 4. Architecture

Five parts, deliberately separable, with a queue between collection and computation.

**Collectors.** One adapter per upstream source. Each knows only how to fetch and hand over raw payloads. They fail independently and loudly. They run on a persistent host, never on serverless functions, because they are long lived and rate limited.

**Normaliser.** Converts every payload into the internal shape: chains, venues, launches, trades, outcomes. Nothing downstream ever touches a vendor response directly. When a vendor changes their schema, exactly one file changes.

**Metrics engine.** Computes derived figures on a schedule and writes immutable snapshots. Every snapshot records the window it covers, the sample size, the code version, and which adapters fed it.

**Scorer.** Pure and stateless given a snapshot. Same input plus same snapshot always yields the same report. This is what makes any past recommendation reproducible.

**Web.** Next.js App Router serving both the public pages and the API.

## 5. Stack

Next.js with TypeScript on Vercel for web and API.

Postgres with TimescaleDB, or plain Postgres with time partitioned tables. Versioned migrations from the first commit.

A worker service on Render, Railway or Fly for collectors and scheduled jobs.

Redis with BullMQ for queues and scheduling.

Charts rendered client side for interactivity, plus a server side render path to PNG for social cards, since the launchpad table is the artefact people will share.

## 6. Data sources and the cold start problem

Primary: DefiLlama for chain level volume and TVL, GeckoTerminal for pool and token level data, DexScreener for new pair discovery, Birdeye where Solana depth is needed.

The problem that will consume the most time: **the newest chains are covered last by aggregators, and those are exactly the chains creators are confused about.** Robinhood Chain and Arc may have thin or absent coverage precisely when the product needs them.

So self indexing from RPC is a first class path, not a fallback. Build launch detection generically: watch pool creation events, capture the first hour of trades, follow the token through the survival window. If it works for one chain it works for the next new one, and being first to cover a new chain is the strongest reason for anyone to use Waggle rather than reading DefiLlama.

Chains for v1: Solana, Base, BNB Chain, Robinhood Chain, Arc. Ship with whichever subset has trustworthy data and show the rest as uncovered. A visible gap is credible. A guess presented as coverage is not.

## 7. Metric definitions

Every definition is public, versioned, and frozen between versions. Changing one bumps `metrics_version` and is announced before it takes effect.

**Launch.** A new token with a tradeable pool created at a venue, first seen at block time T.

**Surviving at seven days.** At T plus seven days the token still has at least the liquidity threshold and at least the trade count threshold across the preceding twenty four hours. Both thresholds are named constants, not magic numbers in code.

**Survival rate.** Surviving launches divided by all launches in a cohort. Cohorts are sliced by chain, by venue, and by launch hour.

**Launches per day.** Count of launches per chain and per venue, daily. This is congestion, not quality, and the UI must never colour it as if higher were better.

**Median launch liquidity.** Median pool liquidity in the first ten minutes, per venue.

**First minute extraction.** Share of first minute volume from wallets that buy inside sixty seconds of the first block, sell within thirty minutes, and hold nothing after. Lower is healthier.

**Top five concentration.** Share of chain volume held by its five largest tokens. This is what exposes a chain that looks busy while being one runner and a hundred bots.

**Adjusted volume.** Raw volume minus flow matching wash patterns. Publish both, always, with the adjustment method linked.

**Hourly survival distribution.** Survival rate by launch hour, computed per chain. Never pooled across chains, since the clusters differ and pooling destroys the finding.

## 8. Scoring

### 8.1 Classification

A submission is classified into a category from a fixed, versioned taxonomy. Use a language model with the taxonomy supplied in the prompt and a constrained output format. Store `classifier_version` on every report. An open ended label set makes historical comparison meaningless within a month.

Where classification confidence is weak, say so in the response rather than proceeding silently. The prototype does this by telling the creator to add detail.

### 8.2 Dimensions

Four, each scored zero to one hundred, each explainable to a creator in one sentence.

**Chain fit.** How closely the category mix of surviving launches on that chain matches this token's category, over the trailing window.

**Venue fit.** The token's shape against venue mechanics: curve type, fee structure, graduation threshold, observed first minute extraction, median launch liquidity. A project with no audience and a small treasury needs a different venue from one with a crowd already waiting, so the submission's stated constraints feed this dimension.

**Meta heat.** How crowded the token's category currently is on that chain. Never return a bare number. Return it with a reading, determined by whether survival inside that category is holding or falling: crowded with attention, or crowded with noise, or quiet.

**Hour window.** Best scoring hours from that chain's own hourly distribution, with sample size attached.

### 8.3 Composite and confidence

Weighted sum. Starting weights: chain fit 35, venue fit 30, meta heat 20, hour window 15. Treat these as a hypothesis, not a constant.

**Confidence gating is mandatory.** Each dimension carries its sample size. Below the stated floor the dimension reports low confidence and the report says so in plain language. A low confidence dimension is never quietly averaged into a composite as though it were solid. Most new chains will read low for months, and the product should say that rather than hide it.

Every report stores the `snapshot_id`, `metrics_version`, `weights_version` and `classifier_version` it was built from.

## 9. API

Base path `/v1`. JSON throughout.

`POST /analyse`
Body: `{ "description": string, "url": string|null, "constraints": { "audience": "none"|"small"|"established", "treasury_usd": number|null } }`
Returns: recommended chain, recommended venue, hour window, the four dimension scores with sample sizes and confidence levels, the next two ranked alternatives, the classification with its confidence, and the caveat text. Include `snapshot_id` and all four version fields.

`GET /chains` returns the chain heat table with freshness per row.

`GET /venues?chain=` returns the launchpad comparison matrix.

`GET /hours?chain=` returns the twenty four hour distribution with per hour sample sizes.

`GET /method` returns current weights, metric definitions, thresholds, and all version numbers. This endpoint being public is the credibility strategy in one route.

`GET /health` returns per collector status and the age of the newest snapshot. Expose it publicly. An engine that admits when its data is stale is trusted more than one that never mentions staleness.

Errors are machine readable: a stable `code`, a human `message`, and where relevant the field at fault. Rate limit responses include a retry hint.

## 10. Data model

`chains`, `venues`, `launches`, `trades_first_hour`, `outcomes`, `metrics_snapshots`, `submissions`, `reports`, `classifications`, `eval_runs`.

`metrics_snapshots` is the spine. It stores the computed figure, the window, the sample size, the code version, and the contributing adapters. Immutable. Never updated in place.

`reports` stores the `snapshot_id` used, so any past recommendation can be reproduced exactly. Without this you cannot answer the first serious question anyone asks, which will be why the answer changed.

`submissions` carries a retention policy and is excluded from every analytics view by default rather than by convention.

Time partition `trades_first_hour` and `launches` from the start. They dominate storage.

## 11. Front end

### 11.1 Pages

**Home.** Hero is the working submission box, not a headline. A creator should be able to try the product within ten seconds of arriving, because for a tool like this, being tried is the fastest route to being believed. Below it, the hour by chain matrix as evidence, then the launchpad table, then the method section.

**Method.** Weights, definitions, thresholds, versions, change log, and the conflict of interest policy.

**Coverage.** Which chains are indexed, by which source, with freshness per chain and an explicit list of what is not covered.

**Report permalink.** A stored report, reproducible, showing the versions it was built from.

### 11.2 Components

*Submission box.* Textarea plus example chips. Chips are not decoration. They let someone who does not know what to type see the product work immediately.

*Fit report.* Verdict line with chain, venue and hour window. Four dimension bars, each labelled with its score out of its weight and carrying a confidence marker. A closing caveat that names what the model cannot see. Next best alternatives with their scores.

*Hour matrix.* Rows are chains, columns are twenty four hours. Row labels live inside the same grid as the cells, otherwise labels and rows drift apart. Horizontal scroll with a minimum cell size on narrow screens rather than shrinking cells until they cannot be tapped.

*Colour scale.* Recomputed per metric, never shared between metrics. Warm reads as favourable on every metric, which means the extraction scale is reversed so that low extraction sits at the warm end. Without that flip the worst hours glow the same colour as the best hours on other metrics, which is the most common way a heatmap misleads.

*Empty cells.* Hatched, not flat grey, so missing data cannot be mistaken for a low value. A chain without a collector shows hatched and says so.

*Launchpad table.* Sortable by every column, keyboard operable, with survival last since it is the column that matters most. Horizontal scroll on mobile with a visible hint.

*Freshness.* Every chart carries a visible timestamp. Live updates flash the changed cell rather than redrawing silently.

### 11.3 States

Loading shows skeletons with the layout already in place, not a spinner over a blank page.

Empty explains what is missing and what will fill it.

Errors say what happened and what to do, in the interface voice. A failed collector is surfaced, not hidden.

Stale data is labelled stale rather than served as current. If the newest snapshot is older than the recompute interval, the UI says so at the top of the affected chart.

### 11.4 Quality floor

Responsive to three hundred and sixty pixels. Visible keyboard focus on every interactive element. Reduced motion respected. Colour never the only carrier of meaning, since the whole interface is colour coded and some readers cannot separate the ramp. Text contrast checked against the light background, with any ramp colour used as text darkened at render time rather than used raw.

## 12. Submission handling and security

Fetching a creator supplied URL from your server is a request forgery risk. Resolve and validate the address first, block private ranges, cap redirects, cap response size, and run fetches from an isolated worker.

Text pulled from a creator's page is untrusted input that then reaches a language model. Treat it as data, never as instructions. A page containing a line that tells the classifier to return a particular chain must have no effect. Ship a hostile fixture in CI that asserts exactly this.

Submissions are confidential. Never surface content in public dashboards, never include it in aggregate charts in any identifying form, and publish the retention window. One leaked pre launch idea ends the product, and the leak does not have to be deliberate.

## 13. Evaluation

Without this the scoring model is decoration.

Hold out historical launches. Score them as if submitted at the time, using only data available then. Compare the ranking against what actually happened. Publish the result, including when it is unimpressive.

Re run on every weights change. Refuse to ship a weights change that does not improve the holdout.

State the known limitation openly: survival correlates with things the model cannot observe, above all whether a team already had an audience. Some of what the model appears to capture is really that. Say it on the method page before someone else says it for you.

## 14. Abuse and gaming

Once the table has readers, venues gain an incentive to look good in it, and the cheapest route is manufacturing launches that survive on paper.

Compute survival from liquidity and trade distribution rather than from any single figure a venue controls. Watch for cohorts with unnaturally uniform behaviour. When a venue's numbers move sharply, hold publication and inspect.

Rate limit submissions per address and per source. Expect people to probe the scorer to reverse engineer weights, which is fine since the weights are published. What is not fine is a scraper using `/analyse` as a free data feed.

## 15. Autonomy

Collectors run continuously. Metrics recompute hourly. Snapshots are written with timestamps and versions.

Allowed without a human: ingest, recompute, publish updated dashboards, mark a chain as insufficient data, demote a dimension to low confidence.

Requires a human: changing weights, changing a metric definition, adding or removing a chain or venue, and publishing any post that makes a claim about a named venue.

Drift detection on every recompute. If a metric moves more than a stated threshold between windows, hold publication of that metric and raise an alert. Most large jumps are upstream data faults rather than real market moves, and shipping them unchecked is how a research product loses its reputation in a single afternoon.

## 16. Operations

Staging with its own database, seeded from a snapshot rather than from live collectors.

Alerting on three conditions specifically: a collector failing twice consecutively, a snapshot older than the recompute interval, and drift detection holding a metric. All three route to a person.

Daily backups with a restore tested once before launch rather than assumed.

Secrets in a managed store. Provider keys never in the repository or in the web application environment.

Cost control: cache upstream responses aggressively, respect every provider's rate limits and terms, track spend per source monthly. RPC and data providers are the real recurring cost, and the bill grows with chain coverage rather than with customers, which is unusual and easy to forget when planning.

## 17. Money and legal

Free public dashboards that earn citations. Paid personalised reports, either per report or per call over x402 so that agents can buy them as well as people.

Never accept venue payment. State the policy on the site, not only in this document.

Every report carries a plain line: this describes structural fit from historical data, it is not advice and not a prediction. Have someone qualified review the wording in your jurisdiction, since a tool that recommends where to launch a financial instrument sits closer to regulated territory than a dashboard does.

## 18. Build order

**Week one.** Schema, migrations, one collector, normaliser, `GET /health`. Prove ingestion is stable before computing anything on top of it.

**Week two.** Metrics engine for launches per day and survival on two chains. Publish the chain heat page with no scoring. This alone is a usable product and it starts earning citations.

**Week three.** Launchpad comparison table and hour distribution. Still no personalised scoring. Add the social card render path, since this table is what people will share.

**Week four.** `POST /analyse`, classification, fit report with confidence gating. Ship with low confidence visible everywhere rather than waiting for the data to be good.

**Week five.** RPC self indexing for one uncovered chain. This is the feature that makes Waggle worth using over reading an aggregator.

**Week six.** Evaluation harness, method page, coverage page, report permalinks.

## 19. Definition of done

Every chart carries a visible freshness timestamp. Every score carries a sample size and a confidence level. Every report reproduces exactly from its stored snapshot and version fields. A stale or failed collector appears on the public health endpoint within one recompute cycle. Raw and adjusted volume always appear together. Submissions never appear in public output. The hostile fixture for prompt injection passes in CI. The evaluation harness runs and its result is published. No output anywhere phrases a result as a prediction of success.

## 20. Open questions for the team

Which two chains start first, decided by data quality rather than by interest.

The exact liquidity and trade thresholds that define a surviving launch. This is where the product is most easily attacked, so decide it now, publish it, and freeze it.

Who is on call when a collector breaks, since a silently stale dashboard is the worst failure this product has.

The monthly budget for RPC and data providers.

Whether report permalinks are public by default or private by default. Public helps distribution. Private protects the creator. If in doubt, private, because the confidential default is the one you cannot take back later.
