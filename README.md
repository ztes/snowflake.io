# Snowflake.io v3.0

![npm](https://img.shields.io/npm/v/snowflake.io) 
![license](https://img.shields.io/npm/l/snowflake.io)

High-performance distributed unique ID generator for production environments.  
高性能分布式雪花ID生成器，专为大规模生产环境设计。

## Features / 特性

- 🚀 **High Performance** - 5,000,000+ IDs/second
- 🔒 **Thread Safe** - Built-in lock mechanism for concurrent scenarios
- ⚡ **Async Support** - Full async API for high-concurrency environments
- 🌐 **Cluster Ready** - Auto node ID assignment from process.pid
- 🛡️ **Clock Skew Handling** - Three strategies: throw / wait / auto_adjust
- 📊 **Monitoring** - Built-in statistics for production monitoring
- 💎 **BigInt Precision** - No JavaScript number precision issues

## Installation / 安装

```bash
pnpm add snowflake.io
```

## Quick Start / 快速开始

```typescript
import { generateId, generateIds, parseId, isValidId } from 'snowflake.io'

// Generate single ID
const id = generateId({ datacenter: 1, worker: 1 })
// '824443173089710080'

// Batch generation
const ids = generateIds(100, { datacenter: 1, worker: 2 })

// Parse ID
const parts = parseId(id, { datacenter: 1, worker: 1 })
// { timestamp: 1774399369878, nodeId: 33, sequence: 0, epoch: 1577836800000 }

// Validate ID
isValidId(id) // true
```

## ID Structure / ID结构

```
| 符号位(1) | 时间戳(41) | 节点ID(10) | 序列号(12) |
```

| Component | Bits | Range | Description |
|-----------|------|-------|-------------|
| Sign | 1 | 0 | Always 0 |
| Timestamp | 41 | ~69 years | Milliseconds since epoch |
| Node ID | 10 | 0-1023 | Up to 1024 nodes |
| Sequence | 12 | 0-4095 | 4096 IDs per millisecond |

## API Reference / API文档

### 快速参考

| 函数 | 返回类型 | 说明 |
|------|----------|------|
| `generateId(options?)` | `string` | 生成单个ID（同步） |
| `generateIdAsync(options?)` | `Promise<string>` | 生成单个ID（异步） |
| `generateIds(count, options?)` | `string[]` | 批量生成ID（同步） |
| `generateIdsAsync(count, options?)` | `Promise<string[]>` | 批量生成ID（异步） |
| `parseId(id, options?)` | `SnowflakeDeconstructed` | 解析ID结构 |
| `isValidId(id, options?)` | `boolean` | 验证ID有效性 |

---

### 函数详解

#### generateId(options?)

生成单个雪花ID，同步方式。

```typescript
import { generateId } from 'snowflake.io'

// 基本用法 - 自动分配节点ID
const id = generateId()
// '824443173089710080'

// 指定节点ID
const id = generateId({ id: 100 })

// 指定数据中心和工作节点
const id = generateId({ datacenter: 1, worker: 5 })
// nodeId = (datacenter << 5) | worker = 37

// 自定义纪元
const id = generateId({ 
  epoch: new Date('2024-01-01').getTime() 
})
```

#### generateIdAsync(options?)

异步生成单个ID，推荐在高并发场景使用。

```typescript
import { generateIdAsync } from 'snowflake.io'

// 异步生成
const id = await generateIdAsync({ id: 1 })

// 并发生成多个ID
const promises = Array.from({ length: 100 }, () => 
  generateIdAsync({ id: 1 })
)
const ids = await Promise.all(promises)
// 所有ID唯一，无阻塞
```

#### generateIds(count, options?)

批量生成ID，性能更优。

```typescript
import { generateIds } from 'snowflake.io'

// 批量生成100个ID
const ids = generateIds(100)
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

#### parseId(id, options?)

解析ID，提取时间戳、节点ID、序列号。

```typescript
import { parseId } from 'snowflake.io'

const id = '824443173089710080'
const parts = parseId(id, { datacenter: 1, worker: 1 })

console.log(parts)
// {
//   timestamp: 1774399369878,    // 生成时的Unix时间戳(ms)
//   nodeId: 33,                   // 节点ID
//   sequence: 0,                  // 序列号
//   epoch: 1577836800000          // 使用的纪元
// }

// 转换为日期
const date = new Date(parts.timestamp)
// 2026-03-25T00:42:49.878Z

// 计算ID年龄
const age = Date.now() - parts.timestamp
console.log(`ID生成于 ${age}ms 前`)
```

#### isValidId(id, options?)

验证ID是否有效。

```typescript
import { isValidId } from 'snowflake.io'

isValidId('824443173089710080')  // true
isValidId('')                     // false
isValidId('-1')                   // false
isValidId('abc')                  // false
isValidId('99999999999999999999') // false (时间戳在未来)
```

---

### Snowflake 类方法

除了便捷函数，还可以使用 `Snowflake` 类的静态方法：

```typescript
import { Snowflake } from 'snowflake.io'
```

#### Snowflake.generate(options?)

生成 Buffer 格式的ID（8字节）。

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

#### Snowflake.getStats(options?)

获取实例统计信息，用于监控。

```typescript
const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })

