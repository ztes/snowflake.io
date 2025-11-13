import { 
  // 新的API（推荐使用）
  generateSnowflakeId, 
  generateSnowflakeIds, 
  parseSnowflakeId, 
  isValidSnowflakeId,
  generateSnowflakeIdAsBigInt,
  generateSnowflakeIdAsBuffer,
  // 兼容旧版API
  generateSnowflakeString,
  generateSnowflakeBatch,
  deconstructSnowflake,
  validateSnowflake,
  // 其他格式
  generateSnowflakeIdBigint,
  generateSnowflakeIdBuffer,
  // Snowflake类
  Snowflake
} from './lib/index.js';

console.log('=== snowflake.io 全面的方法测试 ===\n');

// 1. 测试新的函数API
console.log('1. 测试新的函数API:');
console.log('-------------------');

// 生成单个雪花ID（字符串格式）
const id1 = generateSnowflakeId({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeId():', id1, typeof id1);

// 批量生成雪花ID（字符串格式）
const ids1 = generateSnowflakeIds(5, { datacenter: 1, worker: 1 });
console.log('generateSnowflakeIds(5):', ids1);
console.log('批量生成的ID数量:', ids1.length);

// 生成BigInt格式的雪花ID
const bigIntId1 = generateSnowflakeIdAsBigInt({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeIdAsBigInt():', bigIntId1, typeof bigIntId1);

// 生成Buffer格式的雪花ID
const bufferId1 = generateSnowflakeIdAsBuffer({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeIdAsBuffer():', bufferId1, bufferId1.constructor.name);

// 解析雪花ID
const parsed1 = parseSnowflakeId(id1);
console.log('parseSnowflakeId(id1):', parsed1);

// 验证雪花ID
const isValid1 = isValidSnowflakeId(id1);
console.log('isValidSnowflakeId(id1):', isValid1);

// 验证无效ID
const invalidId = 'invalid_id';
const isInvalid = isValidSnowflakeId(invalidId);
console.log('isValidSnowflakeId("invalid_id"):', isInvalid);

console.log('\n2. 测试兼容旧版API:');
console.log('-------------------');

// 旧API：生成单个雪花ID
const id2 = generateSnowflakeString({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeString():', id2, typeof id2);

// 旧API：批量生成雪花ID
const ids2 = generateSnowflakeBatch(5, { datacenter: 1, worker: 1 });
console.log('generateSnowflakeBatch(5):', ids2);

// 旧API：解析雪花ID
const parsed2 = deconstructSnowflake(id2);
console.log('deconstructSnowflake(id2):', parsed2);

// 旧API：验证雪花ID
const isValid2 = validateSnowflake(id2);
console.log('validateSnowflake(id2):', isValid2);

console.log('\n3. 测试其他格式API:');
console.log('-------------------');

// BigInt格式
const bigIntId2 = generateSnowflakeIdBigint({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeIdBigint():', bigIntId2, typeof bigIntId2);

// Buffer格式
const bufferId2 = generateSnowflakeIdBuffer({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeIdBuffer():', bufferId2, bufferId2.constructor.name);

console.log('\n4. 测试Snowflake类方法:');
console.log('-------------------');

// Snowflake类：生成单个雪花ID（字符串格式）
const id3 = Snowflake.generateId({ datacenter: 1, worker: 1 });
console.log('Snowflake.generateId():', id3, typeof id3);

// Snowflake类：批量生成雪花ID（字符串格式）
const ids3 = Snowflake.generateIds(5, { datacenter: 1, worker: 1 });
console.log('Snowflake.generateIds(5):', ids3);

// Snowflake类：生成BigInt格式的雪花ID
const bigIntId3 = Snowflake.generateIdAsBigInt({ datacenter: 1, worker: 1 });
console.log('Snowflake.generateIdAsBigInt():', bigIntId3, typeof bigIntId3);

// Snowflake类：生成Buffer格式的雪花ID
const bufferId3 = Snowflake.generateIdAsBuffer({ datacenter: 1, worker: 1 });
console.log('Snowflake.generateIdAsBuffer():', bufferId3, bufferId3.constructor.name);

// Snowflake类：解析雪花ID
const parsed3 = Snowflake.parseId(id3);
console.log('Snowflake.parseId(id3):', parsed3);

// Snowflake类：验证雪花ID
const isValid3 = Snowflake.isValidId(id3);
console.log('Snowflake.isValidId(id3):', isValid3);

// Snowflake类：旧方法
const id4 = Snowflake.generateString({ datacenter: 1, worker: 1 });
console.log('Snowflake.generateString():', id4, typeof id4);

const ids4 = Snowflake.generateBatch(5, { datacenter: 1, worker: 1 });
console.log('Snowflake.generateBatch(5):', ids4);

const parsed4 = Snowflake.deconstruct(id4);
console.log('Snowflake.deconstruct(id4):', parsed4);

const isValid4 = Snowflake.validate(id4);
console.log('Snowflake.validate(id4):', isValid4);

console.log('\n5. 测试不同配置选项:');
console.log('-------------------');

// 使用ID参数
const id5 = generateSnowflakeId({ id: 42 });
console.log('generateSnowflakeId({ id: 42 }):', id5);

// 使用epoch参数
const customEpoch = new Date('2023-01-01').getTime();
const id6 = generateSnowflakeId({ epoch: customEpoch });
console.log('generateSnowflakeId({ epoch: new Date("2023-01-01").getTime() }):', id6);

// 使用时钟回拨等待
const id7 = Snowflake.generateId({ 
  datacenter: 1, 
  worker: 1, 
  clockSkewWait: true 
});
console.log('Snowflake.generateId({ clockSkewWait: true }):', id7);

console.log('\n6. 测试统计信息:');
console.log('-------------------');

const stats = Snowflake.getStats({ datacenter: 1, worker: 1 });
console.log('Snowflake.getStats():', stats);

console.log('\n7. 测试ID唯一性:');
console.log('-------------------');

// 生成大量ID并检查唯一性
const largeIds = generateSnowflakeIds(1000, { datacenter: 1, worker: 1 });
const uniqueIds = new Set(largeIds);
console.log('生成1000个ID，唯一数量:', uniqueIds.size);
console.log('所有ID唯一:', uniqueIds.size === largeIds.length);

console.log('\n8. 测试不同格式ID的解析:');
console.log('-------------------');

// 解析字符串ID
const strId = generateSnowflakeId({ datacenter: 1, worker: 1 });
const parsedStr = parseSnowflakeId(strId);
console.log('解析字符串ID:', parsedStr);

// 解析BigInt ID
const bigIntId = generateSnowflakeIdAsBigInt({ datacenter: 1, worker: 1 });
const parsedBigInt = parseSnowflakeId(bigIntId);
console.log('解析BigInt ID:', parsedBigInt);

// 解析Buffer ID
const bufferId = generateSnowflakeIdAsBuffer({ datacenter: 1, worker: 1 });
const parsedBuffer = parseSnowflakeId(bufferId);
console.log('解析Buffer ID:', parsedBuffer);

console.log('\n9. 测试不同格式ID的验证:');
console.log('-------------------');

// 验证字符串ID
const validStrId = generateSnowflakeId({ datacenter: 1, worker: 1 });
const isValidStr = isValidSnowflakeId(validStrId);
console.log('验证字符串ID:', isValidStr);

// 验证BigInt ID
const validBigIntId = generateSnowflakeIdAsBigInt({ datacenter: 1, worker: 1 });
const isValidBigInt = isValidSnowflakeId(validBigIntId);
console.log('验证BigInt ID:', isValidBigInt);

// 验证Buffer ID
const validBufferId = generateSnowflakeIdAsBuffer({ datacenter: 1, worker: 1 });
const isValidBuffer = isValidSnowflakeId(validBufferId);
console.log('验证Buffer ID:', isValidBuffer);

console.log('\n10. 测试边界情况:');
console.log('-------------------');

// 空字符串
const emptyStr = '';
const isValidEmpty = isValidSnowflakeId(emptyStr);
console.log('验证空字符串:', isValidEmpty);

// null值
try {
  const isValidNull = isValidSnowflakeId(null);
  console.log('验证null:', isValidNull);
} catch (e) {
  console.log('验证null时出错:', e.message);
}

// undefined值
try {
  const isValidUndefined = isValidSnowflakeId(undefined);
  console.log('验证undefined:', isValidUndefined);
} catch (e) {
  console.log('验证undefined时出错:', e.message);
}

console.log('\n=== 测试完成 ===');