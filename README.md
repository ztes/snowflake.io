# Snowflake.io / 雪花ID生成器

![npm](https://img.shields.io/npm/v/snowflake.io) 
![license](https://img.shields.io/npm/l/snowflake.io)

Generates k-ordered, conflict-free snowflake IDs in distributed systems /  
分布式环境下生成K-有序且无冲突的雪花ID

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
import { snowflakeId } from 'snowflake.io';

// 生成字符串ID / Generate string ID
snowflakeId({
  id: 100,
  datacenter: 9,
  worker: 7
}) // '7176875713503428608'

// 或使用默认配置 / OR with default config
snowflakeId() // '7176875713503428608'
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

## API Reference / API文档

### Core Functions / 核心方法

| Method/方法                             | Return/返回 | Description/描述           |
|---------------------------------------|-----------|--------------------------|
| `snowflakeId(options?)`               | `string`  | 默认字符串输出（同generateString） |
| `generateSnowflakeIdString(options?)` | `string`  | 字符串格式雪花ID                |
| `generateSnowflakeIdBigint(options?)` | `bigint`  | BigInt格式雪花ID             |
| `generateSnowflakeIdBuffer(options?)` | `Buffer`  | 原始Buffer格式（8字节）          |

### Configuration Options / 配置参数

```typescript
interface SnowflakeIOOptions {
  id?: number;         // 直接指定10位节点ID（覆盖datacenter/worker）
  datacenter?: number; // 数据中心ID（5位）
  worker?: number;     // 工作节点ID（5位）
  epoch?: number;      // 自定义起始时间戳（毫秒）
  seqMask?: number;    // 序列号掩码（默认12位）
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
    默认：0（1970-01-01）
    建议设置为应用上线时间（如：new Date('2023-01-01').getTime()）
    效果：缩短时间戳位数，延长ID可用年限

English: Custom epoch start time (milliseconds)
    Default: 0 (Unix epoch)
    Recommended: Set to application launch time (e.g., new Date('2023-01-01').getTime())
    Effect: Reduces timestamp bits, extends usable years
```

#### seqMask
```text
中文：序列号掩码（控制序列号位数）
    默认：0xfff（12位，每秒4096个ID）
    可调整为0x3ff（10位）等
    效果：在时间戳和序列号之间平衡性能与并发量

English: Sequence number bitmask
    Default: 0xfff (12 bits, 4096 IDs/ms)
    Can be adjusted (e.g., 0x3ff for 10 bits)
    Effect: Balances performance and concurrency
```

## Usage Examples / 使用示例

### Example 1: Direct Node ID / 直接指定节点ID

```typescript
const id = snowflakeId({
  id: 42,  // 直接使用10位ID / Direct 10-bit ID
  epoch: new Date('2023-01-01').getTime()
});
```

### Example 2: Multi-Datacenter Deployment / 多数据中心部署

```typescript
// 上海数据中心节点5 / Shanghai DC node 5
const id = snowflakeId({
  datacenter: 1,  // 数据中心1 / DC 1
  worker: 5       // 工作节点5 / Worker 5
});
```

### Example 3: High Concurrency / 高并发场景

```typescript
// 减少序列号位数 / Reduce sequence bits
const id = snowflakeId({
  seqMask: 0x3ff  // 10位序列号（1024/ms） / 10-bit sequence
});
```

## Advanced Usage / 高级用法

### Multiple Output Formats / 多输出格式

```typescript
import { 
  generateSnowflakeIdBuffer,
  generateSnowflakeIdBigint,
  generateSnowflakeIdString,
  Snowflake
} from 'snowflake.io';

// 函数式调用 / Functional style
generateSnowflakeIdBuffer({...});  // <Buffer 63 99 62 6f cc 80 00 00>
generateSnowflakeIdBigint({...});  // 7176875713503428608n
generateSnowflakeIdString({...});  // '7176875713503428608'

// 类式调用 / Class style
Snowflake.generateSnowflakeIdBuffer({...});
Snowflake.generateSnowflakeIdBigint({...});
Snowflake.generateSnowflakeIdString({...});
```

### ID Structure / ID结构

| Timestamp | Datacenter | Worker | Counter |
|-----------|------------|--------|---------|
| 时间戳       | 数据中心       | 工作节点   | 序列号     |
| 42 bits   | 5 bits     | 5 bits | 12 bits |


### Example ID Breakdown / ID示例解析

| 010100001110000110101011101110100001000111 | 00111 | 00011 | 000000000000 |
|--------------------------------------------|-------|-------|--------------|
| 42位时间戳                                     | d     | w     | 12位序列号       |


## Performance / 性能指标

| Operation/操作 | Performance/性能    |
|--------------|-------------------|
| String ID生成  | 1,200,000 ops/sec |
| BigInt ID生成  | 1,500,000 ops/sec |
| Buffer ID生成  | 1,800,000 ops/sec |


> 碰撞概率：默认配置下，同一节点每秒可生成409.6万个唯一ID（4096/ms × 1000ms）  
> Collision probability: 4.096 million unique IDs per second per node in default config
