# Quickstart — Docker Compose stacks

## Who this is for

You already run a SOC stack with `docker compose` (OpenSearch, Wazuh, Vector, Alertmanager). You want to know which production-critical bugs are hiding in the configs **before** you hit them at 2am.

`soc-doctor` is a zero-dependency CLI that scans the stack directory — your compose file, the `configs/` tree, `.env` — and prints findings grouped by severity.

## Scan without installing anything

Because the scanner is pure Node with no native deps, you can run it against your stack directory in one shot:

```bash
# Interim — until the package is published to npm:
git clone https://github.com/tanushgupta/soc-doctor.git /tmp/soc-doctor
node /tmp/soc-doctor/bin/soc-doctor.js scan /path/to/your/compose-stack
```

Once the npm package lands, the same thing will be:

```bash
docker run --rm -v "$PWD:/stack:ro" node:20-alpine \
  npx --yes soc-doctor scan /stack
```

The scan is read-only — it never writes to your stack directory, never talks to OpenSearch, and never sends anything over the network.

## Layout the scanner expects

The scanner recurses from the target directory and looks for these paths (or anything matching by name):

```text
your-stack/
├── docker-compose.yml
├── .env                              # checked for weak/shared passwords
└── configs/
    ├── opensearch/
    │   ├── security-config/
    │   │   ├── opensearch.yml        # network.host, TLS, audit settings
    │   │   └── audit.yml             # enable_rest / enable_transport
    │   ├── security/
    │   │   ├── roles.yml             # wildcard patterns, cluster_all sprawl
    │   │   └── roles_mapping.yml     # subject→role assignment
    │   └── ism/
    │       └── *.json                # lifecycle / retention policy
    ├── ingest/
    │   └── vector/
    │       ├── vector-wazuh.toml     # sources, parsers, sinks, buffers
    │       ├── vector-suricata.toml
    │       └── vector-fortigate.toml
    └── alertmanager/
        └── alertmanager.yml          # placeholder webhooks
```

You don't have to match this layout exactly — the checks use content heuristics, not path matching. See [`examples/broken-stack/`](../examples/broken-stack/) and [`examples/healthy-stack/`](../examples/healthy-stack/) for the canonical shape.

## Step-by-step against a real stack

```bash
# 1. Run the scan, terminal output
node /tmp/soc-doctor/bin/soc-doctor.js scan /path/to/your/compose-stack

# 2. Save a Markdown report to share or commit
node /tmp/soc-doctor/bin/soc-doctor.js scan /path/to/your/compose-stack \
  --format markdown --output soc-doctor-report.md

# 3. Pipe JSON into jq for custom triage
node /tmp/soc-doctor/bin/soc-doctor.js scan /path/to/your/compose-stack --format json \
  | jq '.findings[] | select(.severity == "critical")'
```

**Triage order:** always clear `critical` findings first (weak secrets, cluster exposed on `0.0.0.0`, HTTP TLS off, sink TLS verify off). Then `high` (audit disabled, RBAC wildcards, Vector parse-abort footguns). `medium` last (bulk.action, disk buffer, retention).

For a concrete walk-through of each failure mode with broken + fixed snippets, see [`before-after.md`](./before-after.md).

## CI pattern for a compose stack

Drop this into `.github/workflows/soc-doctor.yml` in **your stack repo** (not this repo — this is consumer-side):

```yaml
name: soc-doctor

on:
  push:
    branches: [main]
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkout soc-doctor
        uses: actions/checkout@v4
        with:
          repository: tanushgupta/soc-doctor
          path: .soc-doctor
          ref: main

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Scan stack
        run: node .soc-doctor/bin/soc-doctor.js scan . --format markdown --output soc-doctor-report.md

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: soc-doctor-report
          path: soc-doctor-report.md

      - name: Fail on critical findings
        run: |
          if node .soc-doctor/bin/soc-doctor.js scan . --format json \
             | jq -e '.summary.counts.critical > 0' > /dev/null; then
            echo "critical findings present"
            exit 1
          fi
```

A first-class composite GitHub Action (`uses: tanushgupta/soc-doctor@v0`) is on the roadmap — see the next commit.

## Known limits

- The scanner is **heuristic-first**, not AST-perfect. It reads file content and applies regex / structural rules. That means some valid but unusual config shapes may not be picked up, and some style-only findings will fire on configs that are actually fine in context.
- There is **no ignore file yet.** Per-finding suppression (a `.soc-doctor-ignore` with check IDs and file globs) is on the roadmap. For now, triage in the report rather than silencing at scan time.
- The scanner never connects to a running cluster — it only reads files. Runtime checks (live audit log presence, snapshot repo reachability, actual ingest rate) are a separate future feature.
