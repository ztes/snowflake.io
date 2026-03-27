# Snowflake.io / 雪花 ID 生成器 v4.0

![npm](https://img.shields.io/npm/v/snowflake.io)
![license](https://img.shields.io/npm/l/snowflake.io)

高性能分布式雪花 ID 生成器，面向 Node.js 生产环境，适用于 NestJS、PM2、Node.js cluster、多机部署等场景。  
Production-oriented Snowflake ID generator for Node.js. Full English documentation: [README.EN.md](./README.EN.md)

[英文文档 / English Docs](./README.EN.md)

## 特性

- 🚀 **High Performance**：单机可达到 5,000,000+ IDs/second
- 🔒 **Thread Safe**：内置并发保护机制，适用于高并发场景
- ⚡ **Async Support**：提供完整异步 API，适合高并发服务
- 🌐 **Cluster Ready**：支持显式节点身份配置，适合生产部署
- 🛡️ **Clock Skew Handling**：支持 `throw` / `wait` / `auto_adjust` 三种回拨策略
- 📊 **Monitoring**：内置统计信息，便于监控与告警
- 💎 **BigInt Precision**：避免 JavaScript Number 精度问题
- 🧭 **Node Utilities**：内置节点 ID 编码 / 解码辅助方法

## 安装

```bash
pnpm add snowflake.io
```

## 快速开始

```typescript
import { composeNodeId, generateId, generateIds, parseId, isValidId } from 'snowflake.io'

// 生产环境推荐显式指定节点身份
const nodeId = composeNodeId(1, 1)
const id = generateId({ id: nodeId })

// 批量生成
const ids = generateIds(100, { datacenter: 1, worker: 2 })

// 解析 ID
const parts = parseId(id, { datacenter: 1, worker: 1 })

// 校验 ID
isValidId(id) // true
```

## 生产优先

从 `v4.0` 开始，`snowflake.io` 默认采用生产安全策略：

- 必须显式传入 `id` 或 `datacenter + worker`
- 不再默认自动分配节点 ID
- 节点参数越界时直接报错，不再静默截断

如果你只是在本地开发或测试环境调试，可以显式开启不安全自动分配：

```typescript
generateId({ allowUnsafeAutoNodeId: true })
```

不要在生产环境使用 `allowUnsafeAutoNodeId`。

## ID 结构

```
| 符号位(1) | 时间戳(41) | 节点ID(10) | 序列号(12) |
```

| 组成部分 | 位数 | 范围 | 说明 |
|----------|------|------|------|
| 符号位 | 1 | 0 | 固定为 0 |
| 时间戳 | 41 | 约 69 年 | 相对 epoch 的毫秒差 |
| 节点 ID | 10 | 0-1023 | 最多 1024 个节点 |
| 序列号 | 12 | 0-4095 | 每毫秒 4096 个 ID |

## 配置项

| 配置项 | 类型 | 默认值 / 范围 | 说明 |
|--------|------|---------------|------|
| `id` | `number \| bigint` | `0-1023` | 直接指定 10 位节点 ID，会覆盖 `datacenter/worker` |
| `datacenter` | `number` | `0-31` | 节点 ID 高 5 位 |
| `worker` | `number` | `0-31` | 节点 ID 低 5 位 |
| `allowUnsafeAutoNodeId` | `boolean` | `false` | 仅用于开发 / 测试，生产环境不建议使用 |
| `epoch` | `number` | `2020-01-01 UTC` | 自定义纪元时间戳（毫秒） |
| `clockSkewHandler` | `'throw' \| 'wait' \| 'auto_adjust'` | `'wait'` | 时钟回拨处理策略 |
| `maxClockSkewWait` | `number` | `5000` | `wait` 模式下的最大等待时间 |

## API 概览

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `generateId(options?)` | `string` | 同步生成单个 ID |
| `generateIdAsync(options?)` | `Promise<string>` | 异步生成单个 ID |
| `generateIds(count, options?)` | `string[]` | 同步批量生成 ID |
| `generateIdsAsync(count, options?)` | `Promise<string[]>` | 异步批量生成 ID |
| `parseId(id, options?)` | `SnowflakeDeconstructed` | 解析 ID 结构 |
| `isValidId(id, options?)` | `boolean` | 校验 ID 有效性 |
| `composeNodeId(datacenter, worker)` | `number` | 将 `datacenter + worker` 编码为节点 ID |
| `decomposeNodeId(nodeId)` | `SnowflakeNodeInfo` | 将节点 ID 解析回 `datacenter + worker` |

## 常用示例

### 1. 生成单个 ID

```typescript
import { generateId } from 'snowflake.io'

const id = generateId({ datacenter: 1, worker: 5 })
```

### 2. 批量生成

```typescript
import { generateIds } from 'snowflake.io'

const ids = generateIds(1000, { datacenter: 1, worker: 1 })
```

### 3. 解析 ID

```typescript
import { parseId } from 'snowflake.io'

const parts = parseId('824443173089710080', { datacenter: 1, worker: 1 })

console.log(parts)
// {
//   timestamp: 1774399369878,
//   nodeId: 33,
//   sequence: 0,
//   epoch: 1577836800000
// }
```

### 4. 类方式调用

```typescript
import { Snowflake } from 'snowflake.io'

const id = Snowflake.generateId({ id: 1 })
const ids = Snowflake.generateIds(100, { id: 1 })
const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })
```

## 部署指南

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

规则：

- `datacenter` 必须在不同机器之间唯一
- `worker` 必须在同一台机器上唯一
- 单机最多 `32` 个 worker

### 多机 / 多进程推荐方案

- 稳定机器布局：每台机器分配一个 `datacenter`，每个进程分配一个 `worker`
- 弹性容器 / Kubernetes：通过 Redis / 数据库 / etcd 中心化分配 10 位 `id`

### 时钟回拨策略建议

电商、支付、订单等核心系统推荐：

```typescript
{
  clockSkewHandler: 'wait',
  maxClockSkewWait: 50,
}
```

建议：

- `throw`：最保守，检测到回拨立即报错
- `wait`：生产推荐默认值
- `auto_adjust`：可用性更强，但会削弱严格时间语义

对于核心业务系统，除非你完全理解这个权衡，否则不要使用 `auto_adjust`。

### 生产检查清单

- 显式配置 `id` 或 `datacenter + worker`
- 所有节点使用相同的 `epoch`
- 所有机器开启 NTP / Chrony 时钟同步
- 监控 `clockBackwardsCount`
- 生产环境不要使用 `allowUnsafeAutoNodeId`
- JSON / HTTP 返回统一使用字符串 ID

## 时钟回拨策略

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| `throw` | 立即抛错 | 金融、强一致性环境 |
| `wait` | 等待时钟追上 | 通用生产环境 |
| `auto_adjust` | 使用上次时间戳继续生成 | 可用性优先场景 |

```typescript
generateId({ id: 1, clockSkewHandler: 'throw' })
generateId({ id: 1, clockSkewHandler: 'wait', maxClockSkewWait: 5000 })
generateId({ id: 1, clockSkewHandler: 'auto_adjust' })
```

## 集群部署建议

### 核心原则

```
1. 节点 ID 唯一
2. 所有节点时钟同步
3. 所有节点使用相同 epoch
```

### Kubernetes 环境变量注入

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

### 数据库分配节点 ID

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

### Redis 分配节点 ID

```typescript
import Redis from 'ioredis'

// 典型思路：启动时抢占 nodeId，关闭时释放
```

## 监控与告警

```typescript
import { Snowflake } from 'snowflake.io'

setInterval(() => {
  const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })

  if (stats.clockBackwardsCount > 0) {
    console.warn('检测到时钟回拨', stats.clockBackwardsCount)
  }

  console.log('总生成数量:', stats.totalGenerated)
}, 60000)
```

建议重点监控：

- `clockBackwardsCount`
- `totalGenerated`
- `sequence`
- `lastTimestamp`

## 常见问题

### 为什么使用 BigInt 而不是 Number？

JavaScript Number 最大安全整数是 `2^53 - 1`，而雪花 ID 很容易超过这个范围。使用 BigInt 可以避免精度丢失。

### 雪花 ID 可以排序吗？

可以。雪花 ID 是大致有序的：

- 按时间大致递增
- 同一节点内严格递增
- 跨节点同一毫秒内可能轻微乱序

### 数据库里推荐怎么存？

推荐：

- 通用场景：`VARCHAR(20)`
- 存储敏感场景：`BIGINT`

如果使用 `BIGINT`，需要注意驱动和 ORM 对 BigInt 的处理。

### 节点 ID 不够用了怎么办？

可以考虑：

- 增加外部分配层
- 做多层节点管理
- 按业务拆分不同 ID 系统

## 性能

```text
基准环境（MacBook Pro M1）:
- 生成 10,000 个 ID: 2-3ms
- 单个 ID 平均耗时: 0.0002ms
- 吞吐量: 3,000,000+ IDs/second
- 内存占用: 10,000 个 ID 小于 1MB
```

## 从 v2.x 迁移

```typescript
// v2.x
import { generateSnowflakeId } from 'snowflake.io'

// v4.0
import { generateId } from 'snowflake.io'
```

## 许可证

MIT