console.log(stats)
// {
//   nodeId: 33,              // 当前节点ID
//   epoch: 1577836800000,    // 纪元时间
//   lastTimestamp: 1774399369878,  // 最后生成ID的时间戳
//   sequence: 1,             // 当前序列号
//   maxSequence: 4095,       // 最大序列号
//   maxNodeId: 1023,         // 最大节点ID
//   clockBackwardsCount: 0,  // 时钟回拨次数
//   totalGenerated: 100      // 总共生成的ID数量
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
      count: stats.clockBackwardsCount
    })
  }
  
  // 监控ID生成速率
  console.log(`总生成: ${stats.totalGenerated}, 最后时间戳: ${stats.lastTimestamp}`)
}, 60000)
```

#### Snowflake.getNodeId(options?)

获取当前配置的节点ID。

```typescript
const nodeId = Snowflake.getNodeId({ datacenter: 1, worker: 5 })
console.log(nodeId) // 37

// 自动分配的节点ID
const autoNodeId = Snowflake.getNodeId()
console.log(autoNodeId) // 基于process.pid计算
```

---

### 配置选项详解

```typescript
interface SnowflakeOptions {
  id?: number | bigint        // 直接指定10位节点ID (0-1023)
  datacenter?: number         // 数据中心ID (5位, 0-31)
  worker?: number             // 工作节点ID (5位, 0-31)
  epoch?: number              // 自定义纪元 (默认: 2020-01-01 UTC)
  clockSkewHandler?: 'throw' | 'wait' | 'auto_adjust'  // 时钟回拨策略
  maxClockSkewWait?: number   // 最大等待时间 (默认: 5000ms)
}
```

#### 节点ID配置方式

```typescript
// 方式1: 直接指定节点ID (推荐)
generateId({ id: 100 })

// 方式2: 数据中心 + 工作节点
generateId({ datacenter: 1, worker: 5 })
// nodeId = (1 << 5) | 5 = 37

// 方式3: 自动分配 (基于 process.pid)
generateId()
```

#### 纪元配置

```typescript
// 默认纪元: 2020-01-01 00:00:00 UTC
generateId()

// 自定义纪元
generateId({ 
  epoch: new Date('2024-01-01T00:00:00Z').getTime() 
})

// 注意: 纪元不能在未来，也不能太早（会导致时间戳溢出）
```

---

### 类型定义

```typescript
// ID 输入类型
type SnowflakeIdInput = string | Buffer | bigint

// 解析结果
interface SnowflakeDeconstructed {
  timestamp: number   // Unix 时间戳 (毫秒)
  nodeId: number      // 节点ID (0-1023)
  sequence: number    // 序列号 (0-4095)
  epoch: number       // 纪元时间
}

// 统计信息
interface Stats {
  nodeId: number
  epoch: number
  lastTimestamp: number
  sequence: number
  maxSequence: number
  maxNodeId: number
  clockBackwardsCount: number
  totalGenerated: number
}
```

## Clock Skew Strategies / 时钟回拨策略

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `throw` | Throw error immediately | Strict environments |
| `wait` | Wait for clock to catch up (default) | General use |
| `auto_adjust` | Use last timestamp | High availability |

```typescript
// Strict mode - throw on clock skew
generateId({ id: 1, clockSkewHandler: 'throw' })

// Wait mode - wait up to 5 seconds
generateId({ id: 1, clockSkewHandler: 'wait', maxClockSkewWait: 5000 })

// Auto-adjust - continue with last timestamp
generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

---

## 🌐 Cluster Deployment / 集群部署最佳实践

