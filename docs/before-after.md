# Before / After

Side-by-side examples of the failure modes `soc-doctor` catches. Every snippet is copied verbatim from the `examples/broken-stack` and `examples/healthy-stack` fixtures; the finding output is what the scanner actually produces today.

For the full list of rules see [`rules.md`](./rules.md).

---

## 1. Secrets (`.env`)

### What breaks in production
A single weak password reused across services. One leak rotates to "re-provision every service." Placeholder webhooks mean alerts are silently swallowed.

### Broken
`examples/broken-stack/.env.example`

```env
OS_ADMIN_PASSWORD=ExamplePass@123
VECTOR_OS_PASSWORD=ExamplePass@123
API_OS_PASSWORD=ExamplePass@123
THEHIVE_ADMIN_PASSWORD=ExamplePass@123
SLACK_WEBHOOK_INFRA=REPLACE_WITH_SLACK_WEBHOOK_URL
```

### What soc-doctor says
```text
[critical] shared-admin-password  .env.example: Weak password detected in OS_ADMIN_PASSWORD.
          evidence: OS_ADMIN_PASSWORD=Ex***23 (15 chars)

[high]    shared-admin-password  .env.example: The same secret is reused across multiple service credentials.
          evidence: Ex***23 reused by OS_ADMIN_PASSWORD, VECTOR_OS_PASSWORD, API_OS_PASSWORD, THEHIVE_ADMIN_PASSWORD

[high]    alerting-placeholders  .env.example: Alerting config still contains placeholder webhook material.
          evidence: REPLACE_WITH_SLACK_WEBHOOK_URL
```

### Fixed
`examples/healthy-stack/.env.example`

```env
OS_ADMIN_PASSWORD=${VAULT_OPENSEARCH_ADMIN}
VECTOR_OS_PASSWORD=${VAULT_VECTOR_OS_PASSWORD}
API_OS_PASSWORD=${VAULT_API_OS_PASSWORD}
THEHIVE_ADMIN_PASSWORD=${VAULT_THEHIVE_ADMIN_PASSWORD}
SLACK_WEBHOOK_INFRA=${VAULT_SLACK_WEBHOOK_INFRA}
```

### Why it works now
Every secret is a reference to a vault variable. Unique per service; nothing literal in git; rotation is a vault concern, not a PR.

---

## 2. OpenSearch network + TLS hardening

### What breaks in production
Cluster binds to `0.0.0.0` on an instance with a public IP, HTTP TLS is off, and `allow_default_init_securityindex` is still on so a restart resets users to defaults. Stacks like this get indexed by Shodan within hours.

### Broken
`examples/broken-stack/configs/opensearch/security-config/opensearch.yml`

```yaml
cluster.name: acme-soc
node.name: opensearch-node1
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
plugins.security.ssl.http.enabled: false
plugins.security.allow_default_init_securityindex: true
```

### What soc-doctor says
```text
[critical] opensearch-network-binding         OpenSearch network.host is set to 0.0.0.0, exposing the cluster on all interfaces.
[critical] opensearch-http-tls-disabled       HTTP layer TLS is disabled on OpenSearch; API traffic is cleartext.
[medium]   opensearch-default-security-init   allow_default_init_securityindex is true, so a restart can reseed the security index to defaults.
```

### Fixed
`examples/healthy-stack/configs/opensearch/security-config/opensearch.yml`

```yaml
cluster.name: acme-soc
node.name: opensearch-node1
network.host: _site_
network.publish_host: _site_
http.port: 9200
plugins.security.ssl.http.enabled: true
plugins.security.audit.type: internal_opensearch
plugins.security.audit.config.index: "acme-audit-%{+YYYY.MM.dd}"
```

### Why it works now
`_site_` binds to the private interface only. HTTP TLS is on, so API traffic is encrypted. Audit settings are present and route into a dedicated index family.

---

## 3. OpenSearch audit logging

### What breaks in production
`audit.yml` exists, review passes, compliance is happy — but every flag is `false`. The plugin runs and emits nothing. Discovered at audit time, months later.

### Broken
`examples/broken-stack/configs/opensearch/security-config/audit.yml`

```yaml
config:
  enabled: false
  audit:
    enable_rest: false
    enable_transport: false
```

### What soc-doctor says
```text
[high]   opensearch-audit-disabled  audit.yml has config.enabled: false so the audit plugin does not run.
[high]   opensearch-audit-disabled  Audit plugin is configured with enable_rest: false.
[high]   opensearch-audit-disabled  Audit plugin is configured with enable_transport: false.
[high]   opensearch-audit-logging   Audit logging exists but TRANSPORT layer logging is not enabled.
[medium] opensearch-audit-logging   Audit logging exists but REST layer logging is not enabled.
```

### Fixed
`examples/healthy-stack/configs/opensearch/security-config/audit.yml`

```yaml
enable_rest: true
enable_transport: true
disabled_rest_categories:
  - AUTHENTICATED
disabled_transport_categories:
  - AUTHENTICATED
ignore_users:
  - kibanaserver
```

