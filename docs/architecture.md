# Architecture & API Contract

## Overview

```
[OpenSearch Cluster]
        │  (read-only queries)
        ▼
[Agent binary — runs on user's server]
        │  HTTPS POST + Bearer token
        ▼
[SaaS API — Next.js API routes]
        │
        ├── PostgreSQL (persistent storage)
        └── Analysis Engine (TypeScript rules)
                │
                ▼
        [Dashboard — Next.js frontend]
```

**Key principle:** Cluster credentials never leave the user's machine. The agent only sends collected metrics/stats (not credentials) to the SaaS API.

---

## Agent → SaaS API Contract

All agent requests use:
```
Authorization: Bearer osd_<random_key>
Content-Type: application/json
```

### POST /api/agent/register
Register or re-identify a cluster. Called on agent startup.

**Request:**
```json
{
  "clusterName": "My Prod Cluster",
  "endpoint": "https://my-cluster:9200",
  "environment": "PRODUCTION",
  "osVersion": "2.11.0",
  "agentVersion": "0.1.0"
}
```
**Response:**
```json
{ "clusterId": "clx..." }
```

---

### POST /api/agent/heartbeat
Update last-seen timestamp. Called every 5 minutes.

**Request:**
```json
{ "clusterId": "clx...", "agentVersion": "0.1.0" }
```
**Response:**
```json
{ "ok": true }
```

---

### POST /api/agent/diagnostics
Submit collected diagnostic data. Called after each diagnostic run.

**Request:**
```json
{
  "clusterId": "clx...",
  "agentVersion": "0.1.0",
  "osVersion": "2.11.0",
  "durationMs": 1234,
  "data": {
    "clusterHealth": {
      "status": "green",
      "numberOfNodes": 3,
      "numberOfDataNodes": 3,
      "activeShards": 120,
      "unassignedShards": 0,
      "pendingTasks": 0
    },
    "nodes": {
      "nodes": [
        {
          "id": "nodeId1",
          "name": "node-1",
          "roles": ["data", "master"],
          "heapUsedPercent": 62.4,
          "cpuPercent": 15.0,
          "diskUsedPercent": 45.0,
          "diskTotalBytes": 500000000000,
          "diskAvailableBytes": 275000000000,
          "uptimeMs": 8640000,
          "osMemUsedPercent": 55.0
        }
      ]
    },
    "shards": {
      "unassignedCount": 0,
      "unassignedReasons": {},
      "shardCountPerNode": { "nodeId1": 40 },
      "avgShardSizeBytes": 5368709120
    }
  }
}
```
**Response:**
```json
{ "sessionId": "ses...", "healthScore": 90 }
```

---

## Health Score Formula

```
score = 100
      - (critical_findings × 15)
      - (warning_findings  × 5)
clamped to [0, 100]
```

| Score | Color | Label |
|---|---|---|
| 90–100 | Green | Healthy |
| 70–89 | Yellow | Degraded |
| 50–69 | Orange | At Risk |
| 0–49 | Red | Critical |

---

## Database Models Summary

See `web/prisma/schema.prisma` for full schema.

| Table | Purpose |
|---|---|
| `users` | User accounts (OAuth + email/password) |
| `accounts` | OAuth provider accounts (NextAuth) |
| `sessions` | User sessions (NextAuth) |
| `subscriptions` | Stripe subscription state |
| `teams` | Pro: team workspaces |
| `team_members` | Pro: team membership + roles |
| `clusters` | Registered OpenSearch clusters |
| `agent_keys` | API keys for agent authentication |
| `api_keys` | Pro: API keys for programmatic access |
| `diagnostic_sessions` | Each diagnostic run + raw data + health score |
| `findings` | Individual findings per session |
| `metric_snapshots` | Time-series metric data for charts |
| `alert_rules` | Per-cluster alert configuration |
| `alert_events` | Alert firing/resolution history |
| `notification_channels` | Email/Slack/webhook configs |
| `reports` | Pro: generated PDF reports |

---

## Check Categories & Phase Availability

| Category | Phase 1 | Phase 2 |
|---|---|---|
| CLUSTER_HEALTH | ✅ | ✅ |
| NODES | ✅ | ✅ |
| SHARDS | ✅ | ✅ |
| INDICES | – | ✅ |
| PERFORMANCE | – | ✅ |
| SNAPSHOTS | – | ✅ |
| ISM_POLICIES | – | ✅ |
| SECURITY | – | ✅ |
| PLUGINS | – | ✅ |
| INGEST_PIPELINES | – | ✅ |
| TEMPLATES | – | ✅ |

---

## Metric Keys (stored in metric_snapshots)

| metricKey | Unit | nodeId? |
|---|---|---|
| `health_score` | 0–100 | no |
| `heap_percent` | % | yes |
| `cpu_percent` | % | yes |
| `disk_percent` | % | yes |
| `unassigned_shards` | count | no |
| `indexing_rate` | docs/sec | no |
| `search_rate` | req/sec | no |
| `search_latency_ms` | ms | no |