### 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│  雪花ID集群部署三要素                                         │
├─────────────────────────────────────────────────────────────┤
│  1. 节点ID唯一 - 每个实例必须有不同的 nodeId (0-1023)         │
│  2. 时钟同步   - 所有节点使用 NTP 保持时间同步                 │
│  3. 纪元一致   - 所有节点使用相同的 epoch                     │
└─────────────────────────────────────────────────────────────┘
```

### 方案一：Kubernetes 环境变量注入（推荐）

```yaml
# k8s-deployment.yaml
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
              fieldPath: metadata.uid  # 使用 Pod UID 的哈希
        # 或使用 StatefulSet 的序号
        # - name: NODE_ID  
        #   value: "$(POD_ORDINAL)"
```

```typescript
// app.ts
import { generateId, Snowflake } from 'snowflake.io'

// 方式1: 从环境变量读取
const nodeId = parseInt(process.env.NODE_ID || '0') % 1024

// 方式2: 使用 Pod 名称哈希（适用于 Deployment）
const podName = process.env.HOSTNAME || '0'
const nodeId = Math.abs(hashCode(podName)) % 1024

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
  }
  return hash
}

// 初始化
const id = generateId({ id: nodeId })
console.log(`Node ${nodeId} generated ID: ${id}`)
```

### 方案二：Kubernetes StatefulSet（最佳）

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: id-generator
spec:
  serviceName: id-generator
  replicas: 5
  template:
    spec:
      containers:
      - name: app
        image: my-app:latest
        env:
        - name: POD_ORDINAL
          valueFrom:
            fieldRef:
              fieldPath: metadata.labels['apps.kubernetes.io/pod-index']
```

```typescript
// app.ts - StatefulSet 序号直接作为节点ID
const podOrdinal = parseInt(process.env.POD_ORDINAL || '0')

// nodeId = datacenter * 32 + worker
// 假设 datacenter = 0, worker = podOrdinal
const id = generateId({ 
  datacenter: 0, 
  worker: podOrdinal 
})

console.log(`Worker ${podOrdinal}, NodeID: ${Snowflake.getNodeId()}`)
```

### 方案三：数据库分配节点ID

```sql
-- node_registry.sql
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

```typescript
// node-manager.ts
import { generateId, Snowflake } from 'snowflake.io'
import os from 'os'
import db from './db'

class NodeManager {
  private nodeId: number | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null

  async register(): Promise<number> {
    const hostname = os.hostname()
    const ip = this.getLocalIP()

    // 尝试获取或分配节点ID
    const result = await db.query(`
      INSERT INTO node_registry (node_id, hostname, ip)
      SELECT COALESCE(
        (SELECT MIN(t1.node_id + 1) 
         FROM node_registry t1 
         LEFT JOIN node_registry t2 ON t1.node_id + 1 = t2.node_id
         WHERE t2.node_id IS NULL AND t1.node_id < 1023),
        0
      ), ?, ?
      ON DUPLICATE KEY UPDATE last_heartbeat = NOW()
    `, [hostname, ip])

    this.nodeId = result.insertId % 1024
    
    // 启动心跳
    this.startHeartbeat()
    
    return this.nodeId
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      await db.query(`
        UPDATE node_registry 
        SET last_heartbeat = NOW() 
        WHERE node_id = ?
      `, [this.nodeId])
    }, 30000) // 30秒心跳
  }

  private getLocalIP(): string {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address
        }
      }
    }
    return '127.0.0.1'
  }

  async unregister() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    await db.query('DELETE FROM node_registry WHERE node_id = ?', [this.nodeId])
  }
}

// 使用
const nodeManager = new NodeManager()
const nodeId = await nodeManager.register()
const id = generateId({ id: nodeId })
```

### 方案四：Redis 分布式锁分配

```typescript
// redis-node-manager.ts
import { generateId } from 'snowflake.io'
import Redis from 'ioredis'

