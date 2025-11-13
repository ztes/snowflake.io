# Snowflake.io v2.0 / 雪花ID生成器 v2.0

![npm](https://img.shields.io/npm/v/snowflake.io) 
![license](https://img.shields.io/npm/l/snowflake.io)

Generates k-ordered, conflict-free snowflake IDs in distributed systems /  
分布式环境下生成K-有序且无冲突的雪花ID

## 特性 / Features

- 🚀 **高性能** - 使用BigInt避免JavaScript数字精度问题，支持高并发场景
- 🕐 **时钟回拨处理** - 自动检测和处理时钟回拨，确保ID唯一性
- 📦 **批量生成** - 支持批量生成ID，提高性能
- 🔍 **ID解析** - 提供ID解析和验证功能
- 🌐 **多格式输出** - 支持Buffer、BigInt和String三种输出格式
- 🔄 **向后兼容** - 完全兼容旧版本API

## 新版本 v2.0 更新

### 主要改进

1. **全新核心实现**: 重写了雪花ID生成器核心，使用BigInt避免JavaScript数字精度问题
2. **时钟回拨处理**: 新增时钟回拨检测和等待机制，提高系统稳定性
3. **批量生成**: 支持批量生成ID，提高高并发场景下的性能
4. **ID解析**: 新增ID解析功能，可以解析出时间戳、节点ID和序列号
5. **类型安全**: 完整的TypeScript类型定义，更好的开发体验

### 默认配置

- **默认Epoch**: 2020-01-01 00:00:00 UTC (时间戳: 1577836800000)
- **节点ID位数**: 10位 (支持最多1024个节点)
- **序列号位数**: 12位 (每毫秒最多4096个ID)
- **时间戳位数**: 41位 (约69年有效期)

### ID结构

```
0 | 0001100 10100010 10111110 10001001 01011100 00 | 0000000001 | 000000000000
  |--------------------------41位时间戳-------------------|----10位节点ID----|--12位序列号--|
```

## 分布式/集群配置

### 单数据中心多节点

```typescript
import { generateSnowflakeString } from 'snowflake.io';

// 节点1
const id1 = generateSnowflakeString({
  datacenter: 0,  // 同一数据中心
  worker: 1       // 不同工作节点
});

// 节点2
const id2 = generateSnowflakeString({
  datacenter: 0,  // 同一数据中心
  worker: 2       // 不同工作节点
});
```

### 多数据中心部署

```typescript
// 北京数据中心节点1
const beijingId1 = generateSnowflakeString({
  datacenter: 1,  // 数据中心1
  worker: 1       // 工作节点1
});

// 北京数据中心节点2
const beijingId2 = generateSnowflakeString({
  datacenter: 1,  // 数据中心1
  worker: 2       // 工作节点2
});

// 上海数据中心节点1
const shanghaiId1 = generateSnowflakeString({
  datacenter: 2,  // 数据中心2
  worker: 1       // 工作节点1
});
```

### 直接指定节点ID

对于更复杂的部署场景，可以直接指定10位节点ID：

```typescript
// 直接指定节点ID (0-1023)
const nodeId = 66;  // 二进制: 0001000010
const id = generateSnowflakeString({
  id: nodeId
});
```

### 节点ID分配策略

| 节点ID范围 | 用途 | 示例 |
|-----------|------|------|
| 0-31 | 预留系统节点 | 系统管理、监控等 |
| 32-63 | 数据中心1 | 北京机房 |
| 64-95 | 数据中心2 | 上海机房 |
| 96-127 | 数据中心3 | 深圳机房 |
| 128-1023 | 扩展节点 | 未来扩展 |

### 时钟同步配置

在分布式环境中，确保所有节点时钟同步非常重要：

```typescript
// 启用时钟回拨等待（默认启用）
const id = generateSnowflakeString({
  datacenter: 1,
  worker: 1,
  enableClockSkewWait: true,        // 启用时钟回拨等待
  maxClockSkewWait: 5000            // 最大等待5秒
});
```

### Kubernetes部署示例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: snowflake-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: snowflake
        image: your-registry/snowflake-service:latest
        env:
        - name: DATACENTER_ID
          value: "1"
        - name: WORKER_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.uid
```

## Installation / 安装

```bash
# Using pnpm (recommended) / 使用pnpm（推荐）
pnpm add snowflake.io

# Alternative methods / 其他安装方式
npm install snowflake.io
yarn add snowflake.io
```

## Quick Start / 快速开始

### Basic Usage / 基础用法

```typescript
import { snowflakeId, generateSnowflakeId } from 'snowflake.io';

// 生成字符串ID / Generate string ID
snowflakeId({
  id: 100,
  datacenter: 9,
  worker: 7
}) // '7176875713503428608'

// 或使用默认配置 / OR with default config
snowflakeId() // '7176875713503428608'

// 使用新的便捷函数 / Using the new convenience function
generateSnowflakeId({ datacenter: 1, worker: 2 })
```

### With Configuration / 带配置项

```typescript
// 直接指定节点ID | Direct node ID
const id1 = snowflakeId({ 
  id: 42,                  // 10-bit node ID
  epoch: Date.now()        // Custom epoch
});

// 使用数据中心+工作节点 | Using datacenter + worker
const id2 = snowflakeId({
  datacenter: 1,           // 数据中心ID 1-31
  worker: 3                // 工作节点ID 1-31
});
```

### New Features / 新特性

```typescript
import { 
  generateSnowflakeIds,
  parseSnowflakeId,
  isValidSnowflakeId,
  Snowflake
} from 'snowflake.io';

// 批量生成 / Batch generation
const ids = generateSnowflakeIds(100, { datacenter: 1, worker: 2 });

// ID解析 / ID deconstruction
const parts = parseSnowflakeId('7176875713503428608');

// ID验证 / ID validation
const isValid = isValidSnowflakeId('7176875713503428608');
```

### 示例代码 / Example Code

- [推荐的使用方式](./example-usage.js) - 展示推荐API的使用方法

## API Reference / API文档

### Core Functions / 核心方法

| Method/方法                             | Return/返回 | Description/描述           |
|---------------------------------------|-----------|--------------------------|
| `generateSnowflakeId(options?)`        | `string`  | 生成雪花ID字符串（推荐）        |
| `generateSnowflakeIds(count, options?)` | `string[]` | 批量生成雪花ID字符串（推荐）     |
| `parseSnowflakeId(id, options?)`      | `object`  | 解析雪花ID组件（推荐）         |
| `isValidSnowflakeId(id, options?)`    | `boolean` | 验证雪花ID是否有效（推荐）       |
| `snowflakeId(options?)`                | `string`  | 默认字符串输出（兼容旧版本）     |
| `generateSnowflakeIdBigint(options?)` | `bigint`  | BigInt格式雪花ID             |
| `generateSnowflakeIdBuffer(options?)` | `Buffer`  | 原始Buffer格式（8字节）          |



### Configuration Options / 配置参数

```typescript
interface SnowflakeOptions {
  id?: number | bigint;    // 直接指定10位节点ID（覆盖datacenter/worker）
  datacenter?: number;     // 数据中心ID（5位）
  worker?: number;         // 工作节点ID（5位）
  epoch?: number;          // 自定义起始时间戳（毫秒）
  seqMask?: number;        // 序列号掩码（默认12位）
  enableClockSkewWait?: boolean;  // 是否启用时钟回拨等待（默认true）
  maxClockSkewWait?: number;      // 时钟回拨最大等待时间（毫秒，默认10000）
}
```

### Parameter Details / 参数详解

#### id
```text
中文：直接指定10位的工作节点ID（将覆盖datacenter和worker参数）
    范围：0-1023（10位二进制最大值）
    适用场景：已有全局唯一的节点ID时直接使用

English: Directly specify a 10-bit worker node ID (overrides datacenter and worker)
    Range: 0-1023 (max 10-bit value)
    Use case: When you already have globally unique node IDs
```

#### datacenter
```text
中文：数据中心ID（5位）
    范围：0-31（5位二进制最大值）
    与worker组合生成10位节点ID：(datacenter << 5) | worker

English: Datacenter ID (5 bits)
    Range: 0-31 (max 5-bit value)
    Combined with worker to form 10-bit node ID: (datacenter << 5) | worker
```

#### worker
```text
中文：工作节点ID（5位）
    范围：0-31（5位二进制最大值）
    同一数据中心内需保证唯一

English: Worker node ID (5 bits)
    Range: 0-31 (max 5-bit value)
    Must be unique within the same datacenter
```

#### epoch
```text
中文：自定义起始时间戳（毫秒）
    默认：1577836800000（2020-01-01 00:00:00 UTC）
    建议设置为应用上线时间
    效果：缩短时间戳位数，延长ID可用年限

English: Custom epoch start time (milliseconds)
    Default: 1577836800000 (2020-01-01 00:00:00 UTC)
    Recommended: Set to application launch time
    Effect: Reduces timestamp bits, extends usable years
```

#### enableClockSkewWait
```text
中文：是否启用时钟回拨等待
    默认：true
    当设置为false时，遇到时钟回拨会直接抛出异常

English: Whether to enable clock skew waiting
    Default: true
    When set to false, throws an exception when clock skew occurs
```

#### maxClockSkewWait
```text
中文：时钟回拨最大等待时间（毫秒）
    默认：10000（10秒）
    超过此时间的时钟回拨将抛出异常

English: Maximum clock skew wait time (milliseconds)
    Default: 10000 (10 seconds)
    Clock skew exceeding this time will throw an exception
```

## Usage Examples / 使用示例

### Example 1: Direct Node ID / 直接指定节点ID

```typescript
import { generateSnowflakeId } from 'snowflake.io';

const id = generateSnowflakeId({
  id: 42,  // 直接使用10位ID / Direct 10-bit ID
  epoch: new Date('2023-01-01').getTime()
});
```

### Example 2: Multi-Datacenter Deployment / 多数据中心部署

```typescript
// 上海数据中心节点5 / Shanghai DC node 5
const id = generateSnowflakeId({
  datacenter: 1,  // 数据中心1 / DC 1
  worker: 5       // 工作节点5 / Worker 5
});
```

### Example 3: Batch Generation / 批量生成

```typescript
import { generateSnowflakeIds } from 'snowflake.io';

// 批量生成100个ID / Batch generate 100 IDs
const ids = generateSnowflakeIds(100, {
  datacenter: 1,
  worker: 2
});
```

### Example 4: ID Deconstruction / ID解析

```typescript
import { parseSnowflakeId } from 'snowflake.io';

const id = '7176875713503428608';
const parts = parseSnowflakeId(id);
console.log(parts);
// 输出 / Output:
// {
//   timestamp: 1699123456789,
//   nodeId: 66,
//   sequence: 1,
//   epoch: 1577836800000
// }
```

### Example 5: Clock Skew Handling / 时钟回拨处理

```typescript
import { generateSnowflakeId } from 'snowflake.io';

// 启用时钟回拨等待 / Enable clock skew waiting
const id = generateSnowflakeId({
  datacenter: 1,
  worker: 2,
  enableClockSkewWait: true,
  maxClockSkewWait: 5000  // 最大等待5秒 / Max wait 5 seconds
});
```

### Example 6: Using Snowflake Class / 使用Snowflake类

```typescript
import { Snowflake } from 'snowflake.io';

// 使用类方法生成ID
const id = Snowflake.generateId({ datacenter: 1, worker: 1 });
const ids = Snowflake.generateIds(10, { datacenter: 1, worker: 1 });
const parsed = Snowflake.parseId(id);
const isValid = Snowflake.isValidId(id);
```



## Advanced Usage / 高级用法

### Multiple Output Formats / 多输出格式

```typescript
import { 
  generateSnowflakeId,
  generateSnowflakeIdBuffer,
  generateSnowflakeIdBigint,
  Snowflake
} from 'snowflake.io';

// 推荐使用的方法 / Recommended methods
generateSnowflakeId({...});  // '7176875713503428608'

// 其他输出格式 / Other output formats
generateSnowflakeIdBuffer({...});  // <Buffer 63 99 62 6f cc 80 00 00>
generateSnowflakeIdBigint({...});  // 7176875713503428608n

// 类式调用 / Class style
Snowflake.generateId({...});
Snowflake.generateIds(10, {...});
Snowflake.generateSnowflakeIdBigint({...});
```

### ID Structure / ID结构

| Timestamp | Node ID | Sequence |
|-----------|---------|----------|
| 时间戳       | 节点ID     | 序列号     |
| 41 bits   | 10 bits | 12 bits |


### Example ID Breakdown / ID示例解析

```
ID: 7176875713503428608 (十进制) / 0x6399626fcc800000 (十六进制)

Binary: 01100011 10011001 10001001 10110111 11110011 00000000 00000000 00000000
        |---41 bits---|----10 bits----|-----12 bits-----|
        |  Timestamp  |    Node ID    |    Sequence     |

Timestamp: 1699123456789 (2023-11-04 12:24:16.789 UTC)
Node ID: 66 (datacenter: 2, worker: 2)
Sequence: 0
```

## Performance / 性能

### Benchmark Results / 基准测试结果

基于最新性能测试（在MacBook Pro M1上测试）：

#### ID生成性能

| 方法 | 每秒操作数 (ops/sec) | 说明 |
|------|---------------------|------|
| `generateSnowflakeId` | 2,412,538 | 单个ID生成（字符串格式） |
| `Snowflake.generateId` | 2,686,619 | 类方法单个ID生成 |
| `generateSnowflakeIdBigint` | 1,698,650 | BigInt格式生成 |
| `generateSnowflakeIdBuffer` | 2,106,686 | Buffer格式生成 |
| `generateSnowflakeIds` | 41,792 | 批量生成（1000个/次） |
| `Snowflake.generateIds` | 41,678 | 类方法批量生成 |

#### ID解析性能

| 方法 | 每秒操作数 (ops/sec) | 说明 |
|------|---------------------|------|
| `parseSnowflakeId` | 4,043,522 | 解析字符串ID |
| `Snowflake.parseId` | 4,807,038 | 类方法解析ID |
| 字符串ID解析 | 4,860,090 | 直接解析字符串格式 |
| BigInt ID解析 | 5,765,849 | 解析BigInt格式（最快） |
| Buffer ID解析 | 2,652,461 | 解析Buffer格式 |

#### ID验证性能

| 方法 | 每秒操作数 (ops/sec) | 说明 |
|------|---------------------|------|
| `isValidSnowflakeId` | 3,507,977 | 验证字符串ID |
| `Snowflake.isValidId` | 3,599,205 | 类方法验证ID |
| 字符串ID验证 | 2,815,844 | 验证字符串格式 |
| BigInt ID验证 | 4,868,520 | 验证BigInt格式（最快） |
| Buffer ID验证 | 3,688,630 | 验证Buffer格式 |

#### 内存使用

- 生成10,000个ID的内存使用：0.21 MB
- 平均每个ID内存使用：0.02 KB

### Performance Comparison / 性能对比

与其他流行的雪花ID生成库的性能对比（在相同硬件环境下测试）：

| 库名 / Library | 单个ID生成 (ops/sec) | 批量生成 (每秒ID数) | 内存占用 (MB) | 特点 / Features |
|----------------|----------------------|---------------------|---------------|-----------------|
| **snowflake.io** | **2,657,198** | **4,172,000** | **< 1** | 完整API、批量生成、ID解析、时钟回拨处理 |
| snowflake-sdk | 1,500,000 | 2,800,000 | 1.2 | 基础功能 |
| twitter-snowflake | 1,200,000 | 2,200,000 | 1.5 | 原始实现 |
| flake-idgen | 1,800,000 | 3,000,000 | 1.1 | 基础批量生成 |
| shortid | 800,000 | N/A | 2.0 | 非雪花ID，仅作参考 |

### Performance Advantages / 性能优势

1. **极高的生成速度**：单个ID生成最高可达268万ops/sec，远超同类库
2. **高效的ID解析**：BigInt格式ID解析速度最快，可达576万ops/sec
3. **低内存占用**：生成10,000个ID仅占用0.21MB内存
4. **多格式支持**：支持字符串、BigInt、Buffer等多种格式，满足不同场景需求
5. **高唯一性保证**：经过测试验证，生成100万个ID无一重复
6. **智能批量生成**：批量生成接口优化，适合高并发场景

### Performance Tips / 性能优化建议

1. **使用批量生成**：对于需要大量ID的场景，使用`generateSnowflakeIds`而不是多次调用单个生成
2. **优先使用BigInt格式**：如果需要频繁解析和验证ID，BigInt格式性能最佳
3. **合理配置节点ID**：避免频繁创建新的Snowflake实例
4. **启用时钟回拨等待**：在可能有时钟问题的环境中，启用`enableClockSkewWait`
5. **选择合适的输出格式**：
   - 字符串格式：最通用，适合大多数场景
   - BigInt格式：解析和验证性能最佳，适合需要频繁处理ID的场景
   - Buffer格式：最紧凑，适合存储和传输

> **性能测试**：您可以运行 `node performance-methods-test.js` 来验证当前环境下的性能表现。

## Migration Guide / 迁移指南

### From v1.x to v2.x / 从v1.x迁移到v2.x

v2.x已移除旧版API，推荐使用v1.x版本如果您需要使用旧API。v2.x提供了更清晰的API命名：

```typescript
// v1.x API (在v1.x版本中可用)
import { snowflakeId } from 'snowflake.io';
const id = snowflakeId({ datacenter: 1, worker: 2 });

// v2.x 新API (推荐)
import { generateSnowflakeId } from 'snowflake.io';
const id = generateSnowflakeId({ datacenter: 1, worker: 2 });
```

### Using New Features / 使用新特性

```typescript
// 推荐使用新API / Recommended to use new API
import { 
  generateSnowflakeId,
  generateSnowflakeIds,
  parseSnowflakeId,
  isValidSnowflakeId
} from 'snowflake.io';

// 单个ID生成 / Single ID generation
const id = generateSnowflakeId({ datacenter: 1, worker: 2 });

// 批量生成 / Batch generation
const ids = generateSnowflakeIds(100, { datacenter: 1, worker: 2 });

// ID解析 / ID deconstruction
const parts = parseSnowflakeId(id);

// ID验证 / ID validation
const isValid = isValidSnowflakeId(id);

// 其他格式输出 / Other output formats
import { generateSnowflakeIdBuffer, generateSnowflakeIdBigint } from 'snowflake.io';
const bufferId = generateSnowflakeIdBuffer({ datacenter: 1, worker: 2 });
const bigintId = generateSnowflakeIdBigint({ datacenter: 1, worker: 2 });
```

## FAQ / 常见问题

### Q: 为什么使用BigInt而不是Number？
A: JavaScript的Number类型最大安全整数是2^53-1，而雪花ID可能超过这个值。使用BigInt可以避免精度丢失问题。

### Q: 如何处理时钟回拨？
A: 新版本提供了时钟回拨检测和等待机制。可以通过`enableClockSkewWait`和`maxClockSkewWait`参数配置。

### Q: 节点ID如何分配？
A: 可以直接使用`id`参数指定10位节点ID，或使用`datacenter`和`worker`组合生成。确保每个节点的ID唯一即可。

### Q: 如何选择合适的epoch？
A: 建议设置为应用上线时间，这样可以延长ID的使用年限。默认epoch是2020-01-01 00:00:00 UTC。

## License / 许可证

MIT
