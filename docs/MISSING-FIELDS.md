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

What the report shows instead is `MIN(analytics_monthly_feed.time_period)` per
account — the first month the account was billed. The feed runs 2021-02 → 2026-09
and covers 11,353 of the 11,377 accounts, so it reaches four years further back
than the load window and is a real activation signal rather than an artefact.

It is a derived value, not a mapping. If the client needs the utility's own
account-opening date, UBM does not hold it and Engie would have to supply it.

Two consequences worth stating to the client:

- **Account Activity cannot be filtered to a period of activations** off UBM's own
  dates. Scoped by first-billed month it can.
- **The Activation report's Activity Date was blank for every row it returned.** That
  preset filters to accounts that are not closed, and the column read
  `COALESCE(account_closed, account_opened)` — closed is null for open accounts and
  opened is null for all of them. It now falls back to the first billed month.

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

## Also found

`location_detail` carries `location_division`, `location_top_group`,
`location_second_group` and `location_third_group`. The catalog says UBM has no
hierarchy fields, on advice from 2026-06-17; that is wrong. No report in the workbook
asks for them, so they are not added — but they are there when one does.
