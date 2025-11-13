import { 
  generateSnowflakeId,
  generateSnowflakeIds,
  parseSnowflakeId,
  isValidSnowflakeId,
  Snowflake
} from './index.js';

// 基本测试
console.log('=== 基本测试 ===');
const id1 = generateSnowflakeId({ datacenter: 1, worker: 1 });
const id2 = generateSnowflakeId({ datacenter: 1, worker: 1 });
console.log('生成的ID1:', id1);
console.log('生成的ID2:', id2);
console.log('ID1 !== ID2:', id1 !== id2);

// 批量生成测试
console.log('\n=== 批量生成测试 ===');
const batchIds = generateSnowflakeIds(5, { datacenter: 2, worker: 3 });
console.log('批量生成的5个ID:', batchIds);
console.log('所有ID唯一:', new Set(batchIds).size === batchIds.length);

// ID解析测试
console.log('\n=== ID解析测试 ===');
const parts = parseSnowflakeId(id1);
console.log('ID1解析结果:', parts);

// ID验证测试
console.log('\n=== ID验证测试 ===');
console.log('ID1有效性:', isValidSnowflakeId(id1));
console.log('无效ID测试:', isValidSnowflakeId('invalid-id'));

// 类式调用测试
console.log('\n=== 类式调用测试 ===');
const classId = Snowflake.generateString({ datacenter: 3, worker: 4 });
console.log('类式调用生成的ID:', classId);

// 统计信息测试
console.log('\n=== 统计信息测试 ===');
const stats = Snowflake.getStats();
console.log('统计信息:', stats);

// 时钟回拨测试（模拟）
console.log('\n=== 时钟回拨测试 ===');
try {
  // 使用一个很大的时间戳来模拟时钟回拨
  const snowflakeInstance = Snowflake.getInstance().setOptions({ datacenter: 1, worker: 1 });
  // 手动设置一个很大的时间戳
  (snowflakeInstance as any).lastTimestamp = BigInt(Date.now() + 10000);
  const skewId = snowflakeInstance.nextId();
  console.log('时钟回拨处理成功，生成的ID:', skewId);
} catch (error: any) {
  console.log('时钟回拨错误:', error.message);
}

// 性能测试
console.log('\n=== 性能测试 ===');
const count = 1000; // 限制为1000，因为批量生成有上限
const startTime = Date.now();
const perfIds = generateSnowflakeIds(count, { datacenter: 1, worker: 1 });
const endTime = Date.now();
console.log(`生成${count}个ID耗时: ${endTime - startTime}ms`);
console.log(`平均每个ID生成耗时: ${(endTime - startTime) / count}ms`);
console.log(`每秒可生成ID数量: ${Math.floor(count / (endTime - startTime) * 1000)}`);

console.log('\n=== 所有测试完成 ===');