class RedisNodeManager {
  private redis: Redis
  private nodeId: number | null = null
  private lockKey: string = 'snowflake:node:allocation'

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl)
  }

  async allocateNodeId(): Promise<number> {
    const script = `
      for i = 0, 1023 do
        if redis.call('HGET', KEYS[1], i) == false then
          redis.call('HSET', KEYS[1], i, ARGV[1])
          redis.call('HSET', KEYS[2], ARGV[1], i)
          return i
        end
      end
      return -1
    `

    const instanceId = `${os.hostname()}:${process.pid}`
    const result = await this.redis.eval(
      script, 
      2, 
      this.lockKey,
      `${this.lockKey}:reverse`,
      instanceId
    )

    if (result === -1) {
      throw new Error('No available node ID')
    }

    this.nodeId = result as number
    return this.nodeId
  }

  async releaseNodeId() {
    if (this.nodeId !== null) {
      const instanceId = `${os.hostname()}:${process.pid}`
      await this.redis.hdel(this.lockKey, this.nodeId.toString())
      await this.redis.hdel(`${this.lockKey}:reverse`, instanceId)
    }
  }
}

// 使用
const nodeManager = new RedisNodeManager()
const nodeId = await nodeManager.allocateNodeId()
const id = generateId({ id: nodeId })

// 优雅关闭
process.on('SIGTERM', async () => {
  await nodeManager.releaseNodeId()
  process.exit(0)
})
```

### 多数据中心架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        全球部署架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  北京 DC     │  │  上海 DC     │  │  新加坡 DC   │          │
│  │ datacenter=1 │  │ datacenter=2 │  │ datacenter=8 │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ worker 0-31  │  │ worker 0-31  │  │ worker 0-31  │          │
│  │ nodeId 32-63 │  │ nodeId 64-95 │  │ nodeId 256-  │          │
│  │              │  │              │  │ 287          │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  nodeId = (datacenter << 5) | worker                            │
│  例: 北京 worker 5 = (1 << 5) | 5 = 37                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// 多数据中心配置
const DATACENTER_CONFIG = {
  beijing: { code: 1, timezone: 'Asia/Shanghai' },
  shanghai: { code: 2, timezone: 'Asia/Shanghai' },
  singapore: { code: 8, timezone: 'Asia/Singapore' },
  frankfurt: { code: 9, timezone: 'Europe/Berlin' },
  virginia: { code: 10, timezone: 'America/New_York' }
}

// 从环境变量获取数据中心
const datacenter = DATACENTER_CONFIG[process.env.DATACENTER || 'beijing'].code
const worker = parseInt(process.env.WORKER_ID || '0')

// 生成ID
const id = generateId({ datacenter, worker })

// 解析时获取数据中心
const parts = parseId(id)
const dc = parts.nodeId >> 5  // datacenter
const wk = parts.nodeId & 0x1f  // worker
```

### 监控与告警

```typescript
// monitoring.ts
import { Snowflake } from 'snowflake.io'

class SnowflakeMonitor {
  private lastTotal = 0
  private lastTime = Date.now()

  start() {
    setInterval(() => {
      const stats = Snowflake.getStats({ id: this.getNodeId() })
      
      // 计算生成速率
      const now = Date.now()
      const rate = (stats.totalGenerated - this.lastTotal) / ((now - this.lastTime) / 1000)
      this.lastTotal = stats.totalGenerated
      this.lastTime = now

      // 时钟回拨告警
      if (stats.clockBackwardsCount > 0) {
        this.sendAlert('clock_skew', {
          nodeId: stats.nodeId,
          count: stats.clockBackwardsCount,
          severity: 'high'
        })
      }

      // 序列号接近耗尽告警
      if (stats.sequence > stats.maxSequence * 0.9) {
        this.sendAlert('sequence_high', {
          nodeId: stats.nodeId,
          sequence: stats.sequence,
          severity: 'medium'
        })
      }

      // 记录指标
      this.recordMetrics({
        nodeId: stats.nodeId,
        totalGenerated: stats.totalGenerated,
        ratePerSecond: rate,
        clockBackwardsCount: stats.clockBackwardsCount
      })
    }, 60000)
  }

  private getNodeId(): number {
    return parseInt(process.env.NODE_ID || '0')
  }

  private sendAlert(type: string, data: any) {
    // 发送到监控系统
    console.error(`[ALERT] ${type}:`, data)
  }

  private recordMetrics(metrics: any) {
    // 记录到 Prometheus / Grafana 等
    console.log('[METRICS]', metrics)
  }
}
```

### Docker Compose 示例

