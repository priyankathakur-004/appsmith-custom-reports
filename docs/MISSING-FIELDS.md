# GL Allocations — Engie columns with no UBM source

The client's Visible Columns list for GL Allocations is 38 entries: the 9 the report
loads plus 29 more offered in the picker. **26 are mapped and offered today.**

Nothing below is guessed at. Each was checked against the schema of every table the
report can reach, read on 2026-08-05.

## Mapped in this pass

Eight columns that previously had no source were found:

| Engie Column | UBM Source | Note |
| --- | --- | --- |
| Vendor Address 1 | `(remittance_address).line_1` | The vendor address is a **composite type** on `providers_vendors` / `customers_providers_vendors`, not flat columns — which is why searching the schema by column name found nothing. Fields: `line_1`…`line_4`, `city`, `state`, `post_code`, `country`. |
| Vendor Address 2 | `(remittance_address).line_2` | Lines 3 and 4 exist and can be added if a vendor uses them. |
| Vendor City | `(remittance_address).city` | |
| Vendor State/Province | `(remittance_address).state` | |
| Vendor Postal Code | `(remittance_address).post_code` | |
| Vendor Country | `(remittance_address).country` | |
| Meter # | `virtual_accounts.meter_serial` | Account grain, so no row multiplication. |
| Clean Account # | *derived* | UBM stores no clean account number. Derived from Account # by removing punctuation — a rule, not a mapping. Say so if the client asks where it comes from. |

All six vendor address fields follow the same priority the vendor name uses: the
customer's own vendor record first, then the global one.

Two more stopped being blank placeholders in the same read:

| Engie Column | UBM Source | Note |
| --- | --- | --- |
| Account Creation Date | *derived* — first month the account was billed | See below. UBM records no account opening date, so this is the closest real signal. |
| Account Status Date | `COALESCE(virtual_accounts_status.account_closed, first billed month)` | There is no single status-date column. The date the current status took effect is the closing date where there is one, the first billed month otherwise. |

## Not in the database

These twelve are absent, not unmapped. They are left out of the picker rather than
shown as permanently empty columns:

| Engie Column | Closest thing in UBM | What we need |
| --- | --- | --- |
| Location Address 2 | `locations.address` and `location_detail.location_address` are both single lines. No second line on either. | Whether Engie ever populates a second line for this customer. If so, UBM needs somewhere to put it. |
| Misc Information | Nothing by that name. `locations.payload` is free-form and may carry it. | What Engie's Misc Information holds, then whether `payload` holds the same thing. |
| Audit Only | No audit flag on `virtual_accounts`. | Which system holds the audit-only flag. |
| Account Address 1 / Address 2 / City / State-Province / Postal Code | `virtual_accounts` has no address columns at all. `analytics_billing_line_items.service_address` exists, but it is bill-line grain — joining it would multiply report rows — and it is the service address, not the account's mailing address. | Whether the account address *is* the service address. If it is, this is buildable the way Late Charges is: aggregated so it can't multiply rows. |
| Service Description / Service Alias / Service Status / Service Point Location | Confirmed absent. There is no services table. `ubm_service_levels`, the only candidate in the schema, is a customer-level billing summary — Customer Tier, Billable Blocks, Avg Accounts per Bill — where "Service Level" is Engie's service tier for the account, not a utility service on a meter. `analytics_billing_line_items.description` is a line-item description, not a service one. | Confirm with Engie which system holds their service records. Nothing in UBM models a service as a thing with a description, alias, status and location. |

## Account Creation Date has no source

Checked against the database on 2026-08-06, for Simon Properties (customer `94512`):

| Candidate | Result |
| --- | --- |
| `virtual_accounts.account_opened` | **Empty.** 0 of 11,377 accounts populated. |
| `virtual_accounts_status.account_opened` | **Empty.** 0 of 11,377 rows. Only `account_closed` carries data, on the 1,588 closed accounts. |
| `virtual_accounts.created_at` | **Populated but wrong.** Its entire range is 2025-12-02 → 2026-06-26 — the window in which UBM loaded this customer. Timestamps cluster seconds apart across unrelated accounts. |

The last one is what the report showed until now, and it is demonstrably not an
account creation date: Engie's own export has accounts activating on 2025-10-30,
which is before UBM's earliest record of any Simon account exists.

What the report shows instead is `MIN(analytics_monthly_feed.time_period)` — the
first month the account was billed. The feed runs 2021-02 → 2026-09 and covers
11,353 of the 11,377 accounts, so it reaches four years further back than the load
window and is a real activation signal rather than an artefact.

It is taken per **account number, site and vendor**, not per `virtual_account_id`.
An account number is not unique in UBM: 3,033 of this customer's codes repeat, one
of them 66 times. The repeats are services, not duplicates — `5328202771` is one
account number the vendor bills for five commodities, and UBM gives each its own
`virtual_account`. Dated per virtual account, one account renders as several rows
differing only by date. Dated per account number, they collapse, and the date means
"when this account was first billed for anything", which is what the client's
column asks for.

It is a derived value, not a mapping. If the client needs the utility's own
account-opening date, UBM does not hold it and Engie would have to supply it.

Two consequences worth stating to the client:

- **Account Activity cannot be filtered to a period of activations** off UBM's own
  dates. Scoped by first-billed month it can.
- **The Activation report's Activity Date was blank for every row it returned.** That
  preset filters to accounts that are not closed, and the column read
  `COALESCE(account_closed, account_opened)` — closed is null for open accounts and
  opened is null for all of them. It now falls back to the first billed month.

## Deactivation cannot be built

Checked 2026-08-06 against all 192 rows of the client's `Deactivation Rpt` tab
(deactivations between 2025-10-01 and 2025-12-29):

| | |
| --- | --- |
| Their rows | 192 |
| Account numbers absent from `virtual_accounts` | 83 (43%) |
| Present but with no `account_closed` | 43 of the 109 present |
| Close dates matching theirs | 0 |
| Average lag where a date exists | 81 days late, range 14–164 |

`virtual_accounts_status.account_closed` records when UBM **processed** a closure,
not when the account closed — 41 of this customer's closures land in a four-day
cluster in December 2025. The lag is not a constant, so it cannot be corrected for.
The feed's last billed month runs the other way, months *before* the deactivation.
Neither field reproduces `FIQ Account Inactive Date` and no combination of them does.

The `Activation` preset is left as it stands rather than pointed at deactivations:
a report that is wrong by an unpredictable 14–164 days is worse than no report.

**The 43% is not a deactivation problem.** Those account numbers are missing from
`virtual_accounts` outright, so they are absent from every report in this app.
Account `2579822` — the client's only Account Activity row for site 0115 — is the
same condition. Row counts cannot reconcile against any Engie export until this is
understood, which makes it the first question for the UBM team.

## The GL columns

Settled on 2026-08-05 against the database, for Simon Properties (customer `94512`):

| Engie Column | Status |
| --- | --- |
| CUSTOMER GL # | **Present.** `GL Code 1` … `GL Code 6` exist as account attributes — 11,210 accounts carry GL Code 1. Our `^gl\s*code` pattern matches them. |
| GL % ALLOCATION | **Present.** `GL Allocation 1 (%)` … `GL Allocation 6 (%)`, 11,199 accounts on the first. Matched by `gl\s*alloc`. |
| GL DESCRIPTION | **Absent.** There is no GL Description attribute at all — the customer's 13 attributes are the twelve GL ones plus `Constellation Acct ID`. This is the only GL column with no source. |

Two things this corrects:

**"Customer GL Code is a first-class field on GET /accounts" is not a column.**
`virtual_accounts` has no GL column of any kind — it is `id, created_at, customer_id,
account_code, meter_serial, commodity, bill_type, client_account, vendor_code,
account_opened, account_closed, frozen_at, frozen_reasoning_id, account_paused,
frozen_comment_id, pair_status, virtual_accounts_pairing_id`. The API field the
client's sheet lists must be the API exposing the attribute. Reading it from
attributes, as we do, is right.

**"This customer has no GL attribute" was wrong.** Ten of the twelve GL columns
resolve. Whatever emptied those columns before, it was not a missing attribute.

The GL columns are offered in the picker rather than loaded, on the client's
instruction of 2026-08-06. `all: true` takes every match, so ticking Customer GL Number
adds GL Code 1-6 and ticking GL % Allocation adds all six percentages — twelve columns
across if both are picked, where Engie's report puts one GL code per row. That is the
unpivot decision, still open. Leaving them unticked also keeps the report's default
query cheap: each attribute column is a correlated subquery.

## Location Detail, Account & Service List, Invoice by Date

Three more presets, built 2026-08-10. Between them they needed one new column and
had to leave out one.

**Location Phone is mapped but empty.** `location_detail.location_phone` exists and
had no field option; there is one now. It returns nothing: **0 of 268 sites** carry a
number, checked 2026-08-11, where the client's own Location Detail has one for most
sites. So it is offered in the picker rather than loaded — a column of blanks on a
report they asked to include phone numbers on reads as data loss. It starts working
by itself if UBM ever loads them.

## Location Detail, checked against the client's tab

Their tab is 124 rows, filtered to Location Status Active and Country in Canada /
United States. Compared against the report's first 100 rows on 2026-08-11:

