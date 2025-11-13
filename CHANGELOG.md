# 更新日志

## [2.1.0] - 2025-06-23

### 重大变更
- **移除旧版API兼容性**：完全移除了以下旧版API方法：
  - `generateSnowflakeString` (使用 `generateSnowflakeId` 替代)
  - `generateSnowflakeBatch` (使用 `generateSnowflakeIds` 替代)
  - `deconstructSnowflake` (使用 `parseSnowflakeId` 替代)
  - `validateSnowflake` (使用 `isValidSnowflakeId` 替代)

### 说明
- 此版本不再兼容旧版API，如果您需要使用旧版API，请继续使用 1.0 版本
- 新API提供了更清晰的命名和更好的语义化
- 所有示例代码和文档已更新为使用新API

### 迁移指南
如果您正在使用旧版API，请按以下方式迁移：

```typescript
// 旧API (v1.x)
const oldId = generateSnowflakeString({ datacenter: 1, worker: 1 });
const oldIds = generateSnowflakeBatch(10, { datacenter: 1, worker: 1 });
const oldParsed = deconstructSnowflake(oldId);
const oldValid = validateSnowflake(oldId);

// 新API (v2.1.0+)
const newId = generateSnowflakeId({ datacenter: 1, worker: 1 });
const newIds = generateSnowflakeIds(10, { datacenter: 1, worker: 1 });
const newParsed = parseSnowflakeId(newId);
const newValid = isValidSnowflakeId(newId);
```

## [2.0.1] - 2025-06-23

### 新增
- 添加了新API方法，提供更清晰的命名：
  - `generateSnowflakeId` - 生成单个雪花ID
  - `generateSnowflakeIds` - 批量生成雪花ID
  - `parseSnowflakeId` - 解析雪花ID
  - `isValidSnowflakeId` - 验证雪花ID

### 兼容性
- 保留了旧版API的兼容性，通过别名方式支持

## [2.0.0] - 2025-06-20

### 重大变更
- 重构了整个项目架构
- 优化了性能，提高了ID生成速度
- 改进了类型定义和TypeScript支持

### 新增
- 添加了批量生成功能
- 添加了ID解析和验证功能
- 添加了时钟回拨处理机制

## [1.0.0] - 2025-06-10

### 初始版本
- 基础雪花ID生成功能
- 支持自定义数据中心和工作节点ID
- 支持自定义epoch