```yaml
# docker-compose.yaml
version: '3.8'
services:
  app-1:
    image: my-app:latest
    environment:
      - NODE_ID=1
      - DATACENTER=1
    depends_on:
      - redis

  app-2:
    image: my-app:latest
    environment:
      - NODE_ID=2
      - DATACENTER=1
    depends_on:
      - redis

  app-3:
    image: my-app:latest
    environment:
      - NODE_ID=3
      - DATACENTER=1
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
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

```
时间线:  t1 → t2 → t3 → t2(回拨) → t4
ID生成:  ID1 ID2 ID3  ID4(可能重复!)
```

如果回拨后使用相同时间戳 + 相同节点ID，可能生成重复ID。

#### 三种策略的选择指南

```typescript
// 场景1: 金融交易系统 - 数据一致性优先
// 检测到回拨立即报错，由上层决定是否重试
generateId({ id: 1, clockSkewHandler: 'throw' })

// 场景2: 电商订单系统 - 平衡可用性和一致性
// 小幅回拨等待追上，大幅回拨报错
generateId({ 
  id: 1, 
  clockSkewHandler: 'wait', 
  maxClockSkewWait: 5000  // 5秒内等待
})

// 场景3: 日志系统 - 可用性优先
// 使用上次时间戳继续生成，牺牲严格有序性
generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

#### 监控时钟回拨

```typescript
// 定期检查统计信息
setInterval(() => {
  const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })
  if (stats.clockBackwardsCount > 0) {
    console.warn(`Clock backwards detected! Count: ${stats.clockBackwardsCount}`)
    // 发送告警到监控系统
    alertToMonitoring({
      type: 'clock_skew',
      count: stats.clockBackwardsCount,
      nodeId: stats.nodeId
    })
  }
}, 60000) // 每分钟检查
```

### Big Tech Solutions / 大厂解决方案

#### Twitter 原始方案

Twitter 作为雪花算法的发明者，采用以下架构：

```
┌─────────────────────────────────────────────────────┐
│                  ZooKeeper 集群                      │
│         (节点ID分配 + 时钟回拨检测)                   │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ Node 1  │    │ Node 2  │    │ Node 3  │
    │ ID: 1   │    │ ID: 2   │    │ ID: 3   │
    └─────────┘    └─────────┘    └─────────┘
```

**关键设计**：
- ZooKeeper 负责节点ID分配，保证唯一性
- 定期检查时钟偏差，超过阈值拒绝服务

#### 百度 UidGenerator

百度开源方案，针对雪花算法的改进：

```java
// 百度方案：时间戳使用秒而非毫秒
// 优势：更长的有效期（约34年 vs 69年）
// 劣势：每秒ID容量降低

| sign | delta seconds | worker node | sequence |
|  1   |     28 bits   |   22 bits   |  13 bits |
```

**特点**：
- 时间戳使用秒级，延长有效期
- Worker ID 22位，支持更多节点
- RingBuffer 预生成ID，提升性能

#### 美团 Leaf

美团 Leaf 提供两种模式：

```
Leaf-segment: 数据库号段模式
┌──────────┐    ┌──────────┐    ┌──────────┐
│  DB      │───▶│ Buffer   │───▶│ ID生成   │
│ step=1000│    │ [1-1000] │    │ 内存分配 │
└──────────┘    └──────────┘    └──────────┘

Leaf-snowflake: 雪花算法模式
┌──────────┐    ┌──────────┐
│ ZooKeeper│───▶│ WorkerID │
│ 注册中心  │    │  分配    │
└──────────┘    └──────────┘
```

**特点**：
- 双Buffer设计，避免数据库单点
- ZooKeeper 弱依赖，ZK挂掉仍可工作

#### Sony Sonyflake

Sony 的变体方案：

```go
| sign | time (39 bits) | sequence (8 bits) | machine (16 bits) |

时间精度: 10ms (而非1ms)
有效期: 约174年
每10ms最多: 256个ID
节点数: 最多65536个
```

**适用场景**：低频ID生成，长周期系统

### Production Tips / 生产环境技巧

#### 1. Epoch 选择策略

```typescript
// ❌ 错误：使用默认epoch，浪费位数
const id = generateId()  // epoch = 2020-01-01

// ✅ 正确：使用项目启动时间
const projectEpoch = new Date('2024-01-01').getTime()
const id = generateId({ epoch: projectEpoch })

// 计算：如果项目从2024年开始，到2093年才会溢出
// 时间戳范围：0 ~ 2^41 = 2199023255552 ms ≈ 69年
```

#### 2. 节点ID分配最佳实践