| Column | Agreed | Note |
| --- | --- | --- |
| Postal Code | 99/99 | Their sheet stores these as numbers, so `07310` is `7310` on both sides. No leading-zero problem. |
| City | 97/99 | The two are Engie's, not ours — `Panama City Beach, FL` and `Garden City,` carry stray text. |
| Location Name | 96/99 | `@` vs `at` twice, one casing difference. |
| Address 1 | 85/99 | See below. |
| State/Province | 0/99 → fixed | UBM stores `US-AK`; the column now reports `AK`. |
| Country | 0/99 → fixed | UBM stores `US`; the column now reports `United States`. |
| Phone | 0/99 | Empty in UBM, as above. |

**Addresses differ because the records differ, not because the report is wrong.** Ten
of the fourteen are UBM appending a disambiguator where sibling sites share a street
— `100 Menlo Park Suite 500 Office`, `4663 River City Dr. #119 Center 1`, `... II`,
`... Village`, `... Owner`, `... Mktplc`. Two are Engie holding more than UBM does (a
P.O. Box line, an alternate street name), one is a spelling difference, one is Engie
truncating to `Buford Dr`. None of it is addressable from here.

**Nine of their sites are absent from ours** within the range compared: three
`!0000-` summary pseudo-sites, and six real ones — OIC Operations, PO Operations
Regional, Sears JV Santa Rosa Plaza, Coconut Point (CC), Lenox Square Corridor, Mall
of Georgia SIXPACK. Same coverage gap as everywhere else in this app.

**One row is ours alone: `5037-Woodfield Mall TRAINING`**, status null, duplicating
site number 5037. It looks like a test record left in UBM and it will show on the
client's report. Worth having deleted rather than filtered around.

**Location Detail's picker is 11 of the client's 14 Visible Columns.** The nine it
loads, plus Location Size (sq ft) and Vendor Name. Three have no column source:

| Engie Column | Status |
| --- | --- |
| Location Address 2 | **Absent**, as recorded below — both address columns are single-line. |
| Misc Information | **Absent**, as recorded below. |
| Location Status Date | **Absent.** No locations table carries one. `location_detail` and `reports_locations_view` both have `location_status` and no date beside it, and there is no `location_status_date` column anywhere in the schema. |

Location attributes were the last place they could have been hiding.
`custom_location_attributes` is a per-customer, per-location store — the
location-side twin of the account attributes the GL columns come from. Checked
2026-08-11: this customer has **exactly one**, `Phase`. None of the three are there.

So all three are absent outright, and the mechanism to reach them is not worth
building. For the record, that mechanism does not exist: the builder can filter on
location attributes (`LocationAttributesSelect`, `getLocationAttributesList`) but
cannot select one as a **column** — `ATTR_PREFIX` and `accountAttrColumn()` handle
account attributes only. Building the location-side equivalent would surface `Phase`
and nothing else.

Ticking Vendor Name also changes the report's grain: without it Location Detail is
one row per site, with it one row per site and vendor.

## Some accounts are on the wrong site

Found 2026-08-11 while reconciling Account & Service List, and worth reading before
anyone treats a row count from this app as a site's account list. The report returns a
Dover DE and a Fox Metro IL account at the Anchorage mall, and a Boca Raton and a
Nashua account at Battlefield Mall in Springfield MO. Two likely causes turned out not
to be the explanation; the third is.

**Not a vendor-name collision.** Of this customer's 378 vendor codes, none maps to
more than one row in `vendors`, so the join cannot attach the wrong name — and the
codes say plainly what they are: `CITYOFBOCARATON`, `DOVERCITY`, `FOXMETROWRD`. The
names the report shows are the right names for those codes.

**Not one account spread across several sites.** All 11,353 of this customer's
accounts map to exactly one `location_id` in the feed; none is at two.

A first pass read the pair below as one account on two sites:

```
0202585-000564182  site=0302-Battlefield Mall           (Springfield, MO)
0202585-000564182  site=4839-Town Center at Boca Raton  (Boca Raton, FL)
```

It is not. That query keyed on `account_code`, which is **not unique** — 3,033 of this
customer's codes repeat, as recorded below. Those are two distinct virtual accounts
that share a code, each correctly attached to one site.

**Individual accounts are on the wrong site.** Listing every account for those four
vendors settles it. Nearly all sit where they should — Boca Raton's at Town Center at
Boca Raton, Fox Metro's at Chicago Premium Outlets, Nashua's at Pheasant Lane Mall,
Dover's at Dover Mall. Seven do not:

| Account | Vendor serves | Sits on | Charges |
| --- | --- | --- | --- |
| `A80-7301` | Aurora IL | Anchorage, AK | 61.95 |
| `110393-35046` | Dover DE | Anchorage, AK | 62.20 |
| `110393-34878` | Dover DE | Chicago Premium Outlets, IL | 167.99 |
| `100027019-70077714` | Nashua NH | Dover Mall, DE | 147.80 |
| `100024439-70065403` | Nashua NH | Arizona Mills, AZ | 1,044.37 |
| `100024448-70032430` | Nashua NH | Battlefield Mall, MO | 1,019.65 |
| `0202585-000564182` | Boca Raton FL | Battlefield Mall, MO | 75.92 |

The sibling numbering is what makes this conclusive. `A80-7300`, `-7302`, `-7303` and
`-7304` are all at Chicago Premium Outlets and only `-7301` is in Anchorage;
`100024445/6/7-70032430` are all at Pheasant Lane Mall and only `100024448` is in
Missouri. Consecutive account numbers from one vendor, all but one on the same site.

They carry real charges, so this misplaces money between sites rather than adding
empty rows. Not fixable in a report: correcting it means knowing which site an
account belongs to, which only the pairing data can say.

**Scale: about 21 accounts, across 13 vendors — 0.18%.** Measured 2026-08-11.

A first cut counted 893 of 11,353 accounts (7.9%) on a site outside their vendor's
main state, but that was an upper bound and almost all of it is legitimate: 872 of the
893 belong to vendors whose own accounts span several states, where being outside the
main one means nothing. Restricting to vendors with 90%+ of their accounts in a single
state — where an outlier cannot be the vendor's own footprint — leaves **21**. The
seven confirmed above are a third of those, which fits, since only four of the
thirteen affected vendors were examined.

So this is real but small. Worth passing to the UBM team to correct, not worth holding
a report back for. The practical caution is narrow: a single site's account list may
gain or lose an account or two, so per-site totals are not exact — it does not put a
portfolio-level figure in doubt.

The two queries, upper bound first:

```sql
WITH acct AS (
  SELECT DISTINCT amf.virtual_account_id, amf.vendor_code, l.state
  FROM bill_management_v2.analytics_monthly_feed amf
  JOIN bill_management_v2.locations l ON l.id = amf.location_id
  WHERE amf.customer_id = <id>
), modal AS (
  SELECT vendor_code, state, count(*) AS n,
         row_number() OVER (PARTITION BY vendor_code ORDER BY count(*) DESC) AS rn
  FROM acct GROUP BY vendor_code, state
)
SELECT count(*) AS accounts, count(*) FILTER (WHERE a.state IS DISTINCT FROM m.state) AS off_main_state
FROM acct a JOIN modal m ON m.vendor_code = a.vendor_code AND m.rn = 1;
```

And the one that separates real strays from multi-state vendors:

```sql
WITH acct AS (
  SELECT DISTINCT amf.virtual_account_id, amf.vendor_code, l.state
  FROM bill_management_v2.analytics_monthly_feed amf
  JOIN bill_management_v2.locations l ON l.id = amf.location_id
  WHERE amf.customer_id = <id>
), per_vendor AS (
  SELECT vendor_code, count(*) AS total, mode() WITHIN GROUP (ORDER BY state) AS main_state
  FROM acct GROUP BY vendor_code
), tally AS (
  SELECT p.vendor_code, p.total, p.main_state,
         count(*) FILTER (WHERE a.state = p.main_state)                AS in_main,
         count(*) FILTER (WHERE a.state IS DISTINCT FROM p.main_state) AS off_main
  FROM per_vendor p JOIN acct a ON a.vendor_code = p.vendor_code
  GROUP BY p.vendor_code, p.total, p.main_state
)
SELECT sum(off_main) FILTER (WHERE in_main::numeric / total >= 0.9) AS strays_from_single_state_vendors,
       sum(off_main) FILTER (WHERE in_main::numeric / total <  0.9) AS from_multistate_vendors,
       count(*)      FILTER (WHERE in_main::numeric / total >= 0.9 AND off_main > 0) AS vendors_affected
FROM tally;
```

## The feed is stale per site, not uniformly

Measured 2026-08-11, and it corrects a working assumption. UBM is not "a few billing
cycles behind" across the board — the lag is per site, and it varies enormously:

| | |
| --- | --- |
| Customer's latest bill date | 2026-08-07 |
| Rows with a March 2026 bill date | 254 |
| Site 0115's latest bill date | **2025-10-16** |
| Site 0115's rows, all time | **76** |

So parts of the feed are current to within days while site 0115 stopped ten months
earlier and holds 76 rows in total. A uniform lag would at least be predictable; this
is not, and nothing on the report tells a reader which kind of site they are looking
at. Any statement of the form "UBM is N months behind" is wrong — it depends which
site is being asked about.

