# snowflake-id-maker
Snowflake ID generator generates k ordered and conflict-free snowflake IDs in a distributed environment.
雪花ID生成器，在分布式环境中生成 k 有序、无冲突的雪花ID。

## Installation ##
$ pnpm add snowflake-id-maker ⏎

## Usage
``` typescript
// SnowflakeOptions
export interface SnowflakeOptions {
  datacenter?: number | undefined;
  worker?: number | undefined;
  id?: number | undefined;
  epoch?: number | undefined;
  seqMask?: number | undefined;
}
```

``` typescript
import { generateSnowflakeIdBuffer, generateSnowflakeIdBigint, generateSnowflakeIdString } from 'snowflake-id-maker'
    
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
generateSnowflakeIdString() // '7176875713503428608'
// OR
snowflakeId() // '7176875713503428608'
```

``` typescript
import { Snowflake } from 'snowflake-id-maker'
    
// Configuration options are required in distributed environments.
const options: SnowflakeOptions = {
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