```typescript
// 方案A: 环境变量配置（推荐K8s）
const nodeId = parseInt(process.env.NODE_ID || '0')
generateId({ id: nodeId })

// 方案B: 数据库分配
async function allocateNodeId() {
  const result = await db.query(
    'INSERT INTO node_registry (hostname, ip) VALUES (?, ?) RETURNING id',
    [os.hostname(), getLocalIP()]
  )
  return result.id % 1024
}

// 方案C: 一致性哈希
function getNodeIdFromHash(key: string): number {
  const hash = crypto.createHash('md5').update(key).digest()
  return (hash[0] << 2 | hash[1] >> 6) % 1024
}
```

#### 3. 高并发场景优化

```typescript
// ❌ 错误：循环调用同步API
for (let i = 0; i < 10000; i++) {
  ids.push(generateId())  // 每次都有锁竞争
}

// ✅ 正确：使用批量API
const ids = generateIds(10000)  // 一次获取，无锁竞争

// ✅ 更好：异步并发
const ids = await generateIdsAsync(10000)
```

#### 4. ID 解析与追踪

```typescript
// 从ID反推生成时间和节点
function traceId(id: string) {
  const parts = parseId(id)
  return {
    generatedAt: new Date(parts.timestamp),
    datacenter: parts.nodeId >> 5,
    worker: parts.nodeId & 0x1f,
    sequence: parts.sequence,
    age: Date.now() - parts.timestamp  // ID年龄
  }
}

// 示例输出
traceId('824443173089710080')
// {
//   generatedAt: 2026-03-25T00:42:49.878Z,
//   datacenter: 1,
//   worker: 1,
//   sequence: 0,
//   age: 12345  // 毫秒
// }
```

#### 5. 容量规划

```typescript
// 计算系统容量
function calculateCapacity(nodes: number) {
  const idsPerMs = 4096  // 每毫秒每节点
  const idsPerSecond = idsPerMs * 1000 * nodes
  const idsPerDay = idsPerSecond * 86400
  const idsPerYear = idsPerDay * 365
  
  return {
    perSecond: idsPerSecond,
    perDay: idsPerDay,
    perYear: idsPerYear,
    formatted: {
      perSecond: formatNumber(idsPerSecond),
      perDay: formatNumber(idsPerDay),
      perYear: formatNumber(idsPerYear)
    }
  }
}

// 10个节点的容量
calculateCapacity(10)
// perSecond: 40,960,000
// perDay: 3,538,944,000,000
// perYear: 1,291,714,560,000,000
```

---

## ❓ FAQ / 常见问题

### Q1: 为什么使用 BigInt 而不是 Number？

**A**: JavaScript Number 类型最大安全整数是 `2^53 - 1 = 9007199254740991`，而雪花ID可能超过这个值（18-19位数字）。使用 BigInt 可以避免精度丢失。

```typescript
// Number 精度问题示例
const id = 824443173089710080
console.log(id === 824443173089710081)  // true! 精度丢失

// BigInt 无此问题
const idBigInt = 824443173089710080n
console.log(idBigInt === 824443173089710081n)  // false
```

### Q2: 时钟回拨时应该选择哪种策略？

**A**: 根据业务场景选择：

| 业务场景 | 推荐策略 | 理由 |
|----------|----------|------|
| 金融交易 | `throw` | 数据一致性优先 |
| 订单系统 | `wait` | 平衡可用性和一致性 |
| 日志系统 | `auto_adjust` | 可用性优先 |
| 消息队列 | `auto_adjust` | 允许轻微乱序 |

### Q3: 节点ID用完了怎么办？

**A**: 10位节点ID支持1024个节点，如果不够：

```typescript
// 方案1: 使用更少的时间戳位数，更多节点位数
// 需要自定义实现，牺牲有效期

// 方案2: 多层ID分配
// datacenter(5位) * worker(5位) * 实例序号(外部管理)

// 方案3: 动态分配 + 回收
// 节点下线后回收ID
```

### Q4: 如何保证跨数据中心的ID唯一性？

**A**: 使用 datacenter + worker 组合：

```typescript
// 数据中心编码规则
// 0-7: 国内数据中心
// 8-15: 海外数据中心
// 16-31: 预留

// 北京机房
generateId({ datacenter: 1, worker: 1 })
generateId({ datacenter: 1, worker: 2 })

// 新加坡机房
generateId({ datacenter: 8, worker: 1 })
```

### Q5: ID可以排序吗？

**A**: 雪花ID是**大致有序**的：

