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

## Late Fees — 12 of the client's 14 columns

Built 2026-08-12. Their tab is one row per bill that carried a late fee, filtered on
Date Type = Bill Date, with the *previous* bill's details alongside for comparison.

| Engie Column | UBM Source |
| --- | --- |
| Bill Date | earliest `statement_date` on the bill's feed rows |
| Bill Amount | `SUM(analytics_monthly_feed.total_charges)` across the bill's monthly slices |
| Late Fee Amount | `analytics_billing_line_items` where `code = 'LATEFEE'` |
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

**Two have no source.** `AUDIT RESOLUTION` (`Customer Pays Late Fee` / `ENGIE Insight
Pays Late Fee`) is Engie workflow data — no audit or resolution column exists anywhere
in the schema. `PREV BILL CONSOLIDATED DATE` is the same `consolidat*` gap recorded
elsewhere in this file.

This preset introduced three mechanics, all opt-in and used by nothing else: a `grain`
override so the feed collapses to one row per bill, a preset-level `where` so the
report shows only bills that carried a fee, and a conditional join to the `lf_seq`
window CTE.

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

## Also found

`location_detail` carries `location_division`, `location_top_group`,
`location_second_group` and `location_third_group`. The catalog says UBM has no
hierarchy fields, on advice from 2026-06-17; that is wrong. No report in the workbook
asks for them, so they are not added — but they are there when one does.
