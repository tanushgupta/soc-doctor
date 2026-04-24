# soc-doctor

Production-readiness scanner for OpenSearch + Wazuh + Vector SOC stacks.

![soc-doctor demo](./docs/demo.gif)

[![npm](https://img.shields.io/npm/v/soc-doctor.svg)](https://www.npmjs.com/package/soc-doctor)
[![CI](https://github.com/tanushgupta/soc-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/tanushgupta/soc-doctor/actions/workflows/ci.yml)
[![self-test](https://github.com/tanushgupta/soc-doctor/actions/workflows/soc-doctor.yml/badge.svg)](https://github.com/tanushgupta/soc-doctor/actions/workflows/soc-doctor.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

## What it is

A zero-dependency Node CLI + GitHub Action that scans a SOC stack directory — `docker-compose.yml`, `.env`, `configs/opensearch/**`, `configs/ingest/vector/*.toml`, `configs/alertmanager/*.yml` — and flags the misconfigurations that actually break small-to-mid-sized SOC deployments.

Heuristic-first, not AST-perfect. Designed to catch painful mistakes fast, not to replace a linter.

## Who it's for

- SOC engineers running an OpenSearch + Wazuh + Vector stack via `docker compose`
- Platform teams inheriting a half-documented SOC from a previous owner
- MSSPs standardizing hardening across multiple customer deployments
- Anyone about to promote a SOC stack to production

## What it catches

22 opinionated checks across six surfaces. Full list in [`docs/rules.md`](./docs/rules.md); broken-vs-fixed snippets for every one in [`docs/before-after.md`](./docs/before-after.md).

| Surface | Sample checks |
|---|---|
| **Secrets** | weak/shared passwords in `.env`, placeholder webhooks in alertmanager |
| **OpenSearch hardening** | public `network.host: 0.0.0.0`, HTTP TLS off, `allow_default_init_securityindex` left on |
| **OpenSearch audit** | `audit.yml` exists but disabled, missing `enable_rest` / `enable_transport` |
| **OpenSearch RBAC** | non-admin role with `index_patterns: ["*"]`, `cluster_all` granted to multiple roles |
| **Vector ingestion** | `parse_json!()` footgun, sink TLS verify off, `when_full = "block"`, no disk buffer, silent `bulk.action = "index"`, no internal telemetry |
| **Wazuh + resilience** | `read_from = "beginning"` replay risk, no ISM retention, snapshot without restore drill, hardcoded hostnames + UTC timestamp assumptions |

## Quick start

Zero install — run via `npx`:

```bash
npx soc-doctor scan /path/to/your/stack
npx soc-doctor scan /path/to/your/stack --format markdown --output report.md
npx soc-doctor scan /path/to/your/stack --fail-on critical
```

Or clone and try against the fixture stacks:

```bash
git clone https://github.com/tanushgupta/soc-doctor.git
cd soc-doctor
node bin/soc-doctor.js scan ./examples/broken-stack
node bin/soc-doctor.js scan ./examples/healthy-stack
```

Running against a real Docker Compose stack? See [`docs/quickstart-docker-compose.md`](./docs/quickstart-docker-compose.md) for a read-only workflow and CI template.

## Example output

```text
soc-doctor scan for ./examples/broken-stack
Score 0/100 | 42 finding(s) | critical 7, high 22, medium 13, low 0, info 0

1. [CRITICAL] opensearch-http-tls-disabled — HTTP layer TLS is disabled on OpenSearch; API traffic is cleartext.
   file: configs/opensearch/security-config/opensearch.yml
   evidence: plugins.security.ssl.http.enabled: false
   fix: Set plugins.security.ssl.http.enabled: true and issue valid certs.

2. [CRITICAL] opensearch-network-binding — OpenSearch network.host is set to 0.0.0.0, exposing the cluster on all interfaces.
   ...
```

## Use as a GitHub Action

```yaml
jobs:
  soc-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: tanushgupta/soc-doctor@v0.1.0
        with:
          path: .
          fail-on: critical
          output: soc-doctor-report.md
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: soc-doctor-report
          path: soc-doctor-report.md
```

**Inputs:** `path`, `format` (text / markdown / json), `output`, `fail-on` (none / low / medium / high / critical), `node-version`.
**Outputs:** `total`, `critical`, `high`, `medium`, `report-path`.

The action is self-tested on every push against both fixture stacks — see [.github/workflows/soc-doctor.yml](./.github/workflows/soc-doctor.yml).

## Roadmap

**Shipped in v0.1.0**
- 22 opinionated checks
- CLI with text / markdown / JSON output and `--fail-on` threshold
- Composite GitHub Action
- Broken + healthy fixture stacks
- Before/after docs for every check

**Next**
- Full YAML / TOML AST parsing (regex-first → structural)
- `.soc-doctor-ignore` for per-finding suppression
- SARIF output for GitHub code scanning integration
- GitHub Marketplace listing
- Policy profiles (`soc-baseline`, `regulated`, `lab`)
- Native `vector validate` integration

Track real work in [open issues](https://github.com/tanushgupta/soc-doctor/issues) — filtered by [`roadmap`](https://github.com/tanushgupta/soc-doctor/labels/roadmap), [`check idea`](https://github.com/tanushgupta/soc-doctor/labels/check%20idea), and [`good first issue`](https://github.com/tanushgupta/soc-doctor/labels/good%20first%20issue).

## Run the tests

```bash
npm test
```

## Contributing

Found a failure mode that bit you in production? File a [check idea](https://github.com/tanushgupta/soc-doctor/issues/new?labels=check%20idea). New to the repo? The [`good first issue`](https://github.com/tanushgupta/soc-doctor/labels/good%20first%20issue) list is the fastest way in.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, the ground rules (zero runtime deps, heuristic-first, no real secrets in fixtures), and the step-by-step for adding a check. All changes go through pull request with maintainer review + green CI — no direct pushes to `main`.

## License

[MIT](./LICENSE)
