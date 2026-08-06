# Read-only MCP access to the UBM database

Lets Claude Code answer schema questions directly (does this column exist, what type is
it, what values does it actually hold) instead of handing you SQL to run and paste back.

Access is read-only, enforced in three independent places, and **no credentials are stored
in this repo** — the connection string lives in an environment variable on your machine.

## 1. Create a read-only role

Run this against the UBM database as a superuser. Pick your own password.

```sql
CREATE ROLE claude_ro LOGIN PASSWORD 'CHANGE-ME';

GRANT CONNECT ON DATABASE ubm TO claude_ro;          -- adjust the database name
GRANT USAGE  ON SCHEMA public TO claude_ro;
GRANT SELECT  ON ALL TABLES IN SCHEMA public TO claude_ro;

-- tables added later are readable too, without re-granting
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO claude_ro;

-- the role itself cannot write, whatever statement it is handed
ALTER ROLE claude_ro SET default_transaction_read_only = on;

-- a runaway query gets killed rather than sitting on the production box
ALTER ROLE claude_ro SET statement_timeout = '30s';
```

If UBM keeps tables in schemas other than `public`, repeat the `USAGE` / `SELECT` /
`ALTER DEFAULT PRIVILEGES` lines for each one. To check:

```sql
SELECT schema_name FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema');
```

## 2. Put the connection string in your shell profile

Add to `~/.zshrc` (not to this repo):

```sh
export UBM_DATABASE_URI='postgresql://claude_ro:CHANGE-ME@HOST:5432/ubm?sslmode=require'
```

Then `source ~/.zshrc` and **restart VS Code** — the extension inherits its environment at
launch, so a running window won't see the new variable.

Drop `?sslmode=require` only if the database is local. For a managed/hosted Postgres,
keep it.

## 3. Verify

```sh
psql "$UBM_DATABASE_URI" -c "select current_user, current_setting('transaction_read_only')"
```

Expect `claude_ro` and `on`. Then confirm the role really cannot write:

```sh
psql "$UBM_DATABASE_URI" -c "create table _should_fail (x int)"
```

Expect `ERROR: cannot execute CREATE TABLE in a read-only transaction`. If that succeeds,
stop and fix the grants before going further.

## How it is wired up

[`.mcp.json`](../.mcp.json) at the repo root registers the server. It holds only
`${UBM_DATABASE_URI}`, never the value, so it is safe to commit.

The server is [Postgres MCP Pro](https://github.com/crystaldba/postgres-mcp), run via
`uvx` (installed with `brew install uv`). It is pinned to `--access-mode=restricted`,
which wraps every statement in a read-only transaction and caps execution time.

Note that the deprecated `@modelcontextprotocol/server-postgres` is deliberately not used:
it was archived in May 2025 with a SQL injection hole that bypasses its own read-only
guard. The read-only role in step 1 is what actually protects the database — the server's
restricted mode is a second layer, not the primary one.

## Layers, in order of what you should trust

1. `claude_ro` holds no write privilege on anything — a database-level guarantee.
2. `default_transaction_read_only = on` rejects writes even if a grant is wrong.
3. `--access-mode=restricted` in the MCP server rejects them before they are sent.

## Scope

This is schema and data *reading* only. It does not touch the Appsmith app definition —
that is already in this repo as `application.json` and `pages/`, editable as files.
