# Snowflake.io v4.0

![npm](https://img.shields.io/npm/v/snowflake.io)
![license](https://img.shields.io/npm/l/snowflake.io)

Production-oriented Snowflake ID generator for the Node.js ecosystem, designed for NestJS, PM2, Node.js cluster, and multi-server deployments.  
中文文档请查看: [README.md](./README.md)

[Chinese Documentation](./README.md)

## Features

- 🚀 **High Performance**: up to 5,000,000+ IDs/second on a single node
- 🔒 **Thread Safe**: built-in concurrency protection for high-throughput scenarios
- ⚡ **Async Support**: full async APIs for high-concurrency services
- 🌐 **Cluster Ready**: explicit node identity for production deployments
- 🛡️ **Clock Skew Handling**: supports `throw`, `wait`, and `auto_adjust`
- 📊 **Monitoring**: built-in runtime stats for monitoring and alerting
- 💎 **BigInt Precision**: avoids JavaScript Number precision issues
- 🧭 **Node Utilities**: built-in compose/decompose helpers for node IDs

## Installation

```bash
pnpm add snowflake.io
```

## Quick Start

```typescript
import { composeNodeId, generateId, generateIds, parseId, isValidId } from 'snowflake.io'

const nodeId = composeNodeId(1, 1)
const id = generateId({ id: nodeId })

const ids = generateIds(100, { datacenter: 1, worker: 2 })
const parts = parseId(id, { datacenter: 1, worker: 1 })

isValidId(id) // true
```

## Production First

Since `v4.0`, `snowflake.io` defaults to production-safe behavior:

- you must explicitly pass `id` or `datacenter + worker`
- implicit automatic node allocation is disabled by default
- out-of-range node values throw immediately instead of being silently masked

For local development and tests only:

```typescript
generateId({ allowUnsafeAutoNodeId: true })
```

Do not use `allowUnsafeAutoNodeId` in production.

## ID Structure

```text
| Sign(1) | Timestamp(41) | Node ID(10) | Sequence(12) |
```

| Component | Bits | Range | Description |
|-----------|------|-------|-------------|
| Sign | 1 | 0 | Always 0 |
| Timestamp | 41 | ~69 years | Milliseconds since epoch |
| Node ID | 10 | 0-1023 | Up to 1024 nodes |
| Sequence | 12 | 0-4095 | 4096 IDs per millisecond |

## Options

| Option | Type | Default / Range | Notes |
|--------|------|------------------|-------|
| `id` | `number \| bigint` | `0-1023` | Direct 10-bit node ID, overrides `datacenter/worker` |
| `datacenter` | `number` | `0-31` | High 5 bits of the node ID |
| `worker` | `number` | `0-31` | Low 5 bits of the node ID |
| `allowUnsafeAutoNodeId` | `boolean` | `false` | Dev/test only, not recommended in production |
| `epoch` | `number` | `2020-01-01 UTC` | Custom epoch in milliseconds |
| `clockSkewHandler` | `'throw' \| 'wait' \| 'auto_adjust'` | `'wait'` | Clock rollback strategy |
| `maxClockSkewWait` | `number` | `5000` | Max wait time for `wait` mode |

## API Overview

| Method | Returns | Description |
|--------|---------|-------------|
| `generateId(options?)` | `string` | Generate a single ID synchronously |
| `generateIdAsync(options?)` | `Promise<string>` | Generate a single ID asynchronously |
| `generateIds(count, options?)` | `string[]` | Generate IDs in batch synchronously |
| `generateIdsAsync(count, options?)` | `Promise<string[]>` | Generate IDs in batch asynchronously |
| `parseId(id, options?)` | `SnowflakeDeconstructed` | Parse an ID |
| `isValidId(id, options?)` | `boolean` | Validate an ID |
| `composeNodeId(datacenter, worker)` | `number` | Encode `datacenter + worker` into a node ID |
| `decomposeNodeId(nodeId)` | `SnowflakeNodeInfo` | Decode a node ID |

## Common Examples

### Generate a single ID

```typescript
import { generateId } from 'snowflake.io'

const id = generateId({ datacenter: 1, worker: 5 })
```

### Batch generation

```typescript
import { generateIds } from 'snowflake.io'

const ids = generateIds(1000, { datacenter: 1, worker: 1 })
```

### Parse an ID

```typescript
import { parseId } from 'snowflake.io'

const parts = parseId('824443173089710080', { datacenter: 1, worker: 1 })
console.log(parts)
```

### Static class usage

```typescript
import { Snowflake } from 'snowflake.io'

const id = Snowflake.generateId({ id: 1 })
const ids = Snowflake.generateIds(100, { id: 1 })
const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })
```

## Deployment Guide

### Node.js cluster / PM2

```typescript
import cluster from 'node:cluster'
import { generateId } from 'snowflake.io'

const datacenter = Number(process.env.SNOWFLAKE_DATACENTER_ID ?? 1)
const worker =
  process.env.NODE_APP_INSTANCE !== undefined
    ? Number(process.env.NODE_APP_INSTANCE)
    : cluster.isWorker
      ? cluster.worker.id - 1
      : 0

const id = generateId({
  datacenter,
  worker,
  clockSkewHandler: 'wait',
  maxClockSkewWait: 100,
})
```

Rules:

- `datacenter` must be unique across machines
- `worker` must be unique within the same machine
- maximum workers per machine: `32`

### Recommended production patterns

- Stable machine layout: assign one `datacenter` per machine and one `worker` per process
- Elastic container / Kubernetes setups: centrally allocate a 10-bit `id` via Redis, DB, or etcd

### Clock skew recommendation

Recommended for e-commerce, payment, and order systems:

```typescript
{
  clockSkewHandler: 'wait',
  maxClockSkewWait: 50,
}
```

Guidance:

- `throw`: strictest behavior, fail immediately on rollback
- `wait`: recommended default for production
- `auto_adjust`: more available, but weaker time semantics

Avoid `auto_adjust` for critical business systems unless you fully accept the trade-off.

### Production checklist

- explicitly configure `id` or `datacenter + worker`
- keep `epoch` consistent across nodes
- synchronize clocks with NTP / Chrony
- monitor `clockBackwardsCount`
- never use `allowUnsafeAutoNodeId` in production
- return IDs as strings across JSON / HTTP boundaries

## Clock Skew Strategies

| Strategy | Behavior | Recommended use |
|----------|----------|-----------------|
| `throw` | throw immediately | finance / strict consistency |
| `wait` | wait for the clock to catch up | general production workloads |
| `auto_adjust` | reuse the last timestamp | availability-first scenarios |

```typescript
generateId({ id: 1, clockSkewHandler: 'throw' })
generateId({ id: 1, clockSkewHandler: 'wait', maxClockSkewWait: 5000 })
generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

## Cluster Deployment Notes

### Core principles

```text
1. Node IDs must be unique
2. Clocks must stay synchronized
3. All nodes must use the same epoch
```

### Kubernetes environment injection

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
spec:
  replicas: 10
  template:
    spec:
      containers:
        - name: app
          image: my-app:latest
          env:
            - name: NODE_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.uid
```

### StatefulSet

```typescript
const podOrdinal = parseInt(process.env.POD_ORDINAL || '0')

const id = generateId({
  datacenter: 0,
  worker: podOrdinal,
})
```

### Database-backed node ID allocation

```sql
CREATE TABLE node_registry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  node_id INT UNIQUE,
  hostname VARCHAR(255),
  ip VARCHAR(45),
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Redis-backed node ID allocation

```typescript
import Redis from 'ioredis'

// Typical pattern: allocate nodeId on startup, release it on shutdown
```

## Monitoring and Alerting

```typescript
import { Snowflake } from 'snowflake.io'

setInterval(() => {
  const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })

  if (stats.clockBackwardsCount > 0) {
    console.warn('Clock rollback detected', stats.clockBackwardsCount)
  }

  console.log('Total generated:', stats.totalGenerated)
}, 60000)
```

Watch at least:

- `clockBackwardsCount`
- `totalGenerated`
- `sequence`
- `lastTimestamp`

## FAQ

### Why BigInt instead of Number?

JavaScript Number cannot safely represent large 64-bit Snowflake values. BigInt avoids precision loss.

### Are Snowflake IDs sortable?

Yes, roughly:

- approximately increasing over time
- strictly increasing per node
- may be slightly out of order across nodes within the same millisecond

### How should I store them in the database?

Recommended:

- `VARCHAR(20)` for general compatibility
- `BIGINT` for storage-sensitive cases

If you use `BIGINT`, make sure your driver and ORM handle it correctly.

### What if node IDs are not enough?

Options include:

- adding an external allocation layer
- using a multi-level node management strategy
- splitting ID generation by business domain

## Performance

```text
Benchmark (MacBook Pro M1):
- Generate 10,000 IDs: 2-3ms
- Per ID: 0.0002ms
- Throughput: 3,000,000+ IDs/second
- Memory: < 1MB for 10,000 IDs
```

## Migration from v2.x

```typescript
// v2.x
import { generateSnowflakeId } from 'snowflake.io'

// v4.0
import { generateId } from 'snowflake.io'
```

## License

MIT
