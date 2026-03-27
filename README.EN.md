# Snowflake.io v4.0

![npm](https://img.shields.io/npm/v/snowflake.io)
![license](https://img.shields.io/npm/l/snowflake.io)

High-performance distributed unique ID generator for production environments.  
For Chinese documentation, see [README.md](./README.md).

## Features

- 🚀 **High Performance** - up to 5,000,000+ IDs/second on a single node
- 🔒 **Thread Safe** - built-in concurrency protection for concurrent scenarios
- ⚡ **Async Support** - full async APIs for high-concurrency environments
- 🌐 **Cluster Ready** - explicit node identity for production deployments
- 🛡️ **Clock Skew Handling** - supports `throw`, `wait`, and `auto_adjust`
- 📊 **Monitoring** - built-in runtime statistics for production monitoring
- 💎 **BigInt Precision** - avoids JavaScript Number precision issues
- 🧭 **Node Utilities** - built-in helpers for composing and decomposing node IDs

## Installation

```bash
pnpm add snowflake.io
```

## Quick Start

```typescript
import {
  composeNodeId,
  decomposeNodeId,
  generateId,
  generateIds,
  parseId,
  isValidId,
} from 'snowflake.io'

// Generate a single ID
const nodeId = composeNodeId(1, 1)
const id = generateId({ id: nodeId })
// '824443173089710080'

// Batch generation
const ids = generateIds(100, { datacenter: 1, worker: 2 })

// Parse an ID
const parts = parseId(id, { datacenter: 1, worker: 1 })
// { timestamp: 1774399369878, nodeId: 33, sequence: 0, epoch: 1577836800000 }

// Validate an ID
isValidId(id) // true

// Decode a node ID
decomposeNodeId(nodeId)
// { nodeId: 33, datacenter: 1, worker: 1 }
```

## Production First

Since `v4.0`, `snowflake.io` defaults to safer production behavior:

- you must explicitly pass `id` or `datacenter + worker`
- automatic node assignment based on `process.pid` is disabled by default
- out-of-range `id`, `datacenter`, and `worker` values throw immediately instead of being silently masked

If you only need temporary local development or test behavior, you can explicitly enable unsafe automatic node assignment:

```typescript
generateId({ allowUnsafeAutoNodeId: true })
```

Do not use `allowUnsafeAutoNodeId` in production.

## Quick Start for Multi-Machine / Node.js Cluster / PM2 Cluster

If this is your first time using `snowflake.io` in production, the most recommended pattern is not to pass a raw `id`, but to standardize on:

- one `datacenter` per machine
- one `worker` per process

That means:

```text
nodeId = (datacenter << 5) | worker
```

This is the easiest model to reason about, debug, and operate in Node.js multi-machine and multi-process deployments.

### 1. Single machine, single process

Best for:

- one Node.js process on one machine
- local development
- small services

Configuration:

```bash
SNOWFLAKE_DATACENTER_ID=1
SNOWFLAKE_WORKER_ID=0
```

Usage:

```typescript
import { generateId } from 'snowflake.io'

const id = generateId({
  datacenter: Number(process.env.SNOWFLAKE_DATACENTER_ID),
  worker: Number(process.env.SNOWFLAKE_WORKER_ID),
})
```

### 2. Multi-machine deployment

Best for:

- two or more machines
- one or more Node.js processes per machine

Rules:

- each machine must have a unique `SNOWFLAKE_DATACENTER_ID`
- each process on the same machine must have a unique `worker`

Example:

```text
Machine A: SNOWFLAKE_DATACENTER_ID=1
Machine B: SNOWFLAKE_DATACENTER_ID=2
Machine C: SNOWFLAKE_DATACENTER_ID=3
```

If each machine only runs one process, every machine can simply use:

```bash
SNOWFLAKE_WORKER_ID=0
```

### 3. PM2 Cluster mode

This is one of the easiest production setups for Node.js.

PM2 injects `NODE_APP_INSTANCE` for every instance, and you can use it directly as the `worker`:

```bash
SNOWFLAKE_DATACENTER_ID=2
NODE_APP_INSTANCE=0
```

Code:

```typescript
import { generateId } from 'snowflake.io'

const datacenter = Number(process.env.SNOWFLAKE_DATACENTER_ID)
const worker = Number(process.env.NODE_APP_INSTANCE ?? '0')

const id = generateId({
  datacenter,
  worker,
  clockSkewHandler: 'wait',
  maxClockSkewWait: 100,
})
```

Recommended PM2 `ecosystem.config.js` example:

```javascript
module.exports = {
  apps: [
    {
      name: 'snowflake-demo',
      script: './dist/main.js',
      exec_mode: 'cluster',
      instances: 4,
      env: {
        SNOWFLAKE_DATACENTER_ID: '2',
        SNOWFLAKE_CLOCK_SKEW_HANDLER: 'wait',
        SNOWFLAKE_MAX_CLOCK_SKEW_WAIT: '100',
      },
    },
  ],
}
```

Notes:

- PM2 injects `NODE_APP_INSTANCE=0/1/2/3` for the 4 instances
- you do not need to manually assign `worker` per PM2 instance
- as long as the machine does not exceed `32` instances, this works directly

### 4. Node.js Cluster mode

If you use `node:cluster` directly, the recommended mapping is `cluster.worker.id - 1`:

```typescript
import cluster from 'node:cluster'
import { generateId } from 'snowflake.io'

const datacenter = Number(process.env.SNOWFLAKE_DATACENTER_ID)
const worker =
  cluster.isWorker && cluster.worker
    ? cluster.worker.id - 1
    : 0

const id = generateId({
  datacenter,
  worker,
  clockSkewHandler: 'wait',
  maxClockSkewWait: 100,
})
```

This is because `cluster.worker.id` usually starts at `1`, while Snowflake `worker` values need to start at `0`.

### 5. Recommended wrapper pattern

The simplest production pattern is to resolve configuration once at startup and reuse it for the whole process:

```typescript
import cluster from 'node:cluster'
import { generateId, type SnowflakeOptions } from 'snowflake.io'

function resolveSnowflakeOptions(): SnowflakeOptions {
  const directNodeId = process.env.SNOWFLAKE_NODE_ID

  if (directNodeId !== undefined && directNodeId !== '') {
    return {
      id: Number(directNodeId),
      clockSkewHandler: 'wait',
      maxClockSkewWait: 100,
    }
  }

  const datacenter = process.env.SNOWFLAKE_DATACENTER_ID
  if (datacenter === undefined || datacenter === '') {
    throw new Error(
      'Missing snowflake node config. Set SNOWFLAKE_NODE_ID or SNOWFLAKE_DATACENTER_ID.',
    )
  }

  const workerFromPm2 = process.env.NODE_APP_INSTANCE
  const workerFromEnv = process.env.SNOWFLAKE_WORKER_ID
  const workerFromCluster =
    cluster.isWorker && cluster.worker ? String(cluster.worker.id - 1) : undefined

  const worker = Number(workerFromEnv ?? workerFromPm2 ?? workerFromCluster ?? '0')

  if (worker < 0 || worker > 31) {
    throw new Error(`worker must be between 0 and 31, got ${worker}`)
  }

  return {
    datacenter: Number(datacenter),
    worker,
    clockSkewHandler: 'wait',
    maxClockSkewWait: 100,
  }
}

const snowflakeOptions = resolveSnowflakeOptions()

export function nextId() {
  return generateId(snowflakeOptions)
}
```

Why this pattern works well:

- on a single machine, you can directly use `SNOWFLAKE_WORKER_ID`
- under PM2, it automatically prefers `NODE_APP_INSTANCE`
- under `node:cluster`, it falls back to `cluster.worker.id - 1`
- if node configuration is missing, the process fails fast instead of silently running in a dangerous state

### 6. When should you pass a raw `id`

Passing a direct 10-bit `id` is a better choice when:

- you already have a centralized node allocation service
- you run in elastic container environments with unstable node placement
- one machine may exceed `32` processes

Example:

```bash
SNOWFLAKE_NODE_ID=513
```

```typescript
generateId({ id: Number(process.env.SNOWFLAKE_NODE_ID) })
```

### 7. The minimum rules you need to remember

```text
1. Production must explicitly configure node identity
2. Every machine must have a unique datacenter
3. Every process on the same machine must have a unique worker
4. One machine can have at most 32 workers
5. Recommended: clockSkewHandler='wait' + maxClockSkewWait=100
6. Never use allowUnsafeAutoNodeId in production
```

## ID Structure

```text
| Sign(1) | Timestamp(41) | Node ID(10) | Sequence(12) |
```

| Component | Bits | Range | Description |
|-----------|------|-------|-------------|
| Sign | 1 | 0 | Always 0 |
| Timestamp | 41 | ~69 years | Milliseconds relative to the epoch |
| Node ID | 10 | 0-1023 | Up to 1024 nodes |
| Sequence | 12 | 0-4095 | Up to 4096 IDs per millisecond |

## Options

| Option | Type | Range / Default | Notes |
|--------|------|------------------|-------|
| `id` | `number \| bigint` | `0-1023` | Direct 10-bit node ID, overrides `datacenter/worker` |
| `datacenter` | `number` | `0-31` | High 5 bits of the node ID |
| `worker` | `number` | `0-31` | Low 5 bits of the node ID |
| `allowUnsafeAutoNodeId` | `boolean` | `false` | For development / tests only, not recommended in production |
| `epoch` | `number` | `2020-01-01 UTC` | Custom epoch timestamp in milliseconds |
| `clockSkewHandler` | `'throw' \| 'wait' \| 'auto_adjust'` | `'wait'` | Clock rollback handling strategy |
| `maxClockSkewWait` | `number` | `5000` | Maximum wait time for rollback handling |

## API Reference

### Function cheat sheet

| Function | What it does | When to use it |
|----------|--------------|----------------|
| `generateId(options?)` | Generates one Snowflake ID synchronously | The most common function for normal business code |
| `generateIdAsync(options?)` | Generates one Snowflake ID asynchronously | High-concurrency or async workflows |
| `generateIds(count, options?)` | Generates multiple Snowflake IDs synchronously in one call | Batch generation with lower call overhead |
| `generateIdsAsync(count, options?)` | Generates multiple Snowflake IDs asynchronously | Batch generation in async flows |
| `parseId(id, options?)` | Parses a Snowflake ID into timestamp, node ID, sequence, and epoch | Troubleshooting, tracing, or reverse-inspecting an ID |
| `isValidId(id, options?)` | Checks whether a value is a valid Snowflake ID | Input validation, imported data checks, or risk controls |
| `composeNodeId(datacenter, worker)` | Combines `datacenter + worker` into one 10-bit node ID | When you manage node identity by data center and worker |
| `decomposeNodeId(nodeId)` | Splits a 10-bit node ID back into `datacenter + worker` | When you want to know which data center or process a node ID belongs to |
| `getNodeInfo(options?)` | Returns the resolved node information `{ nodeId, datacenter, worker }` | Startup logs, health checks, and debugging current instance config |
| `Snowflake.getStats(options?)` | Returns runtime stats such as sequence, rollback count, and total generated IDs | Monitoring, alerting, and runtime observation |

### The easiest example to understand

Assume you have this configuration:

```typescript
const datacenter = 1
const worker = 5
```

Then the most easily confused functions behave like this:

```typescript
import {
  composeNodeId,
  decomposeNodeId,
  getNodeInfo,
} from 'snowflake.io'

const nodeId = composeNodeId(datacenter, worker)
// Combines datacenter=1 and worker=5 into one nodeId
// Result: 37

const parts = decomposeNodeId(nodeId)
// Splits nodeId=37 back into datacenter and worker
// Result: { nodeId: 37, datacenter: 1, worker: 5 }

const current = getNodeInfo({ datacenter: 1, worker: 5 })
// Tells you what node info this config resolves to
// Result: { nodeId: 37, datacenter: 1, worker: 5 }
```

### Quick reference

| Function | Return type | Description |
|----------|-------------|-------------|
| `generateId(options?)` | `string` | Generate one ID synchronously |
| `generateIdAsync(options?)` | `Promise<string>` | Generate one ID asynchronously |
| `generateIds(count, options?)` | `string[]` | Generate IDs in batch synchronously |
| `generateIdsAsync(count, options?)` | `Promise<string[]>` | Generate IDs in batch asynchronously |
| `parseId(id, options?)` | `SnowflakeDeconstructed` | Parse an ID |
| `isValidId(id, options?)` | `boolean` | Validate an ID |
| `composeNodeId(datacenter, worker)` | `number` | Encode a 10-bit node ID |
| `decomposeNodeId(nodeId)` | `SnowflakeNodeInfo` | Decode a 10-bit node ID |
| `getNodeInfo(options?)` | `SnowflakeNodeInfo` | Get node info |

---

### Function details

#### generateId(options?)

Generates a single Snowflake ID synchronously.

```typescript
import { generateId } from 'snowflake.io'

// Direct node ID
const id = generateId({ id: 100 })

// Datacenter + worker
const id2 = generateId({ datacenter: 1, worker: 5 })
// nodeId = (datacenter << 5) | worker = 37

// Custom epoch
const id3 = generateId({
  datacenter: 1,
  worker: 5,
  epoch: new Date('2024-01-01').getTime(),
})

// Auto node ID only for development
const devOnlyId = generateId({ allowUnsafeAutoNodeId: true })
```

#### generateIdAsync(options?)

Generates a single Snowflake ID asynchronously.

```typescript
import { generateIdAsync } from 'snowflake.io'

const id = await generateIdAsync({ id: 1 })

const promises = Array.from({ length: 100 }, () =>
  generateIdAsync({ id: 1 }),
)
const ids = await Promise.all(promises)
```

#### generateIds(count, options?)

Generates IDs in batch synchronously.

```typescript
import { generateIds } from 'snowflake.io'

const ids = generateIds(100, { datacenter: 1, worker: 1 })
const manyIds = generateIds(10000, { datacenter: 1, worker: 1 })
```

#### generateIdsAsync(count, options?)

Generates IDs in batch asynchronously.

```typescript
import { generateIdsAsync } from 'snowflake.io'

const ids = await generateIdsAsync(5000, { id: 1 })
console.log(ids.length) // 5000
```

#### composeNodeId(datacenter, worker)

Encodes `datacenter + worker` into a 10-bit node ID.

```typescript
import { composeNodeId } from 'snowflake.io'

const nodeId = composeNodeId(2, 7)
// 71
```

#### decomposeNodeId(nodeId)

Decodes a 10-bit node ID back into `datacenter + worker`.

```typescript
import { decomposeNodeId } from 'snowflake.io'

decomposeNodeId(71)
// { nodeId: 71, datacenter: 2, worker: 7 }
```

#### parseId(id, options?)

Parses an ID and extracts timestamp, node ID, sequence, and epoch.

```typescript
import { parseId } from 'snowflake.io'

const id = '824443173089710080'
const parts = parseId(id, { datacenter: 1, worker: 1 })

console.log(parts)
// {
//   timestamp: 1774399369878,
//   nodeId: 33,
//   sequence: 0,
//   epoch: 1577836800000
// }

const date = new Date(parts.timestamp)
const age = Date.now() - parts.timestamp
console.log(`ID was generated ${age}ms ago`)
```

#### isValidId(id, options?)

Validates whether an ID is legal.

```typescript
import { isValidId } from 'snowflake.io'

isValidId('824443173089710080')  // true
isValidId('')                     // false
isValidId('-1')                   // false
isValidId('abc')                  // false
isValidId('99999999999999999999') // false
```

#### getNodeInfo(options?)

Returns node information for the current config.

```typescript
import { getNodeInfo } from 'snowflake.io'

const nodeInfo = getNodeInfo({ datacenter: 1, worker: 5 })
// { nodeId: 37, datacenter: 1, worker: 5 }
```

---

### Static Snowflake class methods

You can also use the static methods on the `Snowflake` class:

```typescript
import { Snowflake } from 'snowflake.io'
```

#### Snowflake.generate(options?)

Generates a Buffer-form ID (8 bytes).

```typescript
const buffer = Snowflake.generate({ id: 1 })
console.log(buffer.length) // 8
buffer.toString('hex') // '0b7108b5a8001000'
```

#### Snowflake.generateId(options?)

Same as `generateId()`.

```typescript
const id = Snowflake.generateId({ id: 1 })
```

#### Snowflake.generateIdAsync(options?)

Same as `generateIdAsync()`.

```typescript
const id = await Snowflake.generateIdAsync({ id: 1 })
```

#### Snowflake.generateIds(count, options?)

Same as `generateIds()`.

```typescript
const ids = Snowflake.generateIds(100, { id: 1 })
```

#### Snowflake.generateIdsAsync(count, options?)

Same as `generateIdsAsync()`.

```typescript
const ids = await Snowflake.generateIdsAsync(100, { id: 1 })
```

#### Snowflake.deconstruct(id, options?)

Same as `parseId()`, supports multiple input types.

```typescript
Snowflake.deconstruct('824443173089710080', { id: 1 })
Snowflake.deconstruct(824443173089710080n, { id: 1 })
const buffer = Snowflake.generate({ id: 1 })
Snowflake.deconstruct(buffer, { id: 1 })
```

#### Snowflake.validate(id, options?)

Same as `isValidId()`.

```typescript
Snowflake.validate('824443173089710080', { id: 1 }) // true
```

#### Snowflake.getNodeInfo(options?)

Returns current node info.

```typescript
const nodeInfo = Snowflake.getNodeInfo({ datacenter: 1, worker: 5 })
// { nodeId: 37, datacenter: 1, worker: 5 }
```

#### Snowflake.getNodeId(options?)

Returns the current node ID.

```typescript
const nodeId = Snowflake.getNodeId({ datacenter: 1, worker: 5 })
console.log(nodeId) // 37

const autoNodeId = Snowflake.getNodeId({ allowUnsafeAutoNodeId: true })
console.log(autoNodeId)
```

#### Snowflake.getStats(options?)

Returns runtime statistics for monitoring.

```typescript
const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })

console.log(stats)
// {
//   nodeId: 33,
//   datacenter: 1,
//   worker: 1,
//   epoch: 1577836800000,
//   lastTimestamp: 1774399369878,
//   sequence: 1,
//   maxSequence: 4095,
//   maxNodeId: 1023,
//   maxDatacenterId: 31,
//   maxWorkerId: 31,
//   clockBackwardsCount: 0,
//   totalGenerated: 100,
//   clockSkewHandler: 'wait',
//   maxClockSkewWait: 5000,
//   autoNodeId: false
// }
```

**Monitoring example**:

```typescript
setInterval(() => {
  const stats = Snowflake.getStats({ id: 1 })

  if (stats.clockBackwardsCount > 0) {
    console.warn(`Clock rollback detected! Count: ${stats.clockBackwardsCount}`)
    sendAlert({
      type: 'clock_skew',
      nodeId: stats.nodeId,
      count: stats.clockBackwardsCount,
    })
  }

  console.log(`Total generated: ${stats.totalGenerated}, last timestamp: ${stats.lastTimestamp}`)
}, 60000)
```

---

### Option details

```typescript
interface SnowflakeOptions {
  id?: number | bigint
  datacenter?: number
  worker?: number
  allowUnsafeAutoNodeId?: boolean
  epoch?: number
  clockSkewHandler?: 'throw' | 'wait' | 'auto_adjust'
  maxClockSkewWait?: number
}
```

#### Node identity configuration

```typescript
generateId({ id: 100 })
generateId({ datacenter: 1, worker: 5 })
generateId({ allowUnsafeAutoNodeId: true })
```

#### Epoch configuration

```typescript
generateId({ datacenter: 1, worker: 1 })

generateId({
  datacenter: 1,
  worker: 1,
  epoch: new Date('2024-01-01T00:00:00Z').getTime(),
})
```

---

### Type definitions

```typescript
type SnowflakeIdInput = string | Buffer | bigint

interface SnowflakeDeconstructed {
  timestamp: number
  nodeId: number
  sequence: number
  epoch: number
}

interface SnowflakeNodeInfo {
  nodeId: number
  datacenter: number
  worker: number
}

interface SnowflakeStats extends SnowflakeNodeInfo {
  epoch: number
  lastTimestamp: number
  sequence: number
  maxSequence: number
  maxNodeId: number
  maxDatacenterId: number
  maxWorkerId: number
  clockBackwardsCount: number
  totalGenerated: number
  clockSkewHandler: 'throw' | 'wait' | 'auto_adjust'
  maxClockSkewWait: number
  autoNodeId: boolean
}
```

## Clock Skew Strategies

| Strategy | Behavior | Use case |
|----------|----------|----------|
| `throw` | Throws immediately when rollback is detected | strict consistency |
| `wait` | Waits until the clock catches up (default) | general production workloads |
| `auto_adjust` | Reuses the previous timestamp | availability-first scenarios |

```typescript
generateId({ id: 1, clockSkewHandler: 'throw' })
generateId({ id: 1, clockSkewHandler: 'wait', maxClockSkewWait: 5000 })
generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

---

## 🌐 Cluster Deployment

### Core principles

```text
1. Node IDs must be unique
2. Clocks must stay synchronized
3. All nodes must use the same epoch
```

### Option 1: Node.js Cluster / PM2 Cluster (recommended)

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

### Option 2: Kubernetes StatefulSet (recommended)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: id-generator
spec:
  serviceName: id-generator
  replicas: 5
```

```typescript
const podOrdinal = parseInt(process.env.POD_ORDINAL || '0')

const id = generateId({
  datacenter: 0,
  worker: podOrdinal,
})
```

### Option 3: Database-backed node ID allocation

```sql
CREATE TABLE node_registry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  node_id INT UNIQUE,
  hostname VARCHAR(255),
  ip VARCHAR(45),
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_node_id (node_id)
);
```

### Option 4: Redis-based node allocation

```typescript
import Redis from 'ioredis'

class RedisNodeManager {
  private redis = new Redis('redis://localhost:6379')
  // Allocate nodeId on startup, release on shutdown
}
```

### Multi-datacenter architecture

```typescript
const DATACENTER_CONFIG = {
  beijing: { code: 1, timezone: 'Asia/Shanghai' },
  shanghai: { code: 2, timezone: 'Asia/Shanghai' },
  singapore: { code: 8, timezone: 'Asia/Singapore' },
}

const datacenter = DATACENTER_CONFIG[process.env.DATACENTER || 'beijing'].code
const worker = parseInt(process.env.WORKER_ID || '0')

const id = generateId({ datacenter, worker })
const parts = parseId(id)
const dc = parts.nodeId >> 5
const wk = parts.nodeId & 0x1f
```

### Monitoring and alerting

```typescript
import { Snowflake } from 'snowflake.io'

class SnowflakeMonitor {
  private lastTotal = 0
  private lastTime = Date.now()

  start() {
    setInterval(() => {
      const stats = Snowflake.getStats({ id: this.getNodeId() })

      const now = Date.now()
      const rate = (stats.totalGenerated - this.lastTotal) / ((now - this.lastTime) / 1000)
      this.lastTotal = stats.totalGenerated
      this.lastTime = now

      if (stats.clockBackwardsCount > 0) {
        this.sendAlert('clock_skew', {
          nodeId: stats.nodeId,
          count: stats.clockBackwardsCount,
          severity: 'high',
        })
      }

      this.recordMetrics({
        nodeId: stats.nodeId,
        totalGenerated: stats.totalGenerated,
        ratePerSecond: rate,
        clockBackwardsCount: stats.clockBackwardsCount,
      })
    }, 60000)
  }
}
```

### Checklist

| Check | Description | How to verify |
|-------|-------------|---------------|
| ✅ Unique node ID | Every instance has a different node ID | `Snowflake.getNodeId()` |
| ✅ Clock synchronization | NTP is working correctly | `ntpq -p` or `timedatectl status` |
| ✅ Consistent epoch | All nodes use the same epoch | `Snowflake.getStats().epoch` |
| ✅ Monitoring | `clockBackwardsCount` is monitored | periodic `getStats()` checks |
| ✅ Graceful shutdown | Releases node resources | `process.on('SIGTERM')` |
| ✅ Capacity planning | Total node count < 1024 | keep room for future expansion |

---

## 🎯 Advanced Topics

### Clock Skew Handling Deep Dive

#### What is clock rollback?

Clock rollback means the system time jumps backwards. Common causes include:

| Cause | Description | Risk |
|------|-------------|------|
| NTP synchronization | Network time correction | 🟡 Medium |
| Manual changes | Operators manually changing time | 🔴 High |
| VM migration | Resume after VM pause/migration | 🟡 Medium |
| Timezone / DST changes | Time policy changes | 🟢 Low |

#### Why it is risky

```text
Timeline:  t1 → t2 → t3 → t2(rollback) → t4
IDs:       ID1 ID2 ID3  ID4(possible duplicate!)
```

If rollback happens and the same timestamp + same node ID is reused, duplicates may occur.

#### Strategy selection guide

```typescript
generateId({ id: 1, clockSkewHandler: 'throw' })

generateId({
  id: 1,
  clockSkewHandler: 'wait',
  maxClockSkewWait: 5000,
})

generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

### Big Tech Solutions

#### Twitter

Twitter, the original inventor of Snowflake, combines unique node allocation with clock-drift detection.

#### Baidu UidGenerator

Characteristics:

- second-level timestamps for longer lifespan
- wider worker ID space for more nodes
- RingBuffer pre-generation for better throughput

#### Meituan Leaf

Characteristics:

- segment mode for DB-backed ranges
- snowflake mode for distributed nodes
- worker IDs are usually managed by an external coordination system

#### Sonyflake

Characteristics:

- 10ms time precision
- larger machine bits
- better suited for low-frequency, long-lifecycle systems

### Production Tips

#### 1. Epoch strategy

```typescript
const projectEpoch = new Date('2024-01-01').getTime()
const id = generateId({ datacenter: 1, worker: 1, epoch: projectEpoch })
```

#### 2. Node identity allocation best practices

```typescript
const nodeId = parseInt(process.env.NODE_ID || '0')
generateId({ id: nodeId })

async function allocateNodeId() {
  const result = await db.query(
    'INSERT INTO node_registry (hostname, ip) VALUES (?, ?) RETURNING id',
    [os.hostname(), getLocalIP()],
  )
  return result.id % 1024
}
```

#### 3. High-concurrency optimization

```typescript
for (let i = 0; i < 10000; i++) {
  ids.push(generateId({ datacenter: 1, worker: 1 }))
}

const ids = generateIds(10000, { datacenter: 1, worker: 1 })
const idsAsync = await generateIdsAsync(10000, { datacenter: 1, worker: 1 })
```

#### 4. ID tracing

```typescript
function traceId(id: string) {
  const parts = parseId(id)
  return {
    generatedAt: new Date(parts.timestamp),
    datacenter: parts.nodeId >> 5,
    worker: parts.nodeId & 0x1f,
    sequence: parts.sequence,
    age: Date.now() - parts.timestamp,
  }
}
```

#### 5. Capacity planning

```typescript
function calculateCapacity(nodes: number) {
  const idsPerMs = 4096
  const idsPerSecond = idsPerMs * 1000 * nodes
  const idsPerDay = idsPerSecond * 86400
  const idsPerYear = idsPerDay * 365

  return {
    perSecond: idsPerSecond,
    perDay: idsPerDay,
    perYear: idsPerYear,
  }
}
```

---

## FAQ

### Q1: Why BigInt instead of Number?

JavaScript Number cannot safely represent large 64-bit Snowflake values. BigInt avoids precision loss.

### Q2: Which clock rollback strategy should I choose?

Choose by business requirements:

| Scenario | Recommended strategy | Why |
|----------|----------------------|-----|
| Financial transactions | `throw` | consistency first |
| Order systems | `wait` | balance between availability and consistency |
| Logging systems | `auto_adjust` | availability first |
| Message queues | `auto_adjust` | minor disorder is acceptable |

### Q3: What if node IDs are not enough?

If 1024 nodes are not enough:

```typescript
// Option 1: multi-level allocation
// datacenter(5 bits) * worker(5 bits) * externally managed instance index

// Option 2: dynamic allocation + recycling
// reclaim node IDs after instance shutdown

// Option 3: split ID systems by business domain
```

### Q4: How do I guarantee uniqueness across data centers?

Use `datacenter + worker`:

```typescript
generateId({ datacenter: 1, worker: 1 }) // Beijing
generateId({ datacenter: 1, worker: 2 }) // Beijing worker 2
generateId({ datacenter: 8, worker: 1 }) // Singapore
```

### Q5: Are Snowflake IDs sortable?

Snowflake IDs are roughly ordered:

```text
✅ roughly increasing over time
✅ strictly increasing on the same node
⚠️ may be slightly out of order across different nodes in the same millisecond
```

```typescript
const ids = generateIds(100, { datacenter: 1, worker: 1 })
const sorted = [...ids].sort()
```

### Q6: How do I handle ID exhaustion?

One node can generate 4096 IDs per millisecond, about 4.096 million per second. If that is not enough:

```typescript
// Option 1: add more nodes

// Option 2: pre-generate in async batches
const preGeneratedIds = await generateIdsAsync(100000, { datacenter: 1, worker: 1 })

// Option 3: let sequence overflow wait for the next millisecond
```

### Q7: How should I store Snowflake IDs in a database?

Recommended types:

- `VARCHAR(20)` for general compatibility
- `BIGINT UNSIGNED` when storage efficiency matters

#### Option 1: `VARCHAR(20)` (recommended)

```sql
CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY,
  created_at TIMESTAMP
)
```

```typescript
import { generateId } from 'snowflake.io'

const id = generateId({ datacenter: 1, worker: 1 })
await db.query('INSERT INTO orders (id) VALUES (?)', [id])
```

#### Option 2: `BIGINT UNSIGNED`

```sql
CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY,
  created_at TIMESTAMP
)
```

```typescript
const id = generateId({ datacenter: 1, worker: 1 })
await db.query('INSERT INTO orders (id) VALUES (?)', [id])

const idBigInt = BigInt(generateId({ datacenter: 1, worker: 1 }))
await db.query('INSERT INTO orders (id) VALUES (?)', [idBigInt])
```

### Q8: Snowflake ID vs UUID

| Feature | Snowflake ID | UUID |
|---------|--------------|------|
| Length | 18-19 digits | 36 chars |
| Ordering | roughly ordered | unordered |
| Index efficiency | high | low |
| Parseable | time + node | no |
| Distributed usage | requires coordination | no coordination needed |
| Typical use | DB primary keys / business numbers | temporary identifiers |

---

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