**This is why Invoice by Date could not be reconciled.** The client's tab covers bill
dates in March 2026 at sites `0` and `115`. Site `0` is a summary pseudo-site UBM does
not have, and site 0115 has no 2026 data at all, so the two never overlap however the
report is filtered. Nothing about the report is at fault, and it was verified as far
as the data allows: the bill-date filter was confirmed working on a March 2026 run,
every column resolves, and 29 of the 33 accounts on their site-115 sample exist in UBM.

To verify it properly, the fastest route is to ask Engie to re-export Invoice by Date
for a period UBM actually holds for that site — September or October 2025 — rather
than waiting on a load. Scale of the staleness is not yet measured:

```sql
WITH per_site AS (
  SELECT lt.location_number, max(amf.statement_date) AS latest
  FROM bill_management_v2.analytics_monthly_feed amf
  JOIN bill_management_v2.location_detail lt ON lt.location_id = amf.location_id
  WHERE amf.customer_id = <id>
  GROUP BY lt.location_number
)
SELECT count(*) AS sites,
       count(*) FILTER (WHERE latest >= '2026-06-01') AS current_ish,
       count(*) FILTER (WHERE latest <  '2026-01-01') AS stale_before_2026,
       min(latest) AS oldest, max(latest) AS newest
FROM per_site;
```

## Invoice Detail — 15 of the client's 16 columns

Built 2026-08-13. Their tab carries no Visible Fields list, so the 16 report columns are
the whole specification.

**This is the first preset that does not read the monthly feed.** Invoice Detail is one
row per charge line, not per account-month, so the preset carries `source: "lineItems"`
and the `feed_scoped` CTE reads `analytics_billing_line_items` instead, projected under
the feed's own column names — `charge AS total_charges`, `commodity AS utility_type`,
`usage AS total_consumption` and so on. Every existing location, vendor and account
join then works untouched, and only four new fields are needed.

Fields carrying `source: "lineItems"` are hidden on every other preset, so nothing can
select a line-item column against the feed and produce invalid SQL.

**Informational lines are excluded.** Line items carry a `type` of `C`, `UC` or `U`.
Measured 2026-08-12, every `U` line sums to zero charge and sits in the `Usage
Information` category — they are meter readings, not money. The source filters
`type <> 'U'`, so a cost report does not list zero-cost rows.

**Service Alias is `analytics_billing_line_items.value`.** Despite the column name it
holds text, not a number — the vendor's own label for the charge line as printed on the
bill. Checked against their tab on 2026-08-13: `Gross Revenue Tax`, `Energy`,
`Purchased Power`, `Fuel`, `Regulatory Cost Charge`, `FIW Renewable Energy Adj` and
`Backflow Device Administrative Fee` all appear verbatim in their Service Alias column,
with several more near-matches. **This corrects an earlier note in this file saying
Service Alias had no source.**

**Billed Quantity has no source.** Line items carry exactly two numeric columns,
`usage` and `charge`. `usage` is already the Usage column and `charge` is Cost, so
there is no third quantity for Billed Quantity to read. It was briefly mapped to
`value` before that column turned out to be Service Alias.

**Service Description is UBM's wording, not the vendor's.** The client's tab shows
`Elec Cust Chrg`, `G Cust Chrg`, `Water Surchrg`, `Sewer Cust Chrg`. UBM normalises
every line onto a controlled vocabulary: `Customer Charge (C)`, `General Usage Charge
(C)`, `Tax (C)`. The column is meaningful and consistent, but **the values will not
match their tab**. Worth confirming with the client whether the normalised description
is usable, now that Service Alias beside it does carry the vendor's own words.

Their Service Type column carries `Tax` and `Misc Charges` alongside commodities. UBM
splits those: `commodity` gives the utility, and `category` gives `Taxes`, `Other
Charges` and the rest. The report maps Service Type to commodity and offers Charge
Category beside it.

## Late Fees — the client's 38 Visible Columns

Built 2026-08-12. Their tab is one row per bill that carried a late fee, filtered on
Date Type = Bill Date, with the *previous* bill's details alongside for comparison.

Their Visible Fields list is 38 entries, 13 of them loaded by default. **29 are
offered**, 12 of them loaded — the one missing default being Audit Resolution. Note
their default set starts at LOCATION #, with LOCATION NAME offered but not loaded, so
this report matches that.

Nine have no source: Audit Resolution, Location Address 2, Misc Information, the five
Account address columns and Bill Image — all recorded elsewhere in this file.

**Prev Bill Consolidated Date is reachable after all.** Nothing in the schema is named
`consolidat*`, but bills are batched for payment: `bill_records.batch_id` is a foreign
key to `batches.id`, and a batch carries `created_at`, `uploaded_at` and
`downloaded_at`. The column reads `batches.created_at` for the previous bill's batch.
Checked 2026-08-13: `uploaded_at` is null on every row sampled, and `created_at` and
`downloaded_at` are identical, so `created_at` is the only usable choice and the
distinction between the three does not arise in practice. The gap from receipt to batch
was seven days on the sample, against one to thirteen days on the client's own tab, so
the mapping is plausible. Still worth one eyeball against a bill the client can point
at, since a batch date is not necessarily what they mean by consolidated:

```sql
SELECT string_agg(x, chr(10) ORDER BY x) AS batch_date_candidates FROM (
  SELECT br.id || ' | received=' || COALESCE(br.received_on::text, '-')
      || ' | due='        || COALESCE(br.due_date::date::text, '-')
      || ' | created='    || COALESCE(b.created_at::date::text, '-')
      || ' | uploaded='   || COALESCE(b.uploaded_at::date::text, '-')
      || ' | downloaded=' || COALESCE(b.downloaded_at::date::text, '-') AS x
  FROM bill_management_v2.bill_records br
  JOIN bill_management_v2.batches b ON b.id = br.batch_id
  WHERE br.customer_id = <id> AND br.received_on IS NOT NULL
  LIMIT 15
) s;
```

**Days Until Due: the formula is right, the input is not.** Due date minus receipt date
reproduces **all 59 rows** of their tab exactly, so the calculation is settled.

`received_on` is the problem, and it is not marginal. Measured across the customer on
2026-08-13:

| | |
| --- | --- |
| Bills with both a receipt and a due date | 21,611 |
| Distinct `received_on` values among them | **20** |
| Received *after* they were due | 20,059 — **92.8%** |

Twenty dates for 21,611 bills is about 1,080 bills sharing each one. A sample of 15
shows the shape: all carry `received_on` of 2025-11-25 while their due dates spread
across three weeks, and all were batched on 2025-12-02.

A thousand bills cannot arrive on one day with due dates a month apart. This is an
ingest timestamp from a backfill, the same failure already recorded for
`virtual_accounts.created_at`, and the −520 and −355 cases below are the same thing at
greater distance.

**Two of the client's thirteen default columns rest on it** — Prev Bill Receipt Date
and Days Until Due — plus Receipt Date on Invoice by Date. All three now carry the
figures in their field description, so anyone reading the column in the app sees why it
looks wrong.

The column is left in because it is one of the client's defaults and reads correctly
wherever `received_on` is genuine — the North East Mall row, +6 days, is a real bill
processed live. **It should not be presented as a measure until the UBM team confirms
which bills carry a true receipt date.** The query that produced the figures above:

```sql
SELECT count(*) AS bills_with_both,
       count(*) FILTER (WHERE received_on > due_date)      AS received_after_due,
       count(DISTINCT received_on)                          AS distinct_receipt_dates,
       round(100.0 * count(*) FILTER (WHERE received_on > due_date) / count(*), 1) AS pct_after_due
FROM bill_management_v2.bill_records
WHERE customer_id = <id> AND received_on IS NOT NULL AND due_date IS NOT NULL;
```

A low count of distinct receipt dates against a high bill count is the signature of
bulk loading.

Four extras are offered beyond their list: Late Fee Charged, Late Fee Recouped and the
two percentages. They are decompositions of a column that is on their list, and without
them a fully-recouped fee shows as zero with nothing explaining why.

| Engie Column | UBM Source |
| --- | --- |
| Bill Date | earliest `statement_date` on the bill's feed rows |
| Bill Amount | `SUM(analytics_monthly_feed.total_charges)` across the bill's monthly slices |
| Late Fee Amount | `analytics_billing_line_items` where `code = 'LATEFEE'` and `bill_type = 'live'` |
| Prev Bill Date / Amount | `LAG` over the account's bills in bill-date order |
| Prev Bill Receipt / Due Date | `bill_records.received_on` / `.due_date` for that previous bill |
| Days Until Due | *derived* — due date minus receipt date |

**Days Until Due was worked out rather than guessed.** Their tab shows 21, −6 and 6 on
its first three rows, and prev-due minus prev-receipt reproduces all three exactly. A
negative means the bill arrived after it was already due, which is the usual reason a
fee follows.

**Bill Amount comes from the feed, not from line items.** Line items carry `type` codes
of `C`, `U` and `UC` across categories including `Usage Information`, and which of them
sum to a bill total is not obvious from the schema. The feed is the money source the
rest of this app already trusts, so summing it per bill avoids the question. The late
fee itself is unambiguous — one code, one meaning.

