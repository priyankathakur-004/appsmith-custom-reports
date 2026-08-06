# Working in this repo

This repo *is* the Appsmith app, git-synced: `application.json`, `pages/`, `jslibs/`.
Editing those files is how the app changes — there is no separate source tree.

Note this repository is **public**. Keep client names, customer IDs, account volumes and
database dumps out of anything committed.

## Before writing any SQL, read the schema snapshot

`docs/ubm-columns.txt` — every relation and column, `schema.table [VIEW] | column type, ...`
where a trailing `!` means NOT NULL.
`docs/ubm-keys.txt` — all foreign keys as `child.column -> parent.column`.

Read them rather than inferring a column exists. Guessing here has produced wrong numbers in
a finance-facing report more than once.

Both files are **gitignored and local-only** — they are a structural dump of a client
production database and must not be pushed. If they are missing (fresh clone, another
machine), regenerate them with the queries in `docs/UBM-SCHEMA.md`.

The snapshot can go stale silently. If a query fails on a column the file says exists,
distrust the file first and re-dump.

## The database cannot be reached from here

UBM (`bill_management_v2`) is IP-restricted to the Appsmith server. There is no local route
to it — no MCP server, no `psql`, no tunnel. Do not propose one.

So the snapshot answers **structure** only. Anything about **values** — which status strings
occur, whether a nullable column is null in practice, row counts, whether a join multiplies
rows — must be written as SQL for the user to run in Appsmith's query editor.

Two practical notes when writing those queries: the results panel truncates at roughly 20
rows, so wrap list results in `string_agg(... ORDER BY ...)` to get them in one cell; and
responses above ~50KB get cut off mid-line, so batch large dumps with a `WHERE` range.

## Appsmith file format

Query bodies and JS object variables are each stored **twice** — in the entity file and again
in its `metadata.json`. Edit both, or the app runs the old version.

Views are slow to join. `customers_providers_pretty_name` and `providers_pretty_name` are
views; the `[VIEW]` marker in the snapshot flags the rest before you write against one.

Columns whose names contain spaces exist in `ubm_service_levels` / `ubm_service_levels2` and
must be double-quoted in SQL.
