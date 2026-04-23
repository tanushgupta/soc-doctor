# soc-doctor

Production-readiness scanner for OpenSearch + Wazuh + Vector SOC stacks.

This is a **week-one starter repo** built to prove the shape of the product fast:
- zero-dependency Node CLI
- 22 opinionated checks across secrets, OpenSearch hardening, RBAC, Vector ingestion, Wazuh, and resilience
- broken vs healthy fixtures
- tests
- CI
- Markdown / JSON / terminal output

It is intentionally **heuristic-first**, not AST-perfect yet. The goal of v0.1.0 is to catch the painful mistakes that actually break small and mid-sized SOC deployments.

## Why this exists

Most SOC stack pain is not “I need another SIEM.”
It is:
- shared passwords across services
- Vector configs that pass review but crash at runtime
- no DLQ for parse failures
- audit logging gaps
- wildcard RBAC
- replay risk on Wazuh ingestion
- fake backup confidence
- placeholder alerting secrets

`soc-doctor` is the operator-side scanner for those problems.

## Quick start

```bash
git clone <your-repo-url>
cd soc-doctor

node ./bin/soc-doctor.js scan ./examples/broken-stack
node ./bin/soc-doctor.js scan ./examples/healthy-stack
node ./bin/soc-doctor.js scan ./examples/broken-stack --format json
node ./bin/soc-doctor.js scan ./examples/broken-stack --format markdown --output report.md
```

When you publish the package, the intended UX is:

```bash
npx soc-doctor scan .
```

Running against an existing Docker Compose SOC stack? See [`docs/quickstart-docker-compose.md`](./docs/quickstart-docker-compose.md) for a read-only scan walk-through and a copy-paste CI workflow.

## Current checks

**Secrets**
- `shared-admin-password`, `alerting-placeholders`

**OpenSearch hardening**
- `opensearch-network-binding`, `opensearch-http-tls-disabled`, `opensearch-default-security-init`

**OpenSearch audit**
- `opensearch-audit-logging`, `opensearch-audit-disabled`

**OpenSearch RBAC**
- `tenant-rbac`, `rbac-non-admin-wildcard`, `rbac-cluster-all-sprawl`

**Vector ingestion**
- `vector-dangerous-patterns`, `vector-dlq`, `vector-sink-healthcheck-disabled`, `vector-sink-tls-verify-off`, `vector-buffer-block-on-ingest`, `vector-no-disk-buffer`, `vector-missing-bulk-action`, `vector-internal-logs-missing`

**Wazuh + resilience**
- `wazuh-reingestion-risk`, `ism-retention`, `snapshot-restore-evidence`, `hardcoded-hostnames-and-timezones`

See [`docs/rules.md`](./docs/rules.md) for what each rule flags, and [`docs/before-after.md`](./docs/before-after.md) for side-by-side broken vs fixed snippets.

## Example output

```text
soc-doctor scan for ./examples/broken-stack
Score 0/100 | 42 finding(s) | critical 7, high 22, medium 13, low 0, info 0
```

## Repo layout

```text
bin/
src/
  checks/
  lib/
docs/
examples/
  broken-stack/
  healthy-stack/
test/
.github/workflows/
```

## Week-one scope that is already done

- CLI scaffold
- report model
- 10 initial checks
- two fixture stacks
- tests for broken + healthy fixtures
- CI workflow

## What is deliberately not done yet

These are **week two and beyond**:
- full YAML / TOML AST parsing
- native `vector validate` integration
- SARIF output
- GitHub Action marketplace packaging
- policy profiles (`soc-baseline`, `regulated`, `lab`)
- auto-remediation suggestions with patches
- OpenSearch query-based runtime validation

## Publish plan

Recommended repo name:
- `soc-doctor`

Recommended npm target:
- `soc-doctor`
- fallback if taken: `@tanushgupta/soc-doctor`

## Run tests

```bash
npm test
```

## License

MIT