**`bill_type` means two different things in two tables, and neither behaves as the
name suggests.** Checked 2026-08-12.

| Table | Values | What it is |
| --- | --- | --- |
| `analytics_billing_line_items` | `setup`, `historical`, `special`, `live` | Record version |
| `analytics_monthly_feed` | `Distribution Only`, `Full Service`, `Supply Only` | Service arrangement — real, separate bills |

The feed needs no filter, so every preset reading it unfiltered is correct. Its values
also explain the paired rows on deregulated accounts noticed while reconciling Invoice
by Date: 4,671 Supply Only against 4,983 Distribution Only, near-equal because the same
accounts are billed twice, once for the commodity and once for delivery. 38% of the
feed, not duplication, and the Bill Type column tells them apart.

**On line items, `live` is all but empty and filtering to it returns nothing.** For
this customer:

| bill_type | Lines | Late fee lines |
| --- | --- | --- |
| `setup` | ~81,000 | 308, totalling 17,122.64 |
| `historical` | ~4,100 | 1, totalling −3,040.06 |
| `special` | ~250 | 0 |
| `live` | **73** | **0** |

So `live` is not the current version — `setup` carries the data. Two consequences:

- The **Late Charges** field has filtered `bill_type = 'live'` since it was written, so
  it has returned zero on every row of every report. Fixed by counting every bill type.
- The same filter was briefly added to the Late Fees CTE, which would have made that
  report return no rows at all. Removed.

Neither now filters on bill type. The practical double-count risk is small — one
`historical` late-fee line against 308 `setup` ones — but **it is not zero, and the one
historical line is a −3,040.06 reversal**, large against a 17,122.64 total. It lands on
a single bill's row rather than in a total, so it is visible rather than hidden, but
whether reversals should net off or be excluded is a client question. Worth also
checking whether a `bill_id` ever appears under two bill types, which is what would
make a genuine double-count possible:

```sql
SELECT count(*) AS bills, count(*) FILTER (WHERE types > 1) AS bills_with_several_types
FROM (SELECT bill_id, count(DISTINCT bill_type) AS types
      FROM bill_management_v2.analytics_billing_line_items
      WHERE customer_id = <id> GROUP BY bill_id) t;
```

**Late fees follow the main UBM app's convention.** `fetch_late_fees` in
appsmith-ubm-native splits `LATEFEE` lines three ways — charged (positive), recouped
(negative) and net — so this report does the same: Late Fee Amount is the net, with Fee
Charged and Fee Recouped offered separately. That settles the −3,040.06 line: it is a
recoupment, and the house convention shows it rather than netting it away unseen. The
report's filter catches a bill with either, so a fully-recouped fee still appears.

**On `bill_type`, this app deliberately diverges — and the consequence is visible in
the main app.** `fetch_late_fees` filters `bill_type = 'live'`. Run against this
customer it returns bills perfectly well — 25 in a twelve-month window — but
`late_fee`, `recouped_late_fee` and `net_late_fee` come back **0 on every one**,
because none of this customer's `LATEFEE` lines carry that bill type. Its 308 fees, and
the 17,122.64 they total, sit under `setup`.

So the main app's Bill Health → Late Fees tab reports this customer as having no late
fees at all. That is not an empty screen anyone would question; it is a confident zero.
This report leaves the filter off for that reason.

Confirmed on the full result, 2026-08-12: all 25 rows are Constellation ELECTRIC bills
at three sites, with `late_fee`, `recouped_late_fee` and `net_late_fee` zero on every
one. A twelve-month window across a 268-site portfolio returning 25 bills from one
vendor and one commodity points at what `live` means — bills that have been through the
live billing pipeline since this customer went live, where `setup` is the backfilled
history. If that is right, filtering to `live` on a customer part-way through
onboarding shows only the newest trickle, and will keep doing so.

The underlying question belongs with the UBM team: why one customer's line items load
as `setup` while another's load as `live`. Until that is settled, any query filtering
on `bill_type` should be checked against real counts for the customer in hand rather
than trusted from convention.

**`received_on` is meant to be a real date.** The native app's Full Bill page shows it
as "Date Bill Received" beside a separate "Date Loaded" from
`reports_bill_processing_time`, so the two are distinct by design. That makes the
−520 and −355 day values below a data-quality problem rather than a mislabelled column,
and `reports_bill_processing_time.loaded_date` is available if a load date is ever
wanted alongside.

**Reconciled against the client's tab, and the fees match exactly.** Run over their
window (bill dates 2025-12 to 2026-03), every bill UBM holds that also appears on their
Late Fees tab agrees to the cent:

| Their ACCOUNT # | Our Account # | Bill date | Fee |
| --- | --- | --- | --- |
| 15243292 | 204499998-16 | 2026-02-05 | 107.42 |
| 15243297 | 204499998-19 | 2026-02-05 | 12.47 |
| 15243355 | 204499998-25 | 2026-02-05 | 10.61 |
| 15243268 | 204499998-7 | 2026-02-05 | 16.77 |
| 15243355 | 204499998-25 | 2026-02-27 | 17.95 |

This is the first fee-level agreement achieved against any Engie tab. The pairing is
unambiguous — the four fees on 2026-02-05 are all distinct amounts, and 15243355 pairs
with 204499998-25 again on 2026-02-27 at a different amount.

**Their Late Fees tab uses a different account identifier.** `15243292` is not a vendor
account number; ours, `204499998-16`, is the Constellation account as billed. Note this
differs from their Account & Service List tab, where ACCOUNT # *is* the vendor number
and matched ours directly. Anything reconciling against Late Fees has to match on
vendor, date and amount rather than on account number, until someone establishes what
that identifier is.

**What does not match is coverage, not correctness.** In the same window their tab has
seven more fees UBM has no bill for — three more on 2026-02-27 and all four on
2026-03-28 — and thirteen of their fourteen sites produce no rows at all. Their totals
2,677.40 against our 285.03 is entirely that gap, the same per-site staleness recorded
above, not a difference in how the fee is calculated.

**The previous-bill half of the report is empty in practice.** First run, 2026-08-12:
3 rows out of roughly 100 came back with a previous bill. The `LAG` needs two bills for
one account, and UBM holds about one bill per account for this customer — the coverage
gap recorded elsewhere in this file. The columns are correct and will fill in as more
billing history loads; today they are blank on ~97% of rows.

**Where a previous bill does exist, `received_on` looks unreliable.** Of the three:

| Site | Prev receipt | Prev due | Days Until Due |
| --- | --- | --- | --- |
| North East Mall | 2026-02-20 | 2026-02-26 | 6 |
| Cape Cod Mall | 2025-11-25 | 2024-06-23 | **−520** |
| Woodfield Mall TRAINING | 2026-03-11 | 2025-03-21 | **−355** |

Two of the three have the bill received more than a year *after* it was due — the same
signature as `virtual_accounts.created_at`, a load timestamp wearing a business-date
label. Days Until Due is only as good as that column, so it should not go in front of
the client until `received_on` is confirmed to be a real receipt date.

The −3,040.06 reversal that prompted the bill-type question lands on
`5037-Woodfield Mall TRAINING`, the test record already flagged for deletion. That
lowers the concern about it distorting anything real, and is one more reason to have
the record removed.

## Invoice by Date — the client's 70 Visible Columns

Their tab has 69 of the 70 switched on, so it is their everything-on example.
**42 are offered**, checked against the schema on 2026-08-11.

Six were built in this pass:

| Engie Column | UBM Source |
| --- | --- |
| Cost per Day | *derived* — `total_charges / days_of_service`, blank where days is zero |
| Usage per Day | *derived* — `total_consumption / days_of_service` |
| Engie Insight Bill ID | `analytics_monthly_feed.bill_id`, already on the row, no join |
| Vendor Invoice # | `bill_records.invoice_number` |
| Due Date | `bill_records.due_date` |
| Receipt Date | `bill_records.received_on` — nearest equivalent; confirm the client means the same thing |

The last three join `bill_records` on the feed's own `bill_record_id`. That is the
table's primary key, so the join is one-to-one and cannot multiply rows. It is added
only when one of those three columns is picked, the way the GL and bill-level joins
already work, so the default query stays cheap.

**Billed Quantity changes the report's grain.** It is offered because it is on their
list, but it is a bill-level column: picking it makes the feed collapse to one row per
bill, turning a monthly report into a bill one. That is the existing behaviour the DUP
presets rely on, not new, but it will surprise anyone who ticks it here.

**Bill Estimated is buildable and deliberately deferred.** `account_history.estimated`
exists, but reaching it means adding to the bill-level CTE, so it would carry the same
grain change as Billed Quantity for a single flag. Worth doing only if the client asks.

**Twenty-eight have no source.** Beyond the ones already recorded in this file
(Location Address 2, Misc Information, the five Account address columns, Audit Only,
Account Notes, Supplier Only Account, GL Description):