### Why it works now
REST + TRANSPORT are on. High-volume categories are excluded explicitly (so the plugin writes less, not nothing). `ignore_users` avoids self-logging noise.

---

## 4. OpenSearch RBAC

### What breaks in production
A non-admin service role gets `index_patterns: ["*"]` for convenience. Months later, one compromised token can read every tenant. And `cluster_all` ends up on more than one role because nobody wants to argue about privileges in the incident channel.

### Broken
`examples/broken-stack/configs/opensearch/security/roles.yml`

```yaml
soc_admin:
  cluster_permissions:
    - "cluster_all"
  index_permissions:
    - index_patterns:
        - "*"
      allowed_actions:
        - "indices_all"

vector_writer:
  cluster_permissions:
    - "cluster_all"
  index_permissions:
    - index_patterns:
        - "*"
      allowed_actions:
        - "crud"
        - "create_index"

api_reader:
  index_permissions:
    - index_patterns:
        - "*"
      allowed_actions:
        - "read"
        - "search"
```

### What soc-doctor says
```text
[high]   tenant-rbac                roles.yml is present but no roles_mapping.yml was found.
[high]   rbac-non-admin-wildcard    Role vector_writer grants access to index pattern "*".
[high]   rbac-non-admin-wildcard    Role api_reader grants access to index pattern "*".
[medium] rbac-cluster-all-sprawl    cluster_all is granted to multiple roles; blast radius widens on any single token compromise.
          Roles with cluster_all: soc_admin, vector_writer
```

### Fixed
`examples/healthy-stack/configs/opensearch/security/roles.yml`

```yaml
soc_vector_writer:
  index_permissions:
    - index_patterns:
        - "acme-suricata-*"
        - "acme-wazuh-*"
      allowed_actions:
        - "crud"

soc_api_reader:
  index_permissions:
    - index_patterns:
        - "acme-audit-*"
      allowed_actions:
        - "read"
```

With `examples/healthy-stack/configs/opensearch/security/roles_mapping.yml`:

```yaml
soc_vector_writer:
  users:
    - soc-vector

soc_api_reader:
  users:
    - soc-api
```

### Why it works now
Each role has the minimum index pattern it needs. `cluster_all` is gone from service roles. Subjects are mapped explicitly in a sibling file, so access grants are reviewable.

---

## 5. Vector ingestion

### What breaks in production
VRL aborts on one malformed record and the whole pipeline dies. Or the sink has `tls.verify_certificate = false` and `healthcheck.enabled = false`, so a compromised or offline OpenSearch silently accepts (or blackholes) events. Or the buffer is set to `block` on a memory queue and one slow downstream freezes ingest all the way to the agent.

### Broken — VRL footguns
`examples/broken-stack/configs/ingest/vector/vector-fortigate.toml`

```toml
[transforms.parse_fortigate]
type = "remap"
inputs = ["fortigate_raw"]
source = '''
.host.name = "ingest-core"
.host.hostname = "ingest-core.acme-dc.example.local"
timestamp_str = string!(.fortigate_date) + "T" + string!(.fortigate_time) + "Z"
parsed_ts, err = parse_timestamp(timestamp_str, "%Y-%m-%dT%H:%M:%SZ")
if err == null {
  .@timestamp = parsed_ts
}
.@timestamp = now()
.bytes_sent = to_int!(.bytes_sent_raw)
.original_message = string!(.message) ?? "<binary>"
'''
```

```text
[high]   vector-dangerous-patterns           string!() ?? fallback is unreachable.
[high]   vector-dangerous-patterns           to_int!() aborts the transform on one bad field.
[medium] vector-dangerous-patterns           .@timestamp = now() overwrites the source timestamp.
[high]   hardcoded-hostnames-and-timezones   .host.name is hardcoded.
[medium] vector-dlq                          no reroute_dropped and no DLQ transform.
```

### Broken — sink hardening
`examples/broken-stack/configs/ingest/vector/vector-wazuh.toml`

```toml
[sinks.opensearch_wazuh]
type = "elasticsearch"
inputs = ["parse_wazuh"]
endpoint = "https://opensearch-node1:9200"
mode = "bulk"
bulk.action = "index"
buffer.when_full = "block"
healthcheck.enabled = false
tls.verify_certificate = false
tls.verify_hostname = false
```

```text
[critical] vector-sink-tls-verify-off            tls.verify_certificate = false on sinks.opensearch_wazuh.
[high]     vector-sink-tls-verify-off            tls.verify_hostname = false on sinks.opensearch_wazuh.
[high]     vector-sink-healthcheck-disabled      healthcheck disabled on sinks.opensearch_wazuh.
[high]     vector-buffer-block-on-ingest         when_full = "block" propagates backpressure to the source.
[medium]   vector-missing-bulk-action            bulk.action = "index" silently overwrites duplicates.
[medium]   vector-no-disk-buffer                 sinks.opensearch_wazuh writes to durable storage without a disk buffer.
```

### Fixed
`examples/healthy-stack/configs/ingest/vector/vector-wazuh.toml`

