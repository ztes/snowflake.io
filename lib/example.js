import { Snowflake, generateSnowflakeId, generateSnowflakeIds, parseSnowflakeId, isValidSnowflakeId } from './index.js';
// 示例1: 基本使用
console.log('=== 基本使用示例 ===');
const snowflakeId1 = generateSnowflakeId();
console.log('生成的雪花ID:', snowflakeId1);
// 示例2: 使用自定义配置
console.log('\n=== 自定义配置示例 ===');
const options = {
    datacenter: 1,
    worker: 2,
    epoch: Date.now() - 30 * 24 * 60 * 60 * 1000 // 30天前作为纪元
};
const snowflakeId2 = generateSnowflakeId(options);
console.log('使用自定义配置生成的雪花ID:', snowflakeId2);
// 示例3: 批量生成
console.log('\n=== 批量生成示例 ===');
const batchIds = generateSnowflakeIds(5);
console.log('批量生成的5个雪花ID:', batchIds);
// 示例4: 解析雪花ID
console.log('\n=== 解析雪花ID示例 ===');
const deconstructed = parseSnowflakeId(snowflakeId1);
console.log('解析雪花ID:', deconstructed);
// 示例5: 验证雪花ID
console.log('\n=== 验证雪花ID示例 ===');
const isValid = isValidSnowflakeId(snowflakeId1);
console.log('验证雪花ID:', isValid);
// 示例6: 使用类的方式
console.log('\n=== 使用类的方式示例 ===');
const snowflakeInstance = Snowflake.getInstance().setOptions({});
const classId = snowflakeInstance.nextId();
console.log('通过类生成的雪花ID:', classId);
// 示例7: 获取统计信息
console.log('\n=== 获取统计信息示例 ===');
const stats = Snowflake.getStats();
console.log('雪花ID生成器统计信息:', stats);
// 示例8: 生成不同格式的ID
console.log('\n=== 生成不同格式的ID示例 ===');
const bufferId = Snowflake.generateSnowflakeIdBuffer();
const bigintId = Snowflake.generateSnowflakeIdBigint();
const stringId = Snowflake.generateSnowflakeIdString();
console.log('Buffer格式ID:', bufferId);
console.log('BigInt格式ID:', bigintId);
console.log('String格式ID:', stringId);
// 示例9: 性能测试
console.log('\n=== 性能测试示例 ===');
const count = 1000;
const startTime = Date.now();
const testIds = generateSnowflakeIds(count);
const endTime = Date.now();
console.log(`生成 ${count} 个雪花ID耗时: ${endTime - startTime}ms`);
console.log(`平均每个ID生成耗时: ${(endTime - startTime) / count}ms`);
// 示例10: 时钟回拨测试 (仅演示，不会实际触发)
console.log('\n=== 时钟回拨处理示例 ===');
const clockSkewOptions = {
    enableClockSkewWait: true,
    maxClockSkewWait: 5000 // 最大等待5秒
};
const clockSkewId = generateSnowflakeId(clockSkewOptions);
console.log('启用时钟回拨等待生成的ID:', clockSkewId);
