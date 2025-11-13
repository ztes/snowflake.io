// 全面测试所有方法
import { 
  // 推荐的方法
  generateSnowflakeString,
  generateSnowflakeBatch,
  deconstructSnowflake,
  validateSnowflake,
  
  // 兼容旧版本的方法
  snowflakeId,
  generateSnowflakeIdBigint,
  generateSnowflakeIdBuffer,
  
  // 类方法
  Snowflake
} from './lib/index.js';

console.log('=== 全面测试所有方法 ===\n');

// 1. 测试推荐的方法
console.log('1. 测试推荐的方法');
console.log('-------------------');

// generateSnowflakeString
console.log('1.1 generateSnowflakeString:');
const id1 = generateSnowflakeString({
  datacenter: 1,
  worker: 2
});
console.log(`生成的ID: ${id1}`);
console.log(`类型: ${typeof id1}`);

// generateSnowflakeBatch
console.log('\n1.2 generateSnowflakeBatch:');
const batchIds = generateSnowflakeBatch(5, {
  datacenter: 1,
  worker: 2
});
console.log(`批量生成的5个ID: ${JSON.stringify(batchIds, null, 2)}`);
console.log(`类型: ${typeof batchIds}`);
console.log(`数组元素类型: ${typeof batchIds[0]}`);

// deconstructSnowflake
console.log('\n1.3 deconstructSnowflake:');
const deconstructed = deconstructSnowflake(id1);
console.log(`ID解析结果: ${JSON.stringify(deconstructed, null, 2)}`);
console.log(`类型: ${typeof deconstructed}`);

// validateSnowflake
console.log('\n1.4 validateSnowflake:');
const isValid = validateSnowflake(id1);
const isInvalid = validateSnowflake('invalid-id');
console.log(`ID有效性: ${isValid} (类型: ${typeof isValid})`);
console.log(`无效ID测试: ${isInvalid} (类型: ${typeof isInvalid})`);

// 2. 测试兼容旧版本的方法
console.log('\n\n2. 测试兼容旧版本的方法');
console.log('-----------------------');

// snowflakeId
console.log('2.1 snowflakeId:');
const id2 = snowflakeId({
  datacenter: 1,
  worker: 2
});
console.log(`生成的ID: ${id2}`);
console.log(`类型: ${typeof id2}`);

// generateSnowflakeIdBigint
console.log('\n2.2 generateSnowflakeIdBigint:');
const bigintId = generateSnowflakeIdBigint({
  datacenter: 1,
  worker: 2
});
console.log(`生成的BigInt ID: ${bigintId}`);
console.log(`类型: ${typeof bigintId}`);

// generateSnowflakeIdBuffer
console.log('\n2.3 generateSnowflakeIdBuffer:');
const bufferId = generateSnowflakeIdBuffer({
  datacenter: 1,
  worker: 2
});
console.log(`生成的Buffer ID: ${bufferId}`);
console.log(`类型: ${typeof bufferId}`);
console.log(`Buffer长度: ${bufferId.length}`);

// 3. 测试类方法
console.log('\n\n3. 测试类方法');
console.log('-----------');

// Snowflake.generateString
console.log('3.1 Snowflake.generateString:');
const id3 = Snowflake.generateString({
  datacenter: 1,
  worker: 2
});
console.log(`生成的ID: ${id3}`);
console.log(`类型: ${typeof id3}`);

// Snowflake.generateBatch
console.log('\n3.2 Snowflake.generateBatch:');
const batchIds2 = Snowflake.generateBatch(5, {
  datacenter: 1,
  worker: 2
});
console.log(`批量生成的5个ID: ${JSON.stringify(batchIds2, null, 2)}`);
console.log(`类型: ${typeof batchIds2}`);

// Snowflake.deconstruct
console.log('\n3.3 Snowflake.deconstruct:');
const deconstructed2 = Snowflake.deconstruct(id3);
console.log(`ID解析结果: ${JSON.stringify(deconstructed2, null, 2)}`);
console.log(`类型: ${typeof deconstructed2}`);

// Snowflake.validate
console.log('\n3.4 Snowflake.validate:');
const isValid2 = Snowflake.validate(id3);
const isInvalid2 = Snowflake.validate('invalid-id');
console.log(`ID有效性: ${isValid2} (类型: ${typeof isValid2})`);
console.log(`无效ID测试: ${isInvalid2} (类型: ${typeof isInvalid2})`);

// Snowflake.generateSnowflakeIdBigint
console.log('\n3.5 Snowflake.generateSnowflakeIdBigint:');
const bigintId2 = Snowflake.generateSnowflakeIdBigint({
  datacenter: 1,
  worker: 2
});
console.log(`生成的BigInt ID: ${bigintId2}`);
console.log(`类型: ${typeof bigintId2}`);

// Snowflake.generateSnowflakeIdBuffer
console.log('\n3.6 Snowflake.generateSnowflakeIdBuffer:');
const bufferId2 = Snowflake.generateSnowflakeIdBuffer({
  datacenter: 1,
  worker: 2
});
console.log(`生成的Buffer ID: ${bufferId2}`);
console.log(`类型: ${typeof bufferId2}`);

// Snowflake.getStats
console.log('\n3.7 Snowflake.getStats:');
const stats = Snowflake.getStats({
  datacenter: 1,
  worker: 2
});
console.log(`统计信息: ${JSON.stringify(stats, null, 2)}`);
console.log(`类型: ${typeof stats}`);

// 4. 测试不同参数组合
console.log('\n\n4. 测试不同参数组合');
console.log('-----------------');

// 使用id参数
console.log('4.1 使用id参数:');
const idWithId = generateSnowflakeString({
  id: 42
});
console.log(`使用id参数生成的ID: ${idWithId}`);

// 使用epoch参数
console.log('\n4.2 使用epoch参数:');
const idWithEpoch = generateSnowflakeString({
  datacenter: 1,
  worker: 2,
  epoch: new Date('2023-01-01').getTime()
});
console.log(`使用epoch参数生成的ID: ${idWithEpoch}`);

// 使用enableClockSkewWait参数
console.log('\n4.3 使用enableClockSkewWait参数:');
const idWithClockSkew = generateSnowflakeString({
  datacenter: 1,
  worker: 2,
  enableClockSkewWait: true,
  maxClockSkewWait: 5000
});
console.log(`使用时钟回拨参数生成的ID: ${idWithClockSkew}`);

// 5. 测试ID解析和验证的一致性
console.log('\n\n5. 测试ID解析和验证的一致性');
console.log('-----------------------');

// 解析BigInt ID
console.log('5.1 解析BigInt ID:');
const parsedBigInt = deconstructSnowflake(bigintId);
console.log(`解析BigInt ID: ${JSON.stringify(parsedBigInt, null, 2)}`);

// 解析Buffer ID
console.log('\n5.2 解析Buffer ID:');
const parsedBuffer = deconstructSnowflake(bufferId);
console.log(`解析Buffer ID: ${JSON.stringify(parsedBuffer, null, 2)}`);

// 验证BigInt ID
console.log('\n5.3 验证BigInt ID:');
const isValidBigInt = validateSnowflake(bigintId);
console.log(`BigInt ID有效性: ${isValidBigInt}`);

// 验证Buffer ID
console.log('\n5.4 验证Buffer ID:');
const isValidBuffer = validateSnowflake(bufferId);
console.log(`Buffer ID有效性: ${isValidBuffer}`);

console.log('\n=== 所有方法测试完成 ===');