| Engie Column | Finding |
| --- | --- |
| Consolidated Date / Invoice # / Funding Date / Month | **No `consolidat*` column exists anywhere in the schema.** |
| Entry Date, Receipt-adjacent dates | No `entry_date`. `bills.created_at` is the UBM load timestamp, already shown to be meaningless for this customer. |
| Payment Initiated Date, Check #, Payment Clearing Date | `bp_payments` holds `check_number` and `check_cleared_timestamp`, but nothing on it keys back to a bill or virtual account — only `batch_id` and free-text vendor and account ids. Not reachable from a bill row. |
| Audit Exceptions, Open Exceptions | No `exception` column anywhere. |
| Misc/OTC Notes | No notes column, as recorded above. |
| Total Number of Bills, Total Bill Amount | Aggregates, not row values. The builder lists rows; these belong with the grouping work the six unbuilt reports need. |
| Bill Image, Details | No image, scan or document column. `bills.bill_url_hash` and `bills.files` exist and might construct a link, but the URL pattern is not in the schema and would have to come from Engie. |
| Account Country | `virtual_accounts` has no address columns at all, same as the other five. |

**The date filter now runs on bill date, not billing month.** Their tab is filtered on
Date Type = Bill Date, and this is the report that is named after it. Measured against
their 81-row sample, **51 rows — 63% — have a bill month in a different month from
their bill date**: a bill dated 18 March 2026 sitting in billing month February. A
billing-month filter would have missed every one of them and included others their tab
excludes, so the preset sets `dateColumn: "amf.statement_date"`. No other preset moves.

Two things still stop a row-for-row comparison against that tab:

- **Half their sample is on a site UBM does not have.** 41 of the 81 rows are site `0`,
  `!0000-Summary Billing Accounts`, one of the summary pseudo-sites recorded above as
  absent. Only the 40 rows on site 115 are candidates at all.
- **Tax and One Time Charges are excluded on their tab** and the builder has no
  equivalent filter. `total_charges_taxes` exists as a column, but excluding tax means
  netting it off `total_charges` rather than hiding a column, which is a change to what
  Cost means and needs the client to confirm it is what they want.

## Account & Service List — the client's 54 Visible Columns

Their list is 54 entries, four of which appear twice under different casing
(`LOCATION STATUS`/`Location Status`, `VENDOR NAME`/`Vendor Name`, `SERVICE
TYPE`/`Service Type`, `SERVICE STATUS`/`Service Status`), so 50 distinct.
**29 are offered**, checked against the schema on 2026-08-11.

Three were built in this pass:

| Engie Column | UBM Source |
| --- | --- |
| Vendor Address | *derived* — the six remittance address parts joined with commas, blanks skipped. Reads the same as those columns concatenated. |
| Vendor Phone Business | `main_phone`, customer's own vendor record first then the global one — the priority the vendor name and address already use. Needed `main_phone` adding to the `cpv_one` / `pv_one` CTEs. |
| Date of Last Bill | `MAX(analytics_monthly_feed.statement_date)`, per account number / site / vendor — the same grain as Account Created Date, added to the `amf_first` CTE. Statement date is populated on every feed row. |

`Customer Vendor Code` maps to the existing Vendor Code (`analytics_monthly_feed.vendor_code`,
which is also `customers_providers_vendors.code`). The other 25 were already field options.

**Rate Schedule is the one open item.** `account_history.rate_code` exists, but
`account_history` is bill grain and this report is account grain — offering it would
either multiply rows or need an arbitrary pick among an account's bills. It needs a
decision on which of those the client wants, so it is left out rather than guessed at.

**Twenty have no source.** Confirmed absent, not merely unmapped — searched every
relation in the schema for contact, email, notes, meter-status and audit columns:

| Engie Column | Finding |
| --- | --- |
| Service Status, Service Point Location | No services table, as recorded below. |
| Location Contact Name / Title / Phone / Email | **No contact columns exist anywhere in UBM.** The only `email` columns belong to the notification and user tables; the only `vendor_contact` is in a view built for a different customer. |
| Location Notes, Account Notes | No notes column on locations, virtual accounts or their attributes. The schema's only `notes` is on `hubspot_companies`, a CRM table. |
| Location Address 2, Misc Information, Location Status Date | As recorded above. |
| Meter Status | No meter-status column; `virtual_accounts.meter_serial` is the only meter field. |
| Audit Only, Account Address 1 / 2 / City / State / Postal | As recorded below. |
| Supplier Only Account | No such flag. `supplier_code` exists only on two vendor export views, and is a code rather than an account-level flag. |
| Vendor Phone Extension | `main_phone`, `custsvc_phone`, `emergency_phone` and `priority_phone` exist; no extension column beside any of them. |

Neither attribute store can supply these either: this customer's account attributes
are the twelve GL ones plus `Constellation Acct ID`, and its only location attribute
is `Phase`.

**Service Status is left out of Account & Service List.** Same finding as the row
above — there is no services table, so there is no per-service status to read. The
report is built with its other eight columns and the client should be told the column
is missing for want of a source, not hidden. Every other column on all three tabs
maps to an existing field.

**Invoice by Date is monthly-feed grain, not bill grain.** It deliberately does not
take the `bill_history` join the Water / Gas / Electric presets use.

Measured 2026-08-10: the feed holds **2.2 rows per bill** (25,374 rows over 11,545
bills). Splitting an invoice across months is the normal case, not an edge one — a
monthly bill straddles a month end. So before the client compares this to their own
tab:

- One invoice is typically **two rows** here. Service Begin / End are that month's
  slice of the bill, and Cost is the pro-rated share of it, not the invoice total.
- An account billed twice in a month is likewise two rows for the same Bill Month.
- Bill Date is safe to show: `statement_date` is populated on all 25,374 rows.

Their tab carries a Bill Month column of its own, which points to it being monthly
grain too — worth confirming rather than assuming, because if it is one row per
invoice our row count lands at roughly double theirs. That shape is the bill-grain
one the DUP presets already have, and would be a different report rather than a fix
to this one.

## The five summary reports need aggregation, not subtotals

Scoped 2026-08-17 from the client's own tabs. The working description of these five was
"grouping and subtotals" — a grouped report with detail rows and a subtotal line under
each group. **None of them is that shape.** Every one is a flat table of one row per
group, with no detail rows underneath and no subtotal line anywhere:

| Report | One row per | Figures |
| --- | --- | --- |
| Annual Use-Cost | site, service type, unit | usage, cost, cost per unit |
| Use Cost Analysis – Trendline | site, month, service type, unit | usage, cost, cost per unit |
| Index Report – Trendline | site, sq ft, month, service type | cost per sq ft, usage per sq ft |
| Use Cost Analysis – Year over Year | site, service type, unit, calendar month | the same three, pivoted across two years, plus % variance |
| Index Report – Year over Year | site, sq ft, service type, calendar month | the same two, pivoted across two years, plus % variance |

So the feature is `GROUP BY` with `SUM`, and three of the five need nothing beyond it.
The two Year over Year reports need one more thing on top — a pivot that puts each year
in its own column.

**Three are built: Annual Use-Cost, Use Cost Analysis – Trendline, Index Report –
Trendline.** A preset carrying `groupBy: true` groups on every column it shows that is
not a total. Five totals were added — Cost, Usage, Cost per Unit, Cost per SqFt, Usage
per SqFt — and they are the only fields offered on a grouped report, alongside the
existing dimensions. Six things had to change around them, and each is a way the report
could have been quietly wrong rather than broken:

- **The feed must not be deduplicated first.** `feedCte()` normally emits `DISTINCT ON
  (virtual_account_id, …)` when no per-month column is shown. A summary shows no
  per-month column, so without an exception it would have summed one month per account.
  That reads as a plausible number, not an error.
- **Ratios are computed after the sum, not averaged.** Cost per Unit is
  `SUM(charges) / SUM(usage)` — the blended rate. Averaging the per-bill rates would
  weight a $12 bill the same as a $12,000 one.
- **`GROUP BY` is written by ordinal.** Several column expressions are long `CASE`
  blocks; repeating them verbatim in the `GROUP BY` is one transcription slip away from
  a report that regroups on something else and still returns rows.
- **Grid filters on a total go to `HAVING`.** `SUM(...) > 1000` in a `WHERE` is a
  Postgres error, so a user filtering the Cost column would have broken the report.
- **`ORDER BY` falls back to the report's own aliases.** The usual
  `l.id, amf.time_period` fallback names columns that are not grouping keys.
- **Per-bill figures are hidden from the picker.** Ticking Total Charges beside the
  totals would make it a grouping key and split the summary back into the rows the
  totals had just collapsed. Unit of Measure is the exception — it sits in the Usage
  group but is a label, and the reports group on it.

**Unit of Measure is a grouping key on purpose.** Without it a site billed in two units
would have kWh added to Therms under one Usage figure. Whether that ever happens here is
not known and is worth measuring — the query is below.

### What will not reconcile against their tabs, and why

**One Time Charges are excluded on all five of their reports, and ours can exclude them
too.** Every one of the five tabs is run with `One Time Charges = Exclude`. A first pass
recorded this as unanswerable, on the grounds that `total_charges_other` is a charge
bucket rather than a marker. That was wrong, and the correction is the useful part:
**`analytics_monthly_feed.total_charges_other` is exactly the feed's rollup of the
line-item category `Other Charges`**, which is where the one-time fees sit. Measured on
one account, 2026-08-17:

| | charges | other | customer | usage |
| --- | ---: | ---: | ---: | ---: |
| `analytics_monthly_feed` | 20,212.95 | 16,949.091 | 84.48 | 3,179.379 |
| `analytics_billing_line_items` | 20,212.95 | 16,949.09 | 84.48 | 3,179.38 |

