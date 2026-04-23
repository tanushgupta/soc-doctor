# soc-doctor

Production-readiness scanner for OpenSearch + Wazuh + Vector SOC stacks.

This is a **week-one starter repo** built to prove the shape of the product fast:
- zero-dependency Node CLI
- 10 opinionated checks
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

## Current checks

1. `shared-admin-password`
2. `opensearch-audit-logging`
3. `snapshot-restore-evidence`
4. `ism-retention`
5. `vector-dangerous-patterns`
6. `vector-dlq`
7. `hardcoded-hostnames-and-timezones`
8. `wazuh-reingestion-risk`
9. `tenant-rbac`
10. `alerting-placeholders`

See [`docs/rules.md`](./docs/rules.md) for details.

## Example output

```text
soc-doctor scan for ./examples/broken-stack
Score 0/100 | 22 finding(s) | critical 4, high 13, medium 5, low 0, info 0
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