```
✅ 按时间大致递增（可用于时间范围查询）
✅ 同一节点内严格递增
⚠️ 跨节点可能乱序（不同节点同一毫秒生成的ID）
```

```typescript
// 按ID排序 ≈ 按时间排序
const ids = generateIds(100)
const sorted = [...ids].sort()
// sorted 大致按生成时间排序
```

### Q6: 如何处理ID耗尽？

**A**: 每毫秒4096个ID，单节点每秒可生成409.6万个ID。如果不够：

```typescript
// 方案1: 增加节点数（推荐）
// 10个节点 = 每秒4096万个ID

// 方案2: 使用异步API批量预生成
const preGeneratedIds = await generateIdsAsync(100000)
// 存入队列供后续使用

// 方案3: 降级方案
// 序列号溢出时，等待下一毫秒
```

### Q7: 如何在数据库中存储雪花ID？

**A**: 推荐使用 `VARCHAR(20)` 或 `BIGINT UNSIGNED`：

#### 方案1: VARCHAR(20) 字符串存储（推荐）

```sql
-- MySQL
CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY,
  created_at TIMESTAMP
)
```

```typescript
// 直接使用字符串，无需转换
import { generateId } from 'snowflake.io'

const id = generateId()  // 返回字符串 '824443173089710080'

// 插入数据库
await db.query('INSERT INTO orders (id) VALUES (?)', [id])
```

**优点**：
- 无精度问题，兼容所有数据库驱动
- JSON 序列化安全
- 调试友好

#### 方案2: BIGINT UNSIGNED 数值存储

```sql
-- MySQL (BIGINT UNSIGNED 范围: 0 ~ 18446744073709551615)
CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY,
  created_at TIMESTAMP
)
```

```typescript
// 方式A: 使用字符串让数据库转换
const id = generateId()
await db.query('INSERT INTO orders (id) VALUES (?)', [id])  // 驱动自动转换

// 方式B: 使用 BigInt（需要驱动支持）
const idBigInt = BigInt(generateId())
await db.query('INSERT INTO orders (id) VALUES (?)', [idBigInt])

// ⚠️ 注意：查询返回时需要处理
const rows = await db.query('SELECT id FROM orders')
// MySQL2 返回 BigInt，需要转换
const idString = rows[0].id.toString()
```

**注意**：
- `mysql2` 驱动返回 `BIGINT` 时会转为 `BigInt` 类型
- `pg` (PostgreSQL) 需要配置 `pg.types.setTypeParser`
- 部分 ORM（如 Prisma）需要配置 `@db.BigInt`

#### 方案对比

| 方案 | 存储空间 | 索引效率 | 兼容性 | 推荐场景 |
|------|----------|----------|--------|----------|
| VARCHAR(20) | 20字节 | 高 | ✅ 最佳 | 通用场景 |
| BIGINT UNSIGNED | 8字节 | 更高 | ⚠️ 需配置 | 存储敏感场景 |

#### JSON 序列化注意事项

```typescript
// ⚠️ BigInt 不能直接 JSON 序列化
const id = BigInt('824443173089710080')
JSON.stringify({ id })  // TypeError: Do not know how to serialize a BigInt

// ✅ 解决方案1: 转为字符串
JSON.stringify({ id: id.toString() })

// ✅ 解决方案2: 使用 generateId() 直接返回字符串
const id = generateId()  // 已经是字符串
JSON.stringify({ id })   // 正常工作
```

### Q8: 雪花ID vs UUID 如何选择？

| 特性 | 雪花ID | UUID |
|------|--------|------|
| 长度 | 18-19位 | 36字符 |
| 有序性 | 大致有序 | 无序 |
| 索引效率 | 高 | 低 |
| 可解析 | 时间+节点 | 无 |
| 分布式 | 需要协调 | 无需协调 |
| 适用场景 | 数据库主键 | 临时标识 |

```typescript
// 雪花ID更适合数据库主键
// UUID更适合前端临时标识或无中心化场景
```

---

## Performance / 性能

```
Benchmark (MacBook Pro M1):
- Generate 10,000 IDs: 2-3ms
- Per ID: 0.0002ms
- Throughput: 3,000,000+ IDs/second
- Memory: < 1MB for 10,000 IDs
```

## Migration from v2.x / 从v2.x迁移

```typescript
// v2.x
import { generateSnowflakeId } from 'snowflake.io'

// v3.0
import { generateId } from 'snowflake.io'
```

## License / 许可证

MIT
