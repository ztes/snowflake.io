# Snowflake.io v4.0

![npm](https://img.shields.io/npm/v/snowflake.io)
![license](https://img.shields.io/npm/l/snowflake.io)

High-performance distributed unique ID generator for production environments.  
高性能分布式雪花 ID 生成器，专为 Node.js 生产环境设计。

完整英文文档请查看 [README.EN.md](./README.EN.md)

## Features / 特性

- 🚀 **High Performance** - 高性能，单机可达到 5,000,000+ IDs/second
- 🔒 **Thread Safe** - 线程安全，内置并发保护机制，适用于并发场景
- ⚡ **Async Support** - 异步支持，提供完整异步 API，适合高并发环境
- 🌐 **Cluster Ready** - 集群就绪，支持生产环境显式节点身份配置
- 🛡️ **Clock Skew Handling** - 时钟回拨处理，支持 `throw` / `wait` / `auto_adjust` 三种策略
- 📊 **Monitoring** - 监控统计，内置运行时统计信息，便于生产监控
- 💎 **BigInt Precision** - BigInt 精度安全，避免 JavaScript Number 精度问题
- 🧭 **Node Utilities** - 节点工具，内置节点 ID 编码 / 解码辅助方法

## Installation / 安装

```bash
pnpm add snowflake.io
```

## Quick Start / 快速开始

```typescript
import {
  composeNodeId,
  decomposeNodeId,
  generateId,
  generateIds,
  parseId,
  isValidId,
} from 'snowflake.io'

// 生成单个 ID
const nodeId = composeNodeId(1, 1)
const id = generateId({ id: nodeId })
// '824443173089710080'

// 批量生成
const ids = generateIds(100, { datacenter: 1, worker: 2 })

// 解析 ID
const parts = parseId(id, { datacenter: 1, worker: 1 })
// { timestamp: 1774399369878, nodeId: 33, sequence: 0, epoch: 1577836800000 }

// 校验 ID
isValidId(id) // true

// 解码节点 ID
decomposeNodeId(nodeId)
// { nodeId: 33, datacenter: 1, worker: 1 }
```

## Production First / 生产优先

从 `v4.0` 开始，`snowflake.io` 默认采用更安全的生产策略：

- 必须显式传入 `id` 或 `datacenter + worker`
- 不再默认根据 `process.pid` 自动分配节点 ID
- `id`、`datacenter`、`worker` 超范围时直接抛错，不再静默截断

如果你只是在本地开发或测试环境临时调试，可以显式开启不安全自动节点模式：

```typescript
generateId({ allowUnsafeAutoNodeId: true })
```

请不要在生产环境使用 `allowUnsafeAutoNodeId`。

## 快速上手：多机 / Node.js Cluster / PM2 Cluster

如果你是第一次在生产环境接 `snowflake.io`，最推荐的做法不是直接传 `id`，而是统一使用：

- 每台机器一个 `datacenter`
- 每个进程一个 `worker`

也就是：

```text
nodeId = (datacenter << 5) | worker
```

这样最容易排查，也最符合 Node.js 多机、多进程部署习惯。

### 1. 单机单进程

适合：

- 一台机器只跑一个 Node.js 进程
- 本地开发环境
- 小型服务

配置：

```bash
SNOWFLAKE_DATACENTER_ID=1
SNOWFLAKE_WORKER_ID=0
```

使用：

```typescript
import { generateId } from 'snowflake.io'

const id = generateId({
  datacenter: Number(process.env.SNOWFLAKE_DATACENTER_ID),
  worker: Number(process.env.SNOWFLAKE_WORKER_ID),
})
```

### 2. 多机部署

适合：

- 2 台或更多机器
- 每台机器上可能还有多个 Node.js 进程

配置原则：

- 每台机器 `SNOWFLAKE_DATACENTER_ID` 必须不同
- 同一台机器内每个进程 `worker` 必须不同

示例：

```text
机器 A: SNOWFLAKE_DATACENTER_ID=1
机器 B: SNOWFLAKE_DATACENTER_ID=2
机器 C: SNOWFLAKE_DATACENTER_ID=3
```

如果每台机器只跑一个进程，那么所有机器都可以用：

```bash
SNOWFLAKE_WORKER_ID=0
```

### 3. PM2 Cluster 模式

这是 Node.js 里最省心的生产接法之一。

PM2 会自动给每个实例注入 `NODE_APP_INSTANCE`，你可以直接把它当成 `worker`：

```bash
SNOWFLAKE_DATACENTER_ID=2
NODE_APP_INSTANCE=0
```

代码：

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

推荐的 PM2 `ecosystem.config.js` 示例：

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

说明：

- PM2 会给 4 个实例分别注入 `NODE_APP_INSTANCE=0/1/2/3`
- 你不需要手工给每个实例分别写 `worker`
- 只要单机实例数不超过 `32`，这套方式就可以直接用

### 4. Node.js Cluster 模式

如果你直接使用 `node:cluster`，推荐把 `cluster.worker.id - 1` 当作 `worker`：

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

原因是 `cluster.worker.id` 通常从 `1` 开始，而雪花 `worker` 需要从 `0` 开始。

### 5. 最推荐的封装方式

最省心的做法，是在应用启动时统一解析配置，然后整个进程只复用这一套配置。

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

这段代码的好处是：

- 单机时直接用 `SNOWFLAKE_WORKER_ID`
- PM2 时自动优先读取 `NODE_APP_INSTANCE`
- `node:cluster` 时自动回退到 `cluster.worker.id - 1`
- 如果节点配置缺失，进程会直接启动失败，而不是悄悄带病运行

### 6. 什么时候应该直接传 `id`

以下场景更适合直接传 10 位 `id`：

- 你已经有中心化节点分配服务
- 你跑在弹性容器环境里，节点位置不稳定
- 单机进程数可能超过 `32`

例如：

```bash
SNOWFLAKE_NODE_ID=513
```

```typescript
generateId({ id: Number(process.env.SNOWFLAKE_NODE_ID) })
```

### 7. 你拿到库后最少需要记住的规则

```text
1. 生产环境必须显式配置节点身份
2. 每台机器 datacenter 唯一
3. 同机每个进程 worker 唯一
4. 单机 worker 最多 32 个
5. 推荐 clockSkewHandler='wait' + maxClockSkewWait=100
6. 不要在生产环境使用 allowUnsafeAutoNodeId
```

## ID Structure / ID结构

```text
| 符号位(1) | 时间戳(41) | 节点ID(10) | 序列号(12) |
```

| 组成部分 | 位数 | 范围 | 说明 |
|----------|------|------|------|
| 符号位 | 1 | 0 | 固定为 0 |
| 时间戳 | 41 | 约 69 年 | 相对 epoch 的毫秒差 |
| 节点 ID | 10 | 0-1023 | 最多 1024 个节点 |
| 序列号 | 12 | 0-4095 | 每毫秒最多 4096 个 ID |

## Options / 配置项

| 配置项 | 类型 | 范围 / 默认值 | 说明 |
|--------|------|----------------|------|
| `id` | `number \| bigint` | `0-1023` | 直接指定 10 位节点 ID，会覆盖 `datacenter/worker` |
| `datacenter` | `number` | `0-31` | 节点 ID 高 5 位 |
| `worker` | `number` | `0-31` | 节点 ID 低 5 位 |
| `allowUnsafeAutoNodeId` | `boolean` | `false` | 仅用于开发 / 测试，生产环境不建议使用 |
| `epoch` | `number` | `2020-01-01 UTC` | 自定义纪元时间戳（毫秒） |
| `clockSkewHandler` | `'throw' \| 'wait' \| 'auto_adjust'` | `'wait'` | 时钟回拨处理策略 |
| `maxClockSkewWait` | `number` | `5000` | 回拨等待的最大时长 |

## API Reference / API文档

### 常用函数用途速查

| 函数 | 它是干什么的 | 什么时候用 |
|------|--------------|------------|
| `generateId(options?)` | 生成一个雪花 ID（同步） | 最常用，普通业务代码里直接生成单个 ID |
| `generateIdAsync(options?)` | 异步生成一个雪花 ID | 高并发或异步流程里生成单个 ID |
| `generateIds(count, options?)` | 一次生成多个雪花 ID（同步） | 需要批量生成 ID，且希望减少重复调用开销 |
| `generateIdsAsync(count, options?)` | 一次异步生成多个雪花 ID | 批量生成且在异步场景中使用 |
| `parseId(id, options?)` | 把一个雪花 ID 解析成时间戳、节点 ID、序列号等信息 | 排查问题、追踪 ID 来源、根据 ID 反推生成时间 |
| `isValidId(id, options?)` | 判断一个值是不是合法雪花 ID | 接口入参校验、导入数据校验、风控检查 |
| `composeNodeId(datacenter, worker)` | 把 `datacenter + worker` 组合成一个 10 位节点 ID | 你想先分配数据中心和工作节点，再得到最终 `nodeId` 时使用 |
| `decomposeNodeId(nodeId)` | 把一个 10 位节点 ID 反向解析为 `datacenter + worker` | 你拿到 `nodeId` 后，想知道它属于哪个数据中心、哪个进程 |
| `getNodeInfo(options?)` | 直接返回当前配置对应的节点信息 `{ nodeId, datacenter, worker }` | 启动日志打印、健康检查、调试当前实例配置 |
| `Snowflake.getStats(options?)` | 返回当前实例统计信息，如序列号、时钟回拨次数、总生成量 | 监控、告警、运行时观察 |

### 一个最容易理解的例子

假设你有下面这组配置：

```typescript
const datacenter = 1
const worker = 5
```

那几个容易混淆的函数分别是：

```typescript
import {
  composeNodeId,
  decomposeNodeId,
  getNodeInfo,
} from 'snowflake.io'

const nodeId = composeNodeId(datacenter, worker)
// 作用：把 datacenter=1 和 worker=5 组合成一个 nodeId
// 结果：37

const parts = decomposeNodeId(nodeId)
// 作用：把 nodeId=37 再拆回 datacenter 和 worker
// 结果：{ nodeId: 37, datacenter: 1, worker: 5 }

const current = getNodeInfo({ datacenter: 1, worker: 5 })
// 作用：直接告诉你“这套配置对应的节点信息是什么”
// 结果：{ nodeId: 37, datacenter: 1, worker: 5 }
```

### 快速参考

| 函数 | 返回类型 | 说明 |
|------|----------|------|
| `generateId(options?)` | `string` | 生成单个 ID（同步） |
| `generateIdAsync(options?)` | `Promise<string>` | 生成单个 ID（异步） |
| `generateIds(count, options?)` | `string[]` | 批量生成 ID（同步） |
| `generateIdsAsync(count, options?)` | `Promise<string[]>` | 批量生成 ID（异步） |
| `parseId(id, options?)` | `SnowflakeDeconstructed` | 解析 ID 结构 |
| `isValidId(id, options?)` | `boolean` | 验证 ID 有效性 |
| `composeNodeId(datacenter, worker)` | `number` | 编码 10 位节点 ID |
| `decomposeNodeId(nodeId)` | `SnowflakeNodeInfo` | 解码 10 位节点 ID |
| `getNodeInfo(options?)` | `SnowflakeNodeInfo` | 获取节点信息 |

---

### 函数详解

#### generateId(options?)

生成单个雪花 ID，同步方式。

```typescript
import { generateId } from 'snowflake.io'

// 指定节点ID
const id = generateId({ id: 100 })

// 指定数据中心和工作节点
const id2 = generateId({ datacenter: 1, worker: 5 })
// nodeId = (datacenter << 5) | worker = 37

// 自定义纪元
const id3 = generateId({
  datacenter: 1,
  worker: 5,
  epoch: new Date('2024-01-01').getTime(),
})

// 开发环境才允许自动节点ID
const devOnlyId = generateId({ allowUnsafeAutoNodeId: true })
```

#### generateIdAsync(options?)

异步生成单个 ID，推荐在高并发场景使用。

```typescript
import { generateIdAsync } from 'snowflake.io'

// 异步生成
const id = await generateIdAsync({ id: 1 })

// 并发生成多个ID
const promises = Array.from({ length: 100 }, () =>
  generateIdAsync({ id: 1 }),
)
const ids = await Promise.all(promises)
// 所有ID唯一，无阻塞
```

#### generateIds(count, options?)

批量生成 ID，性能更优。

```typescript
import { generateIds } from 'snowflake.io'

// 批量生成100个ID
const ids = generateIds(100, { datacenter: 1, worker: 1 })
// ['824443173089710080', '824443173089710081', ...]

// 限制：最多10000个
const manyIds = generateIds(10000, { datacenter: 1, worker: 1 })
```

#### generateIdsAsync(count, options?)

异步批量生成，适合大规模生成。

```typescript
import { generateIdsAsync } from 'snowflake.io'

// 异步批量生成
const ids = await generateIdsAsync(5000, { id: 1 })
console.log(ids.length) // 5000
```

#### composeNodeId(datacenter, worker)

将 `datacenter + worker` 编码为 10 位节点 ID。

```typescript
import { composeNodeId } from 'snowflake.io'

const nodeId = composeNodeId(2, 7)
// 71
```

#### decomposeNodeId(nodeId)

将 10 位节点 ID 解析回 `datacenter + worker`。

```typescript
import { decomposeNodeId } from 'snowflake.io'

decomposeNodeId(71)
// { nodeId: 71, datacenter: 2, worker: 7 }
```

#### parseId(id, options?)

解析 ID，提取时间戳、节点 ID、序列号。

```typescript
import { parseId } from 'snowflake.io'

const id = '824443173089710080'
const parts = parseId(id, { datacenter: 1, worker: 1 })

console.log(parts)
// {
//   timestamp: 1774399369878,    // 生成时的Unix时间戳(ms)
//   nodeId: 33,                  // 节点ID
//   sequence: 0,                 // 序列号
//   epoch: 1577836800000         // 使用的纪元
// }

// 转换为日期
const date = new Date(parts.timestamp)
// 2026-03-25T00:42:49.878Z

// 计算ID年龄
const age = Date.now() - parts.timestamp
console.log(`ID生成于 ${age}ms 前`)
```

#### isValidId(id, options?)

验证 ID 是否有效。

```typescript
import { isValidId } from 'snowflake.io'

isValidId('824443173089710080')  // true
isValidId('')                     // false
isValidId('-1')                   // false
isValidId('abc')                  // false
isValidId('99999999999999999999') // false (时间戳在未来)
```

#### getNodeInfo(options?)

获取当前实例的节点信息。

```typescript
import { getNodeInfo } from 'snowflake.io'

const nodeInfo = getNodeInfo({ datacenter: 1, worker: 5 })
// { nodeId: 37, datacenter: 1, worker: 5 }
```

---

### Snowflake 类方法

除了便捷函数，还可以使用 `Snowflake` 类的静态方法：

```typescript
import { Snowflake } from 'snowflake.io'
```

#### Snowflake.generate(options?)

生成 Buffer 格式的 ID（8 字节）。

```typescript
const buffer = Snowflake.generate({ id: 1 })
// <Buffer 0b 71 08 b5 a8 00 10 00>

// Buffer 长度固定为 8 字节
console.log(buffer.length) // 8

// 转换为十六进制字符串
buffer.toString('hex') // '0b7108b5a8001000'
```

#### Snowflake.generateId(options?)

同 `generateId()` 函数。

```typescript
const id = Snowflake.generateId({ id: 1 })
```

#### Snowflake.generateIdAsync(options?)

同 `generateIdAsync()` 函数。

```typescript
const id = await Snowflake.generateIdAsync({ id: 1 })
```

#### Snowflake.generateIds(count, options?)

同 `generateIds()` 函数。

```typescript
const ids = Snowflake.generateIds(100, { id: 1 })
```

#### Snowflake.generateIdsAsync(count, options?)

同 `generateIdsAsync()` 函数。

```typescript
const ids = await Snowflake.generateIdsAsync(100, { id: 1 })
```

#### Snowflake.deconstruct(id, options?)

同 `parseId()` 函数，支持多种输入格式。

```typescript
// 字符串
Snowflake.deconstruct('824443173089710080', { id: 1 })

// BigInt
Snowflake.deconstruct(824443173089710080n, { id: 1 })

// Buffer
const buffer = Snowflake.generate({ id: 1 })
Snowflake.deconstruct(buffer, { id: 1 })
```

#### Snowflake.validate(id, options?)

同 `isValidId()` 函数。

```typescript
Snowflake.validate('824443173089710080', { id: 1 }) // true
```

#### Snowflake.getNodeInfo(options?)

获取当前实例的节点信息。

```typescript
const nodeInfo = Snowflake.getNodeInfo({ datacenter: 1, worker: 5 })
// { nodeId: 37, datacenter: 1, worker: 5 }
```

#### Snowflake.getNodeId(options?)

获取当前配置的节点 ID。

```typescript
const nodeId = Snowflake.getNodeId({ datacenter: 1, worker: 5 })
console.log(nodeId) // 37

// 开发环境自动分配的节点ID
const autoNodeId = Snowflake.getNodeId({ allowUnsafeAutoNodeId: true })
console.log(autoNodeId)
```

#### Snowflake.getStats(options?)

获取实例统计信息，用于监控。

```typescript
const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })

console.log(stats)
// {
//   nodeId: 33,                 // 当前节点ID
//   datacenter: 1,              // 数据中心ID
//   worker: 1,                  // 工作节点ID
//   epoch: 1577836800000,       // 纪元时间
//   lastTimestamp: 1774399369878, // 最后生成ID的时间戳
//   sequence: 1,                // 当前序列号
//   maxSequence: 4095,          // 最大序列号
//   maxNodeId: 1023,            // 最大节点ID
//   maxDatacenterId: 31,        // 最大数据中心ID
//   maxWorkerId: 31,            // 最大工作节点ID
//   clockBackwardsCount: 0,     // 时钟回拨次数
//   totalGenerated: 100,        // 总共生成的ID数量
//   clockSkewHandler: 'wait',   // 当前时钟策略
//   maxClockSkewWait: 5000,     // 最大等待时间
//   autoNodeId: false           // 是否自动节点模式
// }
```

**监控示例**：

```typescript
// 定期监控时钟回拨
setInterval(() => {
  const stats = Snowflake.getStats({ id: 1 })

  if (stats.clockBackwardsCount > 0) {
    console.warn(`⚠️ 检测到时钟回拨! 次数: ${stats.clockBackwardsCount}`)
    // 发送告警
    sendAlert({
      type: 'clock_skew',
      nodeId: stats.nodeId,
      count: stats.clockBackwardsCount,
    })
  }

  // 监控ID生成速率
  console.log(`总生成: ${stats.totalGenerated}, 最后时间戳: ${stats.lastTimestamp}`)
}, 60000)
```

---

### 配置选项详解

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

#### 节点ID配置方式

```typescript
// 方式1: 直接指定节点ID (推荐)
generateId({ id: 100 })

// 方式2: 数据中心 + 工作节点
generateId({ datacenter: 1, worker: 5 })
// nodeId = (1 << 5) | 5 = 37

// 方式3: 开发环境临时自动分配（不要用于生产）
generateId({ allowUnsafeAutoNodeId: true })
```

#### 纪元配置

```typescript
// 默认纪元: 2020-01-01 00:00:00 UTC
generateId({ datacenter: 1, worker: 1 })

// 自定义纪元
generateId({
  datacenter: 1,
  worker: 1,
  epoch: new Date('2024-01-01T00:00:00Z').getTime(),
})

// 注意: 纪元不能在未来，也不能太早（会导致时间戳溢出）
```

---

### 类型定义

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

## Clock Skew Strategies / 时钟回拨策略

| 策略 | 行为说明 | 适用场景 |
|------|----------|----------|
| `throw` | 检测到时钟回拨后立即抛错 | 强一致性、严格环境 |
| `wait` | 等待时钟追上后继续生成（默认） | 通用生产环境 |
| `auto_adjust` | 直接沿用上一次时间戳 | 高可用优先场景 |

```typescript
// 严格模式：检测到回拨立即报错
generateId({ id: 1, clockSkewHandler: 'throw' })

// 等待模式：最多等待 5 秒
generateId({ id: 1, clockSkewHandler: 'wait', maxClockSkewWait: 5000 })

// 自动调整：沿用上一次时间戳继续生成
generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

---

## 🌐 Cluster Deployment / 集群部署最佳实践

### 核心原则

```text
┌─────────────────────────────────────────────────────────────┐
│  雪花ID集群部署三要素                                       │
├─────────────────────────────────────────────────────────────┤
│  1. 节点ID唯一 - 每个实例必须有不同的 nodeId (0-1023)      │
│  2. 时钟同步   - 所有节点使用 NTP 保持时间同步              │
│  3. 纪元一致   - 所有节点使用相同的 epoch                  │
└─────────────────────────────────────────────────────────────┘
```

### 方案一：Node.js Cluster / PM2 Cluster（推荐）

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

### 方案二：Kubernetes StatefulSet（推荐）

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

### 方案三：数据库分配节点ID

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

### 方案四：Redis 分布式锁分配

```typescript
import Redis from 'ioredis'

class RedisNodeManager {
  private redis = new Redis('redis://localhost:6379')
  // 启动时分配 nodeId，关闭时释放
}
```

### 多数据中心架构

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

### 监控与告警

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

### 检查清单

| 检查项 | 说明 | 验证方法 |
|--------|------|----------|
| ✅ 节点ID唯一 | 每个实例 nodeId 不同 | `Snowflake.getNodeId()` |
| ✅ 时钟同步 | NTP 服务正常运行 | `ntpq -p` 或 `timedatectl status` |
| ✅ 纪元一致 | 所有节点使用相同 epoch | `Snowflake.getStats().epoch` |
| ✅ 监控告警 | clockBackwardsCount 监控 | 定期检查 `getStats()` |
| ✅ 优雅关闭 | 释放节点ID资源 | `process.on('SIGTERM')` |
| ✅ 容量规划 | 节点数 < 1024 | 预留扩容空间 |

---

## 🎯 Advanced Topics / 进阶话题

### Clock Skew Handling Deep Dive / 时钟回拨深度解析

#### 什么是时钟回拨？

时钟回拨指系统时间向后跳变，常见原因：

| 原因 | 说明 | 风险等级 |
|------|------|----------|
| NTP 同步 | 网络时间协议校正时钟 | 🟡 中等 |
| 手动调整 | 运维人员手动修改时间 | 🔴 高 |
| 虚拟机迁移 | VM 暂停后恢复 | 🟡 中等 |
| 时区切换 | 夏令时调整 | 🟢 低 |

#### 时钟回拨的风险

```text
时间线:  t1 → t2 → t3 → t2(回拨) → t4
ID生成:  ID1 ID2 ID3  ID4(可能重复!)
```

如果回拨后使用相同时间戳 + 相同节点ID，可能生成重复 ID。

#### 三种策略的选择指南

```typescript
// 场景1: 金融交易系统 - 数据一致性优先
generateId({ id: 1, clockSkewHandler: 'throw' })

// 场景2: 电商订单系统 - 平衡可用性和一致性
generateId({
  id: 1,
  clockSkewHandler: 'wait',
  maxClockSkewWait: 5000,
})

// 场景3: 日志系统 - 可用性优先
generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

### Big Tech Solutions / 大厂解决方案

#### Twitter 原始方案

Twitter 作为雪花算法的发明者，采用“唯一节点分配 + 时钟偏差检测”的组合思路。

#### 百度 UidGenerator

特点：

- 时间戳使用秒级，延长有效期
- Worker ID 位数更大，支持更多节点
- RingBuffer 预生成 ID，提升性能

#### 美团 Leaf

特点：

- Segment 模式适合数据库号段
- Snowflake 模式适合分布式节点
- 常见做法是通过外部系统管理 Worker ID

#### Sony Sonyflake

特点：

- 时间精度 10ms
- 节点位更大
- 更适合低频、长周期系统

### Production Tips / 生产环境技巧

#### 1. Epoch 选择策略

```typescript
// ✅ 推荐：显式配置 epoch
const projectEpoch = new Date('2024-01-01').getTime()
const id = generateId({ datacenter: 1, worker: 1, epoch: projectEpoch })
```

#### 2. 节点ID分配最佳实践

```typescript
// 方案A: 环境变量配置（推荐）
const nodeId = parseInt(process.env.NODE_ID || '0')
generateId({ id: nodeId })

// 方案B: 数据库分配
async function allocateNodeId() {
  const result = await db.query(
    'INSERT INTO node_registry (hostname, ip) VALUES (?, ?) RETURNING id',
    [os.hostname(), getLocalIP()],
  )
  return result.id % 1024
}
```

#### 3. 高并发场景优化

```typescript
// ❌ 错误：循环调用同步API
for (let i = 0; i < 10000; i++) {
  ids.push(generateId({ datacenter: 1, worker: 1 }))
}

// ✅ 正确：使用批量API
const ids = generateIds(10000, { datacenter: 1, worker: 1 })

// ✅ 更好：异步并发
const ids = await generateIdsAsync(10000, { datacenter: 1, worker: 1 })
```

#### 4. ID 解析与追踪

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

#### 5. 容量规划

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

## ❓ FAQ / 常见问题

### Q1: 为什么使用 BigInt 而不是 Number？

**A**: JavaScript Number 类型最大安全整数是 `2^53 - 1 = 9007199254740991`，而雪花 ID 可能超过这个值。使用 BigInt 可以避免精度丢失。

### Q2: 时钟回拨时应该选择哪种策略？

**A**: 根据业务场景选择：

| 业务场景 | 推荐策略 | 理由 |
|----------|----------|------|
| 金融交易 | `throw` | 数据一致性优先 |
| 订单系统 | `wait` | 平衡可用性和一致性 |
| 日志系统 | `auto_adjust` | 可用性优先 |
| 消息队列 | `auto_adjust` | 允许轻微乱序 |

### Q3: 节点ID用完了怎么办？

**A**: 10 位节点 ID 支持 1024 个节点，如果不够：

```typescript
// 方案1: 多层ID分配
// datacenter(5位) * worker(5位) * 实例序号(外部管理)

// 方案2: 动态分配 + 回收
// 节点下线后回收ID

// 方案3: 按业务拆分不同ID系统
```

### Q4: 如何保证跨数据中心的ID唯一性？

**A**: 使用 `datacenter + worker` 组合：

```typescript
generateId({ datacenter: 1, worker: 1 }) // 北京
generateId({ datacenter: 1, worker: 2 }) // 北京 worker 2
generateId({ datacenter: 8, worker: 1 }) // 新加坡
```

### Q5: ID可以排序吗？

**A**: 雪花 ID 是**大致有序**的：

```text
✅ 按时间大致递增（可用于时间范围查询）
✅ 同一节点内严格递增
⚠️ 跨节点可能乱序（不同节点同一毫秒生成的ID）
```

```typescript
const ids = generateIds(100, { datacenter: 1, worker: 1 })
const sorted = [...ids].sort()
```

### Q6: 如何处理ID耗尽？

**A**: 每毫秒 4096 个 ID，单节点每秒可生成 409.6 万个 ID。如果不够：

```typescript
// 方案1: 增加节点数

// 方案2: 使用异步API批量预生成
const preGeneratedIds = await generateIdsAsync(100000, { datacenter: 1, worker: 1 })

// 方案3: 序列号溢出时等待下一毫秒
```

### Q7: 如何在数据库中存储雪花ID？

**A**: 推荐使用 `VARCHAR(20)` 或 `BIGINT UNSIGNED`。

#### 方案1: VARCHAR(20) 字符串存储（推荐）

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

#### 方案2: BIGINT UNSIGNED 数值存储

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

### Q8: 雪花ID vs UUID 如何选择？

| 特性 | 雪花ID | UUID |
|------|--------|------|
| 长度 | 18-19位 | 36字符 |
| 有序性 | 大致有序 | 无序 |
| 索引效率 | 高 | 低 |
| 可解析 | 时间+节点 | 无 |
| 分布式 | 需要协调 | 无需协调 |
| 适用场景 | 数据库主键 / 业务流水号 | 临时标识 |

---

## Performance / 性能

```text
Benchmark / 基准环境（MacBook Pro M1）:
- Generate 10,000 IDs: 2-3ms
- Per ID: 0.0002ms
- Throughput: 3,000,000+ IDs/second
- Memory: < 1MB for 10,000 IDs
```

## Migration from v2.x / 从v2.x迁移

```typescript
// v2.x
import { generateSnowflakeId } from 'snowflake.io'

// v4.0
import { generateId } from 'snowflake.io'
```

## License / 许可证

MIT