So an excluding cost is `SUM(total_charges) - COALESCE(SUM(total_charges_other), 0)` —
feed arithmetic, no line-item join, no grain change, no new CTE.

**It is built as a toggle, not a column**, because that is what Engie's report is: a
filter, not a field. `Exclude one-time charges` sits beside Reset and Run, off by
default, and shows only on the grouped reports where a total exists to net. Ticking it
swaps Cost, Cost per Unit and Cost per SqFt, so the *ratio* is corrected too rather than
a net total sitting over a gross rate. The aliases do not change, so the grid, the sort
model and the export see the same columns either way.

**It nets specific charge codes, not the whole Other Charges category.** A first cut
netted `total_charges_other`, which is wrong, and the run that proved it is worth
keeping: whole service types went to zero — Storm Water at site 1325 from 14,579.99 to
nothing, Fire Protection at 3632 from 3,947.36 to nothing — and several rows went *up*,
0511 Electric by 11,453.66, because credits are booked in the same bucket. Broken down
by code over April 2025 to March 2026, **78.4% of Other Charges is recurring**:

| Code | Description | Charge | Share |
| --- | --- | ---: | ---: |
| `CHG_FACILITYCHARGE` | Facility Charge | 640,065.38 | 41.9% |
| `OTH_RIDERFEE` | Rider Fee | 380,595.57 | 24.9% |
| `OTH_FEE` | Fee | 337,281.27 | 22.1% |
| `OTH_PASSTHROUGH` | Passthrough Charge | 133,456.09 | 8.7% |
| `OTH_METERRENTAL` | Meter Charge | 85,726.33 | 5.6% |
| `LATEFEE` | Late Fee | 12,510.42 | 0.8% |
| `OTH_PENALTY` | Penalty | 491.88 | 0.0% |
| `OTH_CHARGE` | Service Availability | −41,852.34 | −2.7% |
| `OTH_DEPOSIT` | Deposit | −9,897.94 | −0.6% |
| `OTH_ADJUSTMENT` | Adjustment | −9,065.14 | −0.6% |
| `OTH_CORR_CHARGE` | Corrections | −1,553.32 | −0.1% |
| `CHG_CHARGE` | Account Level Charge | −431.69 | −0.0% |
| `OTH_DEPOSITINT` | Deposit Interest | −238.79 | −0.0% |

A facility charge and a rate rider are on every bill. Netting them off is not excluding
one-time charges, it is deleting two thirds of the fixed cost of running a site. So the
toggle nets the six non-recurring codes only, held in `ReportSpecs.ONE_TIME_CODES`:
`OTH_FEE`, `OTH_PENALTY`, `OTH_DEPOSIT`, `OTH_DEPOSITINT`, `OTH_CORR_CHARGE`,
`OTH_ADJUSTMENT` — 21.6% of the category.

Reaching them means leaving the feed after all, since `total_charges_other` is category
grain and the codes are not. Two CTEs do it: `otc_bill` sums the one-time codes per bill
**and commodity**, `otc_rows` counts that bill and commodity's feed rows, and each row
nets its pro-rated share — the shape the `lateCharges` field already uses, because the
feed splits one bill across the months it covers and subtracting the whole bill from each
month would over-net it.

**Per commodity, not per bill, and that distinction is load-bearing.** Pro-rating is only
exact when every one of a bill's feed rows lands in the same report group, and these
reports group by service type. Measured 2026-08-17: of 1,880 bills carrying a one-time
code, **415 — 22% — span more than one commodity**. Keyed per bill alone, a combined
water-and-sewer invoice would net only the share sitting on the rows the group happens to
cover, leaving the row too high by the rest, with no error to show for it. Keyed per bill
and commodity, each service nets its own fees.

Six of the 1,880 span more than one **site**, which the same argument would say to key on
as well. It is left out: 0.3% of bills, against the risk that a line item whose
`location_id` disagrees with the feed's would join to nothing and net nothing at all — a
silent under-net being exactly what this change set out to fix. Worth revisiting if a
per-site figure is ever queried.

**`LATEFEE` is deliberately left in.** It sits in the same category and is arguably a
one-time charge, but this app treats late fees as a first-class thing with their own
report, and netting them out of Cost would put the summary reports at odds with the Late
Fees tab. It is 0.8% of the category. Worth a decision rather than a default.

The question for Engie is now a short list rather than a concept: **which of these
thirteen codes does One Time Charges = Exclude remove?** The six above are this app's
answer, and the two large recurring ones — Facility Charge and Rider Fee — are the ones
that would move the numbers most if they disagree.

Two of their settings do line up and need no work: `Tax = Include` matches, since

Two of their settings do line up and need no work: `Tax = Include` matches, since
`total_charges` includes tax; `Normalization Type = Actual` matches, since the feed is
actual. `Billing Complete = All` means no filter at all.

The rest is the coverage already recorded in this file — the summary pseudo-sites they
report on and UBM does not have, and the per-site staleness. Their Annual Use-Cost
covers April 2025 to March 2026 and their trendlines December 2025 to March 2026, so
site 0115, which stops at 2025-10-16, contributes nothing to any of them.

### The Year over Year pivot, as built

Both YOY reports put a year in each column heading — `2025`, `2026`, `% VARIANCE` — and
column names taken from data are the one thing this builder cannot do: the grid, the
sort model and the export all read a fixed column list from `selectedColumns()`.

The way through is relative naming rather than dynamic columns: **Prior Year**, **This
Year**, **% Variance**, with the year taken from the report's To-month filter and the
figures built as `SUM(...) FILTER (WHERE year = …)`. The column list stays static, so
grid, filter, sort and export need no change at all, and the header can carry the actual
year through the rename mechanism already in the app.

Both are built. Each measure becomes three fixed columns — prior year, this year, and the
percentage change — built as `SUM(...) FILTER (WHERE EXTRACT(YEAR FROM time_period) = …)`.
**The column labels carry the actual years**, so the report reads `Cost 2025 | Cost 2026 |
Cost % Variance` against their `2025 | 2026 | % VARIANCE`. The years are substituted into
both the SQL and the label from `$PRIOR$` / `$THIS$` tokens, the same shape the one-time
exclusion already uses to swap an expression, so the field list stays static and the grid,
sort model and export need no change at all.

**The To Month filter decides which year is which.** Its year is this year and the one
before is the prior year; the window has to span both for a pair to fill in. A window
covering only one leaves the other column blank, which is honest rather than wrong.

**Calendar Month is a new dimension.** These reports compare the same month across years,
so the grouping key is the month without the year. It reports `03 March` rather than
`March`, for the reason `Month` reports `2025-12` rather than `December, 2025`: a bare
month name sorts April before December.

Their reports also carry an explicit Month filter, which this builder has no equivalent
for. Setting From and To a year apart gives every month in between, each comparing its own
two years, with the grid's column filter available to narrow to one. That is more rows
than their tab shows and the same numbers.

One thing left for them: **their rendered Use Cost YOY tab shows two year pairs**
(2024/2025 beside 2025/2026) where its own Visible Fields list shows one, and their Index
YOY tab shows one. The field list is the specification and is what is built. Worth putting
in the same message as the one-time-charges question.

## Annual Use-Cost, reconciled against their tab

Run over April 2025 – March 2026, the window their tab covers, and compared on
2026-08-17. Their tab holds 24 rows — the two `!0000-` pseudo-sites plus 0115, 0145,
0302 and 0344 — so 16 rows are genuinely comparable.

**The report's arithmetic is right. UBM holds about a month of the twelve.**

Cost per unit is the column that proves it, because a rate is not distorted by a short
window:

| Site | Service | Unit | Theirs | Ours | Ours converted |
| --- | --- | --- | ---: | ---: | ---: |
| 0344 | Electric | kWh | 0.0900 | 0.0901 | — |
| 0302 | Electric | kWh | 0.1000 | 0.0978 | — |
| 0145 | Electric | kWh | 0.1200 | 0.1169 | — |
| 0115 | Electric | kWh | 0.1600 | 0.1897 | — |
| 0145 | Water | kGal | 8.1800 | 5.8726 | 7.8511 |
| 0115 | Water | kGal | 7.8300 | 5.6789 | 7.5921 |
| 0344 | Irrigation | kGal | 3.6100 | 2.5965 | 3.4713 |

Volume is short by a factor of eleven and the shortfall is uniform: across all 16 shared
rows theirs totals 3,981,407 against ours 355,850 — **8.9%, about 1.1 months of 12** —
and usage agrees independently (0145 Electric 9.3%, 0302 Electric 8.9%). All four sites
sit at the same ratio, so this is not the per-site staleness recorded above; it is the
one-bill-per-account coverage gap, now measured over a full year rather than inferred
from the Late Fees `LAG` returning nothing.

**The CCF to kGal factor is confirmed, not assumed.** Engie report water, sewer and
irrigation in kGal; UBM stores CCF. A line item on one account reads 461,700 against the
feed's 617.21 CCF for the same account, and 461,700 / 748 = 617.2. So 1 CCF = 748
gallons exactly, which is what makes the converted column above line up.

