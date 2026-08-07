# UBM schema snapshot

`bill_management_v2` is IP-restricted and reachable only from the Appsmith server, so it
cannot be queried from this machine — no MCP server, no `psql`, no direct connection of any
kind. A local Postgres MCP server was investigated and ruled out for this reason.

The workaround is a committed snapshot of the schema. You run two queries in the Appsmith
editor once, paste the output into this repo, and column/type/join questions get answered
from the file instead of a round-trip through you.

## Refreshing the snapshot

Both queries collapse their whole result into a **single cell**, because the Appsmith
results panel truncates at roughly 20 rows. Copy the cell, don't try to read the table.

### 1. Columns → `docs/ubm-columns.txt`

```sql
SELECT string_agg(line, E'\n' ORDER BY line) AS schema_dump
FROM (
  SELECT c.table_schema || '.' || c.table_name
         || CASE WHEN t.table_type = 'VIEW' THEN ' [VIEW]' ELSE '' END
         || ' | '
         || string_agg(
              c.column_name || ' ' || c.data_type
              || CASE WHEN c.is_nullable = 'NO' THEN '!' ELSE '' END,
              ', ' ORDER BY c.ordinal_position
            ) AS line
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema
   AND t.table_name   = c.table_name
  WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
  GROUP BY c.table_schema, c.table_name, t.table_type
) s;
```

One line per table: `schema.table | col type, col type!, ...` where a trailing `!` means
`NOT NULL` and `[VIEW]` marks a view rather than a base table.

If the output is too large to copy in one go, narrow it and run it in batches — add before
`GROUP BY`:

```sql
    AND c.table_name LIKE 'bill%'
```

### 2. Foreign keys → `docs/ubm-keys.txt`

Needed because column names alone don't reveal how tables join.

Must read `pg_constraint`, **not** `information_schema`. The `information_schema` views
filter by privilege, so for the read-only role used from Appsmith they return NULL — which
reads as "this database has no foreign keys" when in fact it has 378.

```sql
SELECT string_agg(line, E'\n' ORDER BY line) AS keys_dump
FROM (
  SELECT n.nspname  || '.' || c.relname  || '.' || a.attname
         || ' -> '
         || fn.nspname || '.' || fc.relname || '.' || fa.attname AS line
  FROM pg_constraint co
  JOIN pg_class     c  ON c.oid  = co.conrelid
  JOIN pg_namespace n  ON n.oid  = c.relnamespace
  JOIN pg_class     fc ON fc.oid = co.confrelid
  JOIN pg_namespace fn ON fn.oid = fc.relnamespace
  JOIN unnest(co.conkey)  WITH ORDINALITY AS ck(attnum, ord) ON true
  JOIN unnest(co.confkey) WITH ORDINALITY AS fk(attnum, ord) ON fk.ord = ck.ord
  JOIN pg_attribute a  ON a.attrelid  = c.oid  AND a.attnum  = ck.attnum
  JOIN pg_attribute fa ON fa.attrelid = fc.oid AND fa.attnum = fk.attnum
  WHERE co.contype = 'f'
) s;
```

Pairing `conkey` to `confkey` by ordinality is what keeps composite foreign keys honest —
cross-joining the two arrays would invent column pairs that don't exist.

## What this does and does not settle

It answers "does this column exist", "what type is it", and "how do these tables join" —
which is where the guessing has caused wrong numbers in a finance-facing report.

It does **not** answer anything about *values*: which status strings actually occur, whether
a nullable column is null in practice, row counts. Those still need a query run against
live data, so keep expecting SQL to paste for those.

Note also that the snapshot goes stale silently. If a query starts failing on a column that
this file says exists, suspect the file before suspecting the query, and re-run step 1.

## A format caveat

The `column type` pairs are space-separated, which is ambiguous for any column whose *name*
contains a space. Two relations are affected — `ubm_service_levels` and
`ubm_service_levels2`, whose columns are `Customer Name`, `Customer Tier`, `Service Level`,
`Billable Blocks`, `Total Charges`, `Meter No`, `Avg Accounts per Location`,
`Avg Accounts per Bill`. Readable by eye, but a script splitting on the first space will
mis-parse them. Anything querying those two needs the column names double-quoted.

## Known performance traps

`customers_providers_pretty_name` and `providers_pretty_name` are views, and anything
joining them is slow. The `[VIEW]` marker in `ubm-columns.txt` is there to make that
visible before a query gets written against one.
