# Rules

## 1. shared-admin-password
Flags:
- weak defaults like `ExamplePass@123`
- the same literal secret reused across multiple service credentials

## 2. opensearch-audit-logging
Flags:
- missing `audit.yml`
- missing `enable_rest: true`
- missing `enable_transport: true`
- no audit settings in `opensearch.yml`

## 3. snapshot-restore-evidence
Heuristic check:
- looks for restore drill reports, scripts, or docs
- warns when backup claims are not backed by restore evidence

## 4. ism-retention
Flags:
- no ISM lifecycle config
- no delete phase or retention transition

## 5. vector-dangerous-patterns
Flags:
- `parse_json!()`
- `string!() ?? ...`
- `when_full` under `prometheus_exporter`

## 6. vector-dlq
Flags:
- parser configs that do not show `reroute_dropped = true`
- parser configs without visible DLQ artifacts

## 7. hardcoded-hostnames-and-timezones
Flags:
- `.host.name = "literal"`
- `.host.hostname = "literal"`
- Z-suffix timestamp assumptions in source logs without timezone data

## 8. wazuh-reingestion-risk
Flags:
- `read_from = "beginning"`
- `fingerprint.strategy = "device_and_inode"`
- missing `id_key`

## 9. tenant-rbac
Flags:
- no role files
- wildcard index patterns like `"*"`

## 10. alerting-placeholders
Flags:
- `YOUR_WEBHOOK_URL`
- `REPLACE_WITH_*`
- `<WEBHOOK>`
- similar placeholder material in alerting config
