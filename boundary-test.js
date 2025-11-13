// 边界条件测试
import { 
  generateSnowflakeString,
  generateSnowflakeBatch,
  deconstructSnowflake,
  validateSnowflake,
  snowflakeId,
  generateSnowflakeIdBigint,
  generateSnowflakeIdBuffer,
  Snowflake
} from './lib/index.js';

console.log('=== 边界条件测试 ===\n');

// 1. 测试极端参数值
console.log('1. 测试极端参数值');
console.log('-----------------');

// 最大datacenter和worker值
console.log('1.1 最大datacenter和worker值:');
try {
  const maxParamsId = generateSnowflakeString({
    datacenter: 31, // 最大值
    worker: 31      // 最大值
  });
  console.log(`使用最大参数值生成的ID: ${maxParamsId}`);
  const deconstructed = deconstructSnowflake(maxParamsId);
  console.log(`解析结果: ${JSON.stringify(deconstructed, null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 最小datacenter和worker值
console.log('\n1.2 最小datacenter和worker值:');
try {
  const minParamsId = generateSnowflakeString({
    datacenter: 0, // 最小值
    worker: 0      // 最小值
  });
  console.log(`使用最小参数值生成的ID: ${minParamsId}`);
  const deconstructed = deconstructSnowflake(minParamsId);
  console.log(`解析结果: ${JSON.stringify(deconstructed, null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 超出范围的参数值
console.log('\n1.3 超出范围的参数值:');
try {
  const overflowParamsId = generateSnowflakeString({
    datacenter: 32, // 超出范围
    worker: 0
  });
  console.log(`使用超出范围参数值生成的ID: ${overflowParamsId}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 2. 测试极端批量大小
console.log('\n\n2. 测试极端批量大小');
console.log('-------------------');

// 批量大小为1
console.log('2.1 批量大小为1:');
try {
  const batch1 = generateSnowflakeBatch(1);
  console.log(`批量大小为1的结果: ${JSON.stringify(batch1, null, 2)}`);
  console.log(`数组长度: ${batch1.length}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 批量大小为0
console.log('\n2.2 批量大小为0:');
try {
  const batch0 = generateSnowflakeBatch(0);
  console.log(`批量大小为0的结果: ${JSON.stringify(batch0, null, 2)}`);
  console.log(`数组长度: ${batch0.length}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 批量大小为负数
console.log('\n2.3 批量大小为负数:');
try {
  const batchNegative = generateSnowflakeBatch(-1);
  console.log(`批量大小为负数的结果: ${JSON.stringify(batchNegative, null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 批量大小为极大值
console.log('\n2.4 批量大小为极大值:');
try {
  const batchLarge = generateSnowflakeBatch(100000);
  console.log(`批量大小为100000的结果长度: ${batchLarge.length}`);
  console.log(`前5个ID: ${JSON.stringify(batchLarge.slice(0, 5), null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 3. 测试特殊ID值
console.log('\n\n3. 测试特殊ID值');
console.log('---------------');

// 空字符串ID
console.log('3.1 空字符串ID:');
try {
  const emptyResult = validateSnowflake('');
  console.log(`空字符串ID验证结果: ${emptyResult}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// null ID
console.log('\n3.2 null ID:');
try {
  const nullResult = validateSnowflake(null);
  console.log(`null ID验证结果: ${nullResult}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// undefined ID
console.log('\n3.3 undefined ID:');
try {
  const undefinedResult = validateSnowflake(undefined);
  console.log(`undefined ID验证结果: ${undefinedResult}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 非数字字符串ID
console.log('\n3.4 非数字字符串ID:');
try {
  const nonNumericResult = validateSnowflake('not-a-number');
  console.log(`非数字字符串ID验证结果: ${nonNumericResult}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 4. 测试不同输出格式的边界条件
console.log('\n\n4. 测试不同输出格式的边界条件');
console.log('---------------------------');

// BigInt格式ID的边界条件
console.log('4.1 BigInt格式ID的边界条件:');
try {
  const bigIntId = generateSnowflakeIdBigint();
  console.log(`BigInt ID: ${bigIntId}`);
  console.log(`类型: ${typeof bigIntId}`);
  console.log(`验证结果: ${validateSnowflake(bigIntId)}`);
  console.log(`解析结果: ${JSON.stringify(deconstructSnowflake(bigIntId), null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// Buffer格式ID的边界条件
console.log('\n4.2 Buffer格式ID的边界条件:');
try {
  const bufferId = generateSnowflakeIdBuffer();
  console.log(`Buffer ID: ${bufferId}`);
  console.log(`类型: ${typeof bufferId}`);
  console.log(`长度: ${bufferId.length}`);
  console.log(`验证结果: ${validateSnowflake(bufferId)}`);
  console.log(`解析结果: ${JSON.stringify(deconstructSnowflake(bufferId), null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 5. 测试时钟回拨处理
console.log('\n\n5. 测试时钟回拨处理');
console.log('-----------------');

// 启用时钟回拨等待
console.log('5.1 启用时钟回拨等待:');
try {
  const clockSkewId = generateSnowflakeString({
    enableClockSkewWait: true,
    maxClockSkewWait: 1000 // 1秒
  });
  console.log(`启用时钟回拨等待生成的ID: ${clockSkewId}`);
  console.log(`验证结果: ${validateSnowflake(clockSkewId)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 6. 测试自定义epoch
console.log('\n\n6. 测试自定义epoch');
console.log('-----------------');

// 使用未来的epoch
console.log('6.1 使用未来的epoch:');
try {
  const futureEpoch = new Date('2030-01-01').getTime();
  const futureEpochId = generateSnowflakeString({
    epoch: futureEpoch
  });
  console.log(`使用未来epoch生成的ID: ${futureEpochId}`);
  const deconstructed = deconstructSnowflake(futureEpochId);
  console.log(`解析结果: ${JSON.stringify(deconstructed, null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 使用过去的epoch
console.log('\n6.2 使用过去的epoch:');
try {
  const pastEpoch = new Date('2000-01-01').getTime();
  const pastEpochId = generateSnowflakeString({
    epoch: pastEpoch
  });
  console.log(`使用过去epoch生成的ID: ${pastEpochId}`);
  const deconstructed = deconstructSnowflake(pastEpochId);
  console.log(`解析结果: ${JSON.stringify(deconstructed, null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 7. 测试类方法的边界条件
console.log('\n\n7. 测试类方法的边界条件');
console.log('---------------------');

// 使用类方法生成最大参数值的ID
console.log('7.1 使用类方法生成最大参数值的ID:');
try {
  const maxClassId = Snowflake.generateString({
    datacenter: 31, // 最大值
    worker: 31      // 最大值
  });
  console.log(`使用类方法生成的最大参数值ID: ${maxClassId}`);
  const deconstructed = Snowflake.deconstruct(maxClassId);
  console.log(`解析结果: ${JSON.stringify(deconstructed, null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

// 获取统计信息
console.log('\n7.2 获取统计信息:');
try {
  const stats = Snowflake.getStats({
    datacenter: 1,
    worker: 1
  });
  console.log(`统计信息: ${JSON.stringify(stats, null, 2)}`);
} catch (error) {
  console.error(`错误: ${error.message}`);
}

console.log('\n=== 边界条件测试完成 ===');