**One row of sixteen did not fit, and chasing it is what settled the one-time-charge
question.** 0145 Irrigation came back at 74.6% of their annual cost on 18.7% of the
usage — $31.24/kGal against their $5.86. Every other row moved cost and usage together.
Broken down, the site's five irrigation accounts each held a stable rate across both
months but disagreed with each other from $5.84 to $41.34 per CCF, which no utility
prices. One account carried 89% of the cost on 63% of the usage, and its bill was a
single `OTH_FEE` line of 16,926.00 against 3,286.95 of everything else. Excluding
`Other Charges` puts that account at $5.29/CCF, in among its siblings at $5.84, $7.43
and $8.88, and the whole row at $7.96/kGal against their $5.86. The residual is
plausibly seasonal — the two months UBM holds are September and October, peak irrigation
in Texas, against their twelve-month blend.

Two smaller rows have the same shape and are almost certainly the same cause: 0302 and
0145 Natural Gas both carry charges with usage at 0.4% and 0%.

**What differs by design, and needs no work:**

- Fire Protection, Storm Water, Lighting and Refuse appear on ours and not theirs. Their
  Service Types filter names eleven types and excludes all four.
- `Other Services` appears on theirs and not ours — 196,204.78 at 0145, 51.92 at 0344.
  No UBM commodity maps to it.
- Sewer usage is zero on every row of their tab and real on ours. Sewer is billed off
  water consumption and they suppress the quantity.
- Units are UBM's own throughout. See the conversion note above.

## Why nothing reconciles: UBM holds one billing cycle, not twelve

Traced to the bottom on 2026-08-17, and this supersedes every earlier guess in this file
about how far behind UBM is. It is not a lag, not a per-site staleness, and not anything
the reports do. **UBM has received about one bill per account for this customer, and the
reports show it correctly.**

Four measurements, in the order they close the question.

**Every analytics layer agrees, so nothing is being lost downstream.** For April 2025 to
March 2026:

| Source | Bills | Accounts |
| --- | ---: | ---: |
| `analytics_monthly_feed` | 5,799 | 9,121 |
| `analytics_billing_line_items` | 5,799 | 9,121 |
| `account_history` | 5,894 | 9,295 |

**One bill per account, measured not inferred.** Of 9,121 accounts with any bill in the
window, **9,066 have exactly one**; the average is 1.02 and the maximum 11.

**The bills that exist are one month.** Coverage for the four sites that overlap the
client's Annual Use Cost tab:

| Site | Months with data | Bills | Total cost | Share in October 2025 |
| --- | ---: | ---: | ---: | ---: |
| 0145 | 1 | 14 | 203,902 | 100% |
| 0302 | 5 | 27 | 87,665 | 99% |
| 0115 | 2 | 32 | 36,794 | 85% |
| 0344 | 5 | 11 | 40,550 | 14% |

October 2025 is the load. The rest is scraps — 0302's June is one bill worth 17.

**And the processing pipeline is healthy, so the gap is ingestion.** `bill_records` looked
three times larger than the feed, which raised the hope that invoices were stuck before
analytics. They are not: a bill record is not a bill, and 17,195 records resolve to 6,024
bills — 2.85 records each, versions and pages.

| Workflow state | Bill records | Bills | In the feed |
| --- | ---: | ---: | ---: |
| `processed` | 16,561 | 5,799 | **5,799** |
| `data_verification_1` | 589 | 211 | 0 |
| `data_verification_2` | 8 | 5 | 0 |
| `integrity_check` | 37 | 9 | 0 |

**Every processed bill reaches analytics — 5,799 of 5,799.** Only 225 bills, 3.7%, sit in
verification, and releasing all of them would move a total from 9.6% of the client's
figure to about 10%. The eleven missing months were never received.

### What the reports do about it

Rounding is applied at the aggregate: **Cost to two decimal places**, Usage to three
matching the client's own reports, and the three rates to four — enough to keep an
electric rate of 0.0869 distinct from 0.09. Before this, pro-rating a one-time charge
across thirteen feed rows produced a Cost of `80521.12315384616`, which reads as broken
whatever it means.

Four things in the source data are **not** corrected, deliberately, and instead carry
warnings in the field descriptions where a reader meets them:

| What it looks like | Why it is left alone |
| --- | --- |
| 684,016 CCF of water at one mall — 511 million gallons | The reading's scale is wrong at source. Rescaling by 100 or 748 would be a guess dressed as a fix, and this file exists because guesses have produced wrong finance numbers here before. |
| 156,141 of electricity with no kWh at all | The charge is real and the reading is absent. Inventing a denominator would be worse than a blank rate. |
| 369 per CCF of sewer on 7.32 CCF | Correct arithmetic on two autumn months. Suppressing it would hide a real thin-data condition. |
| Water and Sewer carrying identical usage | Sewer is billed off the water meter, so this is how the utility bills. It is a real reading, not a duplicate to be deleted. |

The last one is the trap worth naming, because it is invisible: **usage is not additive
across service types.** On about half this customer's sites Water and Sewer carry the
same reading, so totalling usage counts the same water twice. Engie's own tab blanks
sewer usage entirely, which is the convention that avoids it. This report keeps the
figure — it is real, and blanking it on the sites where the two genuinely differ would
destroy data — and says so on the Usage column instead.

### What this means for the reports

The Annual Use-Cost reconciliation reads 9.6% of the client's annual cost across the
twelve comparable rows, and usage agrees independently. That is the whole discrepancy.
Two things follow:

- **Rates are usable today, totals are not.** A blended rate is not distorted by a short
  window, and electric agrees within 3% at three of four sites. Any annual total is short
  by roughly the same factor everywhere.
- **The two rate outliers are seasonality, not data quality.** 0115 Electric reads 0.1900
  in September and 0.1895 in October — steady, so 0.1897 is the real Anchorage
  shoulder-season rate against a 0.16 twelve-month blend. 0302 Natural Gas holds 13.64
  therms in September and 4.36 in October; a Missouri mall burns no gas in autumn, so the
  bill is nearly all fixed charge and the rate goes to 17/therm against an annual 1.51.
  Both are correct arithmetic on an unrepresentative slice. Neither is worth chasing.

Nothing in this app can close the gap. The question for Engie and the UBM team is why
only one cycle has been received, and it is now specific enough to answer.

## The To Month picker was capped at 31 days

Found 2026-08-17 from a Use Cost Analysis run filtered to December 2025 that returned
December through May. Every row was on or after the From month and none was bounded
above, which is the signature of only one half of the range reaching the SQL.

`EndDate.maxDate` was bound to `moment(StartDate.selectedDate).add(31, 'days')`, so the
To picker would not accept a date more than about a month after the From date. A value
outside that range leaves `selectedDate` empty while the field still shows the typed
text, and `filterClauses()` emits the `>=` bound alone — a half-open range that reads as
a working filter.

The cap dates from the widget's creation, when this app listed a month of invoices at a
time. It has been wrong since the first report that spans a year. **Any earlier run
described as April 2025 to March 2026 was in practice April 2025 onwards**, so it may
have included months after March 2026. For this customer the feed holds almost nothing
outside October 2025, so the reconciliation figures above are unaffected in substance —
but the window they were run over was not the window intended.

`maxDate` is now the same far-future constant `StartDate` uses. `minDate` still tracks
the From date, so To cannot precede From, which is the only constraint worth enforcing.

**And the status line now says when a period is half-open**, because that is what made
this invisible: a report with one bound set reads exactly like a report with two. It now
appends *only From Month is set, so this is every month after it, not a period*.

## Do not copy the main app's Supply Only consumption rule

Checked 2026-08-17 after finding the rule in appsmith-ubm-native. Recorded here because
**our Usage looks wrong beside it and is not**, and the next person to compare the two
apps will reach for the same one-line "fix".

Every usage query in the native app — `fetch_ma_usage`, `fetch_analytics_data`,
`fetch_utility_tree_data`, `RC_LocationUsage`, `fetch_location_metrics`, `fetch_ee_energy`,
across four pages — reads consumption as:

```sql
SUM(CASE WHEN bill_type = 'Supply Only'
         THEN COALESCE(total_gen_consumption, 0)
         ELSE COALESCE(total_consumption, 0) END)
```

This report sums `total_consumption` unconditionally. Measured for this customer:

| bill_type | Rows | With consumption | With gen consumption | Σ consumption | Σ gen consumption |
| --- | ---: | ---: | ---: | ---: | ---: |
| Distribution Only | 4,983 | 4,056 | 32 | 90,601,281 | 6,867 |
| Full Service | 15,720 | 9,370 | 147 | 35,340,940 | 944,992 |
| Supply Only | 4,671 | **1** | 4,009 | 328,889 | **91,422,638** |

**Distribution Only consumption and Supply Only generation consumption are 99.1% of each
other.** They are the same electricity: a deregulated account gets two bills, one from
the supplier for the commodity and one from the utility for delivery, and both state the
same kWh. Adopting the rule would add both together — consumption up 72%, from
126,271,110 to 217,364,859, and Cost per Unit halved on every deregulated account.

What this report does is right. It counts the energy once, through the distribution bill,
while Cost sums the charges on **both** bills. So Cost per Unit is the fully delivered
rate — supply plus delivery over the kWh delivered — which is the number a reader wants.

