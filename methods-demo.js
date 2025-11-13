import { 
  // 新的API（推荐使用）
  generateSnowflakeId, 
  generateSnowflakeIds, 
  parseSnowflakeId, 
  isValidSnowflakeId,
  generateSnowflakeIdAsBigInt,
  generateSnowflakeIdAsBuffer,
  // Snowflake类
  Snowflake
} from './lib/index.js';

console.log('=== snowflake.io 常用方法演示 ===\n');

// 1. 生成单个雪花ID（最常用）
console.log('1. 生成单个雪花ID:');
const id = generateSnowflakeId({ datacenter: 1, worker: 1 });
console.log('生成的ID:', id);
console.log('ID类型:', typeof id);

// 2. 批量生成雪花ID
console.log('\n2. 批量生成雪花ID:');
const ids = generateSnowflakeIds(5, { datacenter: 1, worker: 1 });
console.log('批量生成的5个ID:', ids);

// 3. 解析雪花ID
console.log('\n3. 解析雪花ID:');
const parsed = parseSnowflakeId(id);
console.log('解析结果:');
console.log('- 时间戳:', parsed.timestamp);
console.log('- 节点ID:', parsed.nodeId);
console.log('- 序列号:', parsed.sequence);
console.log('- 纪元:', parsed.epoch);
console.log('- 生成时间:', new Date(parsed.timestamp));

// 4. 验证雪花ID
console.log('\n4. 验证雪花ID:');
const isValid = isValidSnowflakeId(id);
console.log('ID有效性:', isValid);

const invalidId = 'invalid_id';
const isInvalid = isValidSnowflakeId(invalidId);
console.log('无效ID验证结果:', isInvalid);

// 5. 生成不同格式的ID
console.log('\n5. 生成不同格式的ID:');
const stringId = generateSnowflakeId({ datacenter: 1, worker: 1 });
const bigIntId = generateSnowflakeIdAsBigInt({ datacenter: 1, worker: 1 });
const bufferId = generateSnowflakeIdAsBuffer({ datacenter: 1, worker: 1 });

console.log('字符串格式ID:', stringId, typeof stringId);
console.log('BigInt格式ID:', bigIntId, typeof bigIntId);
console.log('Buffer格式ID:', bufferId, bufferId.constructor.name);

// 6. 使用Snowflake类
console.log('\n6. 使用Snowflake类:');
const classId = Snowflake.generateId({ datacenter: 1, worker: 1 });
const classIds = Snowflake.generateIds(5, { datacenter: 1, worker: 1 });
const classParsed = Snowflake.parseId(classId);
const classValid = Snowflake.isValidId(classId);

console.log('类方法生成的ID:', classId);
console.log('类方法批量生成的ID:', classIds);
console.log('类方法解析结果:', classParsed);
console.log('类方法验证结果:', classValid);

// 7. 不同配置选项
console.log('\n7. 不同配置选项:');

// 直接指定节点ID
const directId = generateSnowflakeId({ id: 42 });
console.log('直接指定节点ID (42):', directId);

// 自定义纪元
const customEpoch = new Date('2023-01-01').getTime();
const customEpochId = generateSnowflakeId({ epoch: customEpoch });
console.log('自定义纪元 (2023-01-01):', customEpochId);

// 启用时钟回拨等待
const clockSkewId = Snowflake.generateId({ 
  datacenter: 1, 
  worker: 1, 
  clockSkewWait: true 
});
console.log('启用时钟回拨等待:', clockSkewId);

// 8. 获取统计信息
console.log('\n8. 获取统计信息:');
const stats = Snowflake.getStats({ datacenter: 1, worker: 1 });
console.log('统计信息:');
console.log('- 节点ID:', stats.nodeId);
console.log('- 纪元:', stats.epoch);
console.log('- 最后时间戳:', stats.lastTimestamp);
console.log('- 当前序列号:', stats.sequence);
console.log('- 最大序列号:', stats.maxSequence);
console.log('- 最大节点ID:', stats.maxNodeId);

// 9. ID唯一性验证
console.log('\n9. ID唯一性验证:');
const uniqueIds = generateSnowflakeIds(100, { datacenter: 1, worker: 1 });
const uniqueSet = new Set(uniqueIds);
console.log('生成100个ID，唯一数量:', uniqueSet.size);
console.log('所有ID唯一:', uniqueSet.size === uniqueIds.length);

console.log('\n=== 演示完成 ===');