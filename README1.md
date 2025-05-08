# snowflake.io
- Snowflake.io, generates k-ordered, conflict-free snowflake IDs in a distributed environment.
- Snowflake.io，在分布式环境中生成 k 有序、无冲突的雪花ID。

## Installation ##
$ pnpm add snowflake.io ⏎

## Simple usage:
``` typescript
import { snowflakeId } from 'snowflake.io'
// snowflakeId returns the Bigint value converted to a string.
// Configuration options are required in distributed environments.
// 生成为String类型的的雪花ID
snowflakeId({
  id: 100,
  datacenter: 9,
  worker: 7
}) // 7176875713503428608
// OR
snowflakeId() // '7176875713503428608'
```

## Usage
``` typescript
// SnowflakeIOOptions
export interface SnowflakeIOOptions {
  id?: number;         
  datacenter?: number;  
  worker?: number;      
  epoch?: number;       
  seqMask?: number;     
}
```

###  id
```text
中文：直接指定10位的工作节点ID（将覆盖datacenter和worker参数）
    范围：0-1023（10位二进制最大值）
    适用场景：已有全局唯一的节点ID时直接使用

English: Directly specify a 10-bit worker node ID (overrides datacenter and worker)
    Range: 0-1023 (max 10-bit value)
    Use case: When you already have globally unique node IDs
```


###  datacenter
```text
中文：数据中心ID（5位）
    范围：0-31（5位二进制最大值）
    与worker组合生成10位节点ID：(datacenter << 5) | worker

English: Datacenter ID (5 bits)
    Range: 0-31 (max 5-bit value)
    Combined with worker to form 10-bit node ID: (datacenter << 5) | worker
```

###  worker
```text
中文：工作节点ID（5位）
    范围：0-31（5位二进制最大值）
    同一数据中心内需保证唯一

English: Worker node ID (5 bits)
    Range: 0-31 (max 5-bit value)
    Must be unique within the same datacenter
```

###  epoch
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

###  seqMask
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

### Usage Examples
#### 示例1：直接指定节点ID
```typescript
const sid = snowflakeId({
id: 42,  // 直接使用10位ID | Direct 10-bit ID
epoch: new Date('2023-01-01').getTime()
});
```

#### 示例2：分数据中心部署
```typescript
// 上海数据中心节点5 | Shanghai DC node 5
const sid = snowflakeId({
datacenter: 1,  // 数据中心1 | DC 1
worker: 5       // 工作节点5 | Worker 5
});
```

#### 示例3：高并发场景调整
```typescript
// 减少序列号位数，增加时间戳位数 | Trade sequence bits for timestamp
const sid = snowflakeId({
seqMask: 0x3ff  // 10位序列号（1024/ms） | 10-bit sequence (1024 IDs/ms)
});
```

#### 生成效果 / Generated ID Structure

| 时间戳（42位） | 节点ID（10位） | 序列号（12位） |
| ------------- | ------------- | ------------- |
| Timestamp (42) | Node ID (10)   | Sequence (12) |

#### ID示例（Buffer转16进制）：01f8a3b4c2d1e2f3

> 碰撞概率：在默认配置下，同一节点每秒可生成409.6万个唯一ID（4096/ms × 1000ms）


``` typescript
import { snowflakeId, generateSnowflakeIdBuffer, generateSnowflakeIdBigint, generateSnowflakeIdString } from 'snowflake.io'
    
// snowflake.generateSnowflakeIdBuffer returns an 8-byte long node Buffer object, whose bytes represent a 64-bit long ID.
// Configuration options are required in distributed environments.
// 生成为Buffer的雪花ID
generateSnowflakeIdBuffer({
  id: 100,
  datacenter: 9,
  worker: 7
}) // <Buffer 63 99 62 6f cc 80 00 00>
// OR
generateSnowflakeIdBuffer() // <Buffer 63 99 62 6f cc 80 00 00>

// snowflake.generateSnowflakeIdBigint returns the Bigint value after processing the Buffer.
// Configuration options are required in distributed environments.
// 生成为Bigint的雪花ID
generateSnowflakeIdBigint({
  id: 100,
  datacenter: 9,
  worker: 7
}) // 7176875713503428608n
// OR
generateSnowflakeIdBigint() // 7176875713503428608n

// snowflake.generateSnowflakeIdBigint returns the Bigint value converted to a string.
// Configuration options are required in distributed environments.
// 生成为字符串的雪花ID
generateSnowflakeIdString({
  id: 100,
  datacenter: 9,
  worker: 7
}) // '7176875713503428608'
// OR
generateSnowflakeIdString({
  id: 100,
  datacenter: 9,
  worker: 7
}) // '7176875713503428608'
// OR
snowflakeId({
  id: 100,
  datacenter: 9,
  worker: 7
}) // '7176875713503428608'
OR
snowflakeId() // default
```