```toml
[transforms.parse_wazuh]
type = "remap"
inputs = ["wazuh_alerts"]
drop_on_error = true
reroute_dropped = true
source = '''
parsed, err = parse_json(string!(.message))
if err != null {
  abort
}
. = parsed
.wazuh_alert_id = string(.id) ?? uuid_v4()
'''

[transforms.dlq_wazuh]
type = "remap"
inputs = ["parse_wazuh.dropped"]
source = '''
.dlq.pipeline = "wazuh"
.dlq.reason = "parse_failure"
'''

[sinks.opensearch_wazuh]
type = "elasticsearch"
inputs = ["parse_wazuh"]
endpoint = "https://opensearch-node1:9200"
mode = "bulk"
bulk.action = "create"
id_key = "wazuh_alert_id"
buffer.type = "disk"
buffer.max_size = 268435456
buffer.when_full = "drop_newest"
```

Plus `examples/healthy-stack/configs/ingest/vector/vector-internal.toml` for pipeline telemetry:

```toml
[sources.vector_internal_metrics]
type = "internal_metrics"
scrape_interval_secs = 15

[sinks.prometheus_vector_internal]
type = "prometheus_exporter"
inputs = ["vector_internal_metrics"]
address = "0.0.0.0:9599"
```

### Why it works now
Parsing is fallible with `drop_on_error`, bad events get rerouted to a DLQ transform. The sink uses `create` (duplicates surface as 409 instead of overwriting), verified TLS, a disk buffer that drops newest rather than blocking, and a stable `id_key` so re-delivery is idempotent. A separate file exposes Vector's own metrics so you can alert on the pipeline itself.

---

## 6. Wazuh, retention, snapshots, timezones

### What breaks in production
- Wazuh file source with `read_from = "beginning"` and `device_and_inode` fingerprinting replays hours of alerts after one container restart.
- No ISM policy means hot indices grow until the disk fills and ingest halts.
- A snapshot policy exists, but nobody has restored from it, so when you need to you find out the policy skipped your index pattern.
- `@timestamp` is parsed with a hardcoded `Z` suffix on a source that isn't UTC, so incident timelines are off by hours.

### Broken — Wazuh source
`examples/broken-stack/configs/ingest/vector/vector-wazuh.toml`

```toml
[sources.wazuh_alerts]
type = "file"
include = ["/var/ossec/logs/alerts/alerts.json"]
read_from = "beginning"

[sources.wazuh_alerts.fingerprint]
strategy = "device_and_inode"
```

### Broken — snapshot claim without drill
`examples/broken-stack/docs/backup-policy.md`

```markdown
Nightly snapshots are taken at 02:00 UTC into the `acme-snapshots` repository.
Retention is 30 days.
```

No restore evidence anywhere in the repo.

### What soc-doctor says
```text
[high]   wazuh-reingestion-risk     read_from = "beginning", missing id_key.
[high]   ism-retention              no ISM lifecycle config found.
[medium] snapshot-restore-evidence  no file mentioned both snapshot and restore.
[medium] hardcoded-hostnames-and-timezones  timestamp parsing assumes UTC with a hardcoded Z suffix.
```

### Fixed — Wazuh source
`examples/healthy-stack/configs/ingest/vector/vector-wazuh.toml`

```toml
[sources.wazuh_alerts]
type = "file"
include = ["/var/ossec/logs/alerts/alerts.json"]
read_from = "end"

[sources.wazuh_alerts.fingerprint]
strategy = "checksum"
bytes = 512
```

And an idempotency key in the sink: `id_key = "wazuh_alert_id"`.

### Fixed — ISM policy
`examples/healthy-stack/configs/opensearch/ism/logs-lifecycle.json`

```json
{
  "policy": {
    "description": "Hot to delete lifecycle",
    "default_state": "hot",
    "states": [
      { "name": "hot", "actions": [], "transitions": [
        { "state_name": "delete", "conditions": { "min_index_age": "90d" } }
      ]},
      { "name": "delete", "actions": [{ "delete": {} }], "transitions": [] }
    ],
    "ism_template": { "index_patterns": ["acme-*"], "priority": 100 }
  }
}
```

### Fixed — restore drill
`examples/healthy-stack/docs/restore-drill.md`

```markdown
- Snapshot repository: `acme-snapshots`
- Last verified restore: 2026-04-20
- Restored test index: `acme-audit-restore-test`
- Validation: document count matched source snapshot before cleanup
```

### Fixed — timezone-aware Fortigate parser
`examples/healthy-stack/configs/ingest/vector/vector-fortigate.toml`

```toml
tz_offset = get_env_var("FORTIGATE_TZ_OFFSET") ?? "+05:30"
timestamp_str = string!(.fortigate_date) + "T" + string!(.fortigate_time) + tz_offset
parsed_ts, err = parse_timestamp(timestamp_str, "%Y-%m-%dT%H:%M:%S%:z")
```

### Why it works now
`read_from = "end"` plus checksum fingerprinting means container restarts don't replay. An id_key on the sink makes any re-delivery idempotent. The ISM policy expires hot indices. A dated restore drill doc proves the snapshot chain works end-to-end. Timestamps carry a configurable offset rather than a fabricated `Z`.
