# API命名优化建议

## 问题分析

当前snowflake.io库中存在一些API命名不一致或语义不够清晰的问题：

1. **新旧API命名不一致**：
   - `generateSnowflakeString` vs `generateSnowflakeIdString`
   - `generateSnowflakeBatch` vs `generateSnowflakeIdBuffer`

2. **命名语义不够清晰**：
   - `generateSnowflakeString` - "雪花字符串"容易误解为雪花本身的字符串表示，而不是雪花ID的字符串表示
   - `deconstructSnowflake` - "解析雪花"不够明确，应该是"解析雪花ID"
   - `validateSnowflake` - "验证雪花"不够明确，应该是"验证雪花ID"

## 建议的API命名方案

### 1. 核心ID生成函数（推荐使用）

```typescript
// 生成雪花ID（字符串格式）
export const generateSnowflakeId = (options?: SnowflakeOptions): string => {
  return Snowflake.generateString(options)
}

// 批量生成雪花ID（字符串格式）
export const generateSnowflakeIds = (count: number, options?: SnowflakeOptions): string[] => {
  return Snowflake.generateBatch(count, options)
}

// 生成雪花ID（BigInt格式）
export const generateSnowflakeIdAsBigInt = (options?: SnowflakeOptions): BigInt => {
  return Snowflake.generateSnowflakeIdBigint(options)
}

// 生成雪花ID（Buffer格式）
export const generateSnowflakeIdAsBuffer = (options?: SnowflakeOptions): Buffer => {
  return Snowflake.generate(options)
}
```

### 2. ID解析和验证函数

```typescript
// 解析雪花ID
export const parseSnowflakeId = (snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): SnowflakeDeconstructed => {
  return Snowflake.deconstruct(snowflakeId, options)
}

// 验证雪花ID
export const isValidSnowflakeId = (snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): boolean => {
  return Snowflake.validate(snowflakeId, options)
}
```

### 3. 兼容旧版本的别名

```typescript
// 保持向后兼容
export const generateSnowflakeString = generateSnowflakeId
export const generateSnowflakeBatch = generateSnowflakeIds
export const deconstructSnowflake = parseSnowflakeId
export const validateSnowflake = isValidSnowflakeId

// 旧版本API（标记为已弃用）
/**
 * @deprecated 请使用 generateSnowflakeId 替代
 */
export const generateSnowflakeIdString = generateSnowflakeId

/**
 * @deprecated 请使用 generateSnowflakeIdAsBigInt 替代
 */
export const generateSnowflakeIdBigint = generateSnowflakeIdAsBigInt

/**
 * @deprecated 请使用 generateSnowflakeIdAsBuffer 替代
 */
export const generateSnowflakeIdBuffer = generateSnowflakeIdAsBuffer
```

## 命名原则

1. **明确性**：函数名应明确表达其功能，如 `generateSnowflakeId` 明确表示生成雪花ID
2. **一致性**：相关函数应使用一致的命名模式，如 `generateSnowflakeId`、`parseSnowflakeId`、`isValidSnowflakeId`
3. **简洁性**：在保持明确性的前提下，尽量简洁
4. **向后兼容**：保留旧API作为别名，确保现有代码不受影响

## 使用示例

```typescript
// 推荐使用的新API
import { 
  generateSnowflakeId,
  generateSnowflakeIds,
  parseSnowflakeId,
  isValidSnowflakeId
} from 'snowflake.io';

// 生成单个ID
const id = generateSnowflakeId({ datacenter: 1, worker: 2 });

// 批量生成ID
const ids = generateSnowflakeIds(100, { datacenter: 1, worker: 2 });

// 解析ID
const parts = parseSnowflakeId(id);

// 验证ID
const isValid = isValidSnowflakeId(id);
```

## 类方法命名

同样，类方法也应遵循相同的命名原则：

```typescript
export class Snowflake {
  // 核心方法
  static generateId(options?: SnowflakeOptions): string
  static generateIds(count: number, options?: SnowflakeOptions): string[]
  static generateIdAsBigInt(options?: SnowflakeOptions): BigInt
  static generateIdAsBuffer(options?: SnowflakeOptions): Buffer
  static parseId(snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): SnowflakeDeconstructed
  static isValidId(snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): boolean
  
  // 兼容旧方法
  static generateString(options?: SnowflakeOptions): string // 别名
  static generateBatch(count: number, options?: SnowflakeOptions): string[] // 别名
  static deconstruct(snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): SnowflakeDeconstructed // 别名
  static validate(snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): boolean // 别名
}
```