``` typescript
import { Snowflake } from 'snowflake.io'
    
// Configuration options are required in distributed environments.
const options: SnowflakeIOOptions = {
  id: 100,
  datacenter: 9,
  worker: 7
}

// snowflake.generateSnowflakeIdBuffer returns an 8-byte long node Buffer object, whose bytes represent a 64-bit long ID.
// Configuration options are required in distributed environments.
Snowflake.generateSnowflakeIdBuffer({
  id: 100,
  datacenter: 9,
  worker: 7
}) // <Buffer 63 99 62 6f cc 80 00 00>
// OR
Snowflake.generateSnowflakeIdBuffer() // <Buffer 63 99 62 6f cc 80 00 00>

// snowflake.generateSnowflakeIdBigint returns the Bigint value after processing the Buffer.
// Configuration options are required in distributed environments.
Snowflake.generateSnowflakeIdBigint({
  id: 100,
  datacenter: 9,
  worker: 7
}) // 7176875713503428608n
// OR
Snowflake.generateSnowflakeIdBigint() // 7176875713503428608n

// snowflake.generateSnowflakeIdBigint returns the Bigint value converted to a string.
// Configuration options are required in distributed environments.
Snowflake.generateSnowflakeIdString({
  id: 100,
  datacenter: 9,
  worker: 7
}) // '7176875713503428608'
// OR
Snowflake.generateSnowflakeIdString() // '7176875713503428608'
```

## Snowflake Numbers Format ##

The Snowflake ID is made up of: `timestamp`, `datacenter`, `worker` and `counter`. Examples in the following table:
```
+-------------+------------+--------+---------+--------------------+
|  Timestamp  | Datacenter | Worker | Counter | Flake ID           |
+-------------+------------+--------+---------+--------------------+
| 0x8c20543b0 |   00000b   | 00000b |  0x000  | 0x02308150ec000000 |
+-------------+------------+--------+---------+--------------------+
| 0x8c20543b1 |   00000b   | 00000b |  0x000  | 0x02308150ec400000 |
+-------------+------------+--------+---------+--------------------+
| 0x8c20543b1 |   00000b   | 00000b |  0x001  | 0x02308150ec400001 |
+-------------+------------+--------+---------+--------------------+
| 0x8c20543b1 |   00000b   | 00000b |  0x002  | 0x02308150ec400002 |
+-------------+------------+--------+---------+--------------------+
| 0x8c20543b1 |   00000b   | 00000b |  0x003  | 0x02308150ec400003 |
+-------------+------------+--------+---------+--------------------+
| 0x8c20c0335 |   00011b   | 00001b |  0x000  | 0x02308300cd461000 |
+-------------+------------+--------+---------+--------------------+
| 0x8c20c0335 |   00011b   | 00001b |  0x001  | 0x02308300cd461001 |
+-------------+------------+--------+---------+--------------------+
```
Breakdown of bits for an id e.g. `5828128208445124608` (counter is `0`, datacenter is `7` and worker `3`) is as follows:
```
 010100001110000110101011101110100001000111 00111 00011 000000000000
                                                       |------------| 12 bit counter
                                                 |-----|               5 bit worker
                                           |-----|                     5 bit datacenter
                                           |----- -----|              10 bit generator identifier
|------------------------------------------|                          42 bit timestamp
```

Note that composition of `datacenter id` and `worker id` makes 1024 unique generator identifiers. By modifying datacenter and worker id we can get up to 1024 id generators on a single machine (e.g. each running in a separate process) or have 1024 machines with a single id generator on each. It is also possible to provide a single 10 bit long identifier (up to 1024 values). That id is internally split into `datacenter` (the most significant 5 bits) and `worker` (the least significant 5 bits).