**And it is confirmed from outside.** Our electric cost per unit agrees with the client's
own figures within 3% at three of four comparable sites. Counting the energy twice would
put us at roughly half their rate; dropping the supply side would put us at double.
Neither is what happens.

Two consequences worth carrying:

- **A Supply Only row carries cost and no usage of its own.** That is harmless while its
  distribution partner sits in the same group, which it does on every preset here, since
  they share location, commodity and month. Grouping by Account # or Bill Type would
  separate them and produce a cost with no denominator.
- **It explains some of the charge-without-usage rows.** Where a site shows electricity
  cost against no kWh at all — 2810 Newport Centre at 156,141 — the distribution half is
  simply not loaded, which is the same one-cycle coverage recorded above rather than a
  new fault.

Whether the native app should sum both is a question for that app, not this one.

## A third of sites carry a floor area of 1

Found 2026-08-17 running Index Report - Trendline. Nine of the twenty-six sites on the
first page hold `locations.square_feet = 1` — Empire Mall, Woodfield TRAINING, University
Park Village, Shops at Clearfork, Beverly Center, both Cherry Creek sites, City Creek
Center and Dolphin Mall — against a real range of 29,140 to 1,251,407 on the other
seventeen. One square foot is not a small building, it is a placeholder.

Dividing by it returns the cost itself, so the report read:

| Site | Month | Service | Cost per SqFt |
| --- | --- | --- | ---: |
| 5600 Beverly Center | 2026-03 | Electric | **292,544.14** |
| 5037 Woodfield TRAINING | 2025-12 | Electric | **233,865.19** |
| 5604 City Creek Center | 2026-03 | Electric | **62,231.94** |

**Cost per SqFt, Usage per SqFt and KBTUs per SqFt now treat an area of 1 or less as no
area**, which is what they already did for zero. The ratio comes back blank rather than
wrong. This is not the same call as the water readings above, which are left alone: there
no correction is possible without guessing a scale factor, whereas here the fix is to
decline to divide by a placeholder, and it fails safe.

**The Square Feet column still shows what UBM holds.** A reader sees `1` beside a blank
ratio and has the reason in front of them, which is better than a blank with no
explanation.

Where the area is real it is right: site 0302 reads 556,872 in this report and 556,872 on
the client's own tab.

Worth measuring across the portfolio before this goes to the UBM team, since the fix
hides the symptom rather than the cause:

```sql
SELECT count(*) AS sites,
       count(*) FILTER (WHERE l.square_feet IS NULL)  AS no_area,
       count(*) FILTER (WHERE l.square_feet = 0)      AS zero,
       count(*) FILTER (WHERE l.square_feet = 1)      AS placeholder_one,
       count(*) FILTER (WHERE l.square_feet > 1)      AS usable,
       min(l.square_feet) FILTER (WHERE l.square_feet > 1) AS smallest_real
FROM bill_management_v2.locations l
WHERE l.id IN (SELECT DISTINCT location_id FROM bill_management_v2.analytics_monthly_feed
               WHERE customer_id = <id>);
```

## Saving Detail cannot be built

Checked against the schema on 2026-08-17. **UBM holds no savings data of any kind.**
Not an unmapped column — nothing. No relation and no column anywhere in the schema
contains `saving`, `avoided`, `recovered`, `waived`, `benefit` or `opportunity`:

```
cut -d'|' -f1 docs/ubm-columns.txt | grep -iE "saving|avoid|recover|waiv|benefit"   → nothing
grep -ioE "[a-z_]*(saving|recovered|waived|avoided)[a-z_]*" docs/ubm-columns.txt    → nothing
```

Their tab makes plain why. Savings Category is `Recovered` / `Preventative`, Savings Type
is `Late Fee Waived` / `Fee Waived` / `Regulated Rate Change`, and Amount is what ENGIE
Impact saved the client by doing something. Engie's own description says as much —
"the savings gained through services provided by ENGIE Impact". It is a record of their
service, not of the bills, and UBM holds the bills.

Six of its eleven columns — location name, number and country, vendor name, account
number, service type — are mapped elsewhere in the app, but there are no savings rows to
hang them on. Five have no source at all: Savings Period, Savings Category, Savings Type,
Service Category, Amount.

This one is not a gap to close. If the client needs it, the data has to come from Engie.

## Account Exceptions – Days to Complete cannot be built either

This was the one of the seven that might have been a row lister and buildable today. It
is a row lister — its Visible Fields are Exception ID, Account Exception Status, Number
of Days, Account #, Location Name, Start Date and End Date, one row per exception — but
the object it lists does not exist in UBM.

**There are no account exceptions in the schema.** One relation carries the word:
`customers_exceptions`, a view whose columns are `items_count, customer_id,
service_address, account_code, pretty_name, vendor_code, service_zip,
virtual_account_id, meter_serial, search, client_account, commodity, bill_type,
provider_vendor_ids, provider_vendors`. That is an account list with a count on it. No
exception id, no type, no status, no start or end date, no approver, no notes — none of
the seven columns the report shows except Account #.

**`bill_errors` is the nearest object and it is a different thing.** It carries
`category, severity, message, validation_check_id, bill_record_id, resolved, created_at`
— a validation error raised against one bill, with a boolean for whether it was dealt
with. Resolution is recorded separately in `resolved_errors`, keyed on `bill_meta_id`
and `validation_check_id` rather than on the error's own id. So it is bill grain where
the report is account grain, it has no exception type to filter on, no status beyond
resolved/not, no approver and no completion date. Days to Complete could be forced out
of `resolved_errors.created_at − bill_errors.created_at`, but it would be days to
resolve a bill validation error, which is not what the column means.

**The client's own report does not run either.** Their tab says so in the first cell:
"There are no sample reports for these, the reports would not run without an Account
Exception Type filter selection, but there were no options to select in the filter."
So Engie's system holds no exception types for this customer, and there is nothing to
reconcile against even if UBM did hold the data.

Two things worth confirming with a query before this is reported as closed — whether
`customers_exceptions` returns anything for this customer, and whether `bill_errors`
does. Both are below.

## Queries for the summary reports

Five, all for this customer. The first three decide whether the built reports read
correctly; the last two close out Account Exceptions.

**1. Does a site and service type ever carry more than one unit of measure?** If it does,
the summary reports split those rows by unit — correct, but it will look like duplication
to anyone reading it, and it is worth being able to say how often it happens.

```sql
WITH per_group AS (
  SELECT amf.location_id, amf.utility_type,
         count(DISTINCT amf.total_consumption_uom) AS units,
         string_agg(DISTINCT amf.total_consumption_uom, ' / ' ORDER BY amf.total_consumption_uom) AS list
  FROM bill_management_v2.analytics_monthly_feed amf
  WHERE amf.customer_id = <id> AND amf.total_consumption_uom IS NOT NULL
  GROUP BY amf.location_id, amf.utility_type
)
SELECT count(*) AS site_service_pairs,
       count(*) FILTER (WHERE units > 1) AS with_several_units,
       string_agg(DISTINCT list, ', ') FILTER (WHERE units > 1) AS which
FROM per_group;
```

**2. How many sites have a floor area?** Both Index reports divide by it, and a site with
no area reports blank on every row. Their own tab has an area for every site shown.

```sql
SELECT count(*) AS sites,
       count(*) FILTER (WHERE l.square_feet IS NOT NULL AND l.square_feet > 0) AS with_area,
       min(l.square_feet) AS smallest, max(l.square_feet) AS largest
FROM bill_management_v2.locations l
WHERE l.id IN (SELECT DISTINCT location_id FROM bill_management_v2.analytics_monthly_feed
               WHERE customer_id = <id>);
```

**3. Is there anything that identifies a one-time charge?** This is the blocking question
above. If a line-item category or code separates them, the totals can be made to match
Engie's; if not, the difference has to be explained to the client instead.

```sql
SELECT string_agg(x, chr(10) ORDER BY x) AS line_item_shape FROM (
  SELECT li.category || ' | ' || li.type || ' | ' || li.code
      || ' | lines=' || count(*)
      || ' | charge=' || round(sum(li.charge), 2) AS x
  FROM bill_management_v2.analytics_billing_line_items li
  WHERE li.customer_id = <id>
  GROUP BY li.category, li.type, li.code
  HAVING count(*) > 50
) s;
```

**4 and 5. Account exceptions — confirm there is nothing there.** Expect zero from the
first; whatever the second returns is bill validation errors, not account exceptions.

```sql
SELECT count(*) AS exception_rows, sum(items_count) AS items
FROM bill_management_v2.customers_exceptions
WHERE customer_id = <id>;
```

```sql
SELECT count(*) AS bill_errors,
       count(*) FILTER (WHERE be.resolved) AS resolved,
       count(DISTINCT be.category) AS categories,
       string_agg(DISTINCT be.category, ', ') AS which
FROM bill_management_v2.bill_errors be
JOIN bill_management_v2.bill_records br ON br.id = be.bill_record_id
WHERE br.customer_id = <id>;
```

## Also found

`location_detail` carries `location_division`, `location_top_group`,
`location_second_group` and `location_third_group`. The catalog says UBM has no
hierarchy fields, on advice from 2026-06-17; that is wrong. No report in the workbook
asks for them, so they are not added — but they are there when one does.
