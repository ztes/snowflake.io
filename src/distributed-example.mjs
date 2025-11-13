import { 
  generateSnowflakeString,
  generateSnowflakeBatch,
  deconstructSnowflake,
  Snowflake
} from '../framework/es/snowflake.io.js';

// 分布式环境配置示例
console.log('=== 分布式环境配置示例 ===\n');

// 1. 单数据中心多节点配置
console.log('1. 单数据中心多节点配置:');
const dcNode1 = generateSnowflakeString({
  datacenter: 1,  // 数据中心1
  worker: 1       // 工作节点1
});
const dcNode2 = generateSnowflakeString({
  datacenter: 1,  // 同一数据中心
  worker: 2       // 不同工作节点
});
console.log(`节点1 ID: ${dcNode1}`);
console.log(`节点2 ID: ${dcNode2}`);
console.log(`节点1解析:`, deconstructSnowflake(dcNode1));
console.log(`节点2解析:`, deconstructSnowflake(dcNode2));
console.log('');

// 2. 多数据中心配置
console.log('2. 多数据中心配置:');
const beijingNode1 = generateSnowflakeString({
  datacenter: 1,  // 北京数据中心
  worker: 1
});
const shanghaiNode1 = generateSnowflakeString({
  datacenter: 2,  // 上海数据中心
  worker: 1
});
const shenzhenNode1 = generateSnowflakeString({
  datacenter: 3,  // 深圳数据中心
  worker: 1
});
console.log(`北京节点1 ID: ${beijingNode1}`);
console.log(`上海节点1 ID: ${shanghaiNode1}`);
console.log(`深圳节点1 ID: ${shenzhenNode1}`);
console.log('');

// 3. 直接指定节点ID配置
console.log('3. 直接指定节点ID配置:');
const nodeId = 66;  // 二进制: 0001000010
const customNodeId = generateSnowflakeString({
  id: nodeId
});
console.log(`自定义节点ID (${nodeId}) 生成的ID: ${customNodeId}`);
console.log(`解析结果:`, deconstructSnowflake(customNodeId));
console.log('');

// 4. 时钟回拨处理配置
console.log('4. 时钟回拨处理配置:');
const clockSkewId = generateSnowflakeString({
  datacenter: 1,
  worker: 1,
  enableClockSkewWait: true,        // 启用时钟回拨等待
  maxClockSkewWait: 5000            // 最大等待5秒
});
console.log(`时钟回拨配置生成的ID: ${clockSkewId}`);
console.log('');

// 5. 批量生成配置
console.log('5. 批量生成配置:');
const batchIds = generateSnowflakeBatch(10, {
  datacenter: 2,
  worker: 3
});
console.log(`批量生成的10个ID:`);
batchIds.forEach((id, index) => {
  console.log(`  ${index + 1}. ${id}`);
});
console.log('');

// 6. 自定义Epoch配置
console.log('6. 自定义Epoch配置:');
const customEpoch = new Date('2023-01-01').getTime(); // 2023年作为起始时间
const customEpochId = generateSnowflakeString({
  datacenter: 1,
  worker: 1,
  epoch: customEpoch
});
console.log(`自定义Epoch (${new Date(customEpoch).toISOString()}) 生成的ID: ${customEpochId}`);
console.log(`解析结果:`, deconstructSnowflake(customEpochId));
console.log('');

// 7. 节点ID分配策略示例
console.log('7. 节点ID分配策略示例:');
const nodeAllocation = [
  { range: '0-31', purpose: '预留系统节点', example: '系统管理、监控等' },
  { range: '32-63', purpose: '数据中心1', example: '北京机房' },
  { range: '64-95', purpose: '数据中心2', example: '上海机房' },
  { range: '96-127', purpose: '数据中心3', example: '深圳机房' },
  { range: '128-1023', purpose: '扩展节点', example: '未来扩展' }
];

console.table(nodeAllocation);
console.log('');

// 8. 高并发场景配置
console.log('8. 高并发场景配置:');
console.time('批量生成1000个ID耗时');
const highConcurrencyIds = generateSnowflakeBatch(1000, {
  datacenter: 1,
  worker: 1
});
console.timeEnd('批量生成1000个ID耗时');
console.log(`生成的ID数量: ${highConcurrencyIds.length}`);
console.log(`ID唯一性检查: ${new Set(highConcurrencyIds).size === highConcurrencyIds.length ? '通过' : '失败'}`);
console.log('');

// 9. 类式调用配置
console.log('9. 类式调用配置:');
const snowflakeInstance = Snowflake.getInstance().setOptions({
  datacenter: 2,
  worker: 2,
  enableClockSkewWait: true
});

const instanceId1 = snowflakeInstance.nextId();
const instanceId2 = snowflakeInstance.nextId();
console.log(`实例生成的ID1: ${instanceId1}`);
console.log(`实例生成的ID2: ${instanceId2}`);
console.log('');

// 10. 分布式环境最佳实践
console.log('10. 分布式环境最佳实践:');
console.log(`
1. 确保所有节点时钟同步，使用NTP服务
2. 为每个数据中心分配唯一的datacenter ID
3. 在同一数据中心内，为每个工作节点分配唯一的worker ID
4. 启用时钟回拨等待机制，提高系统稳定性
5. 监控ID生成速率，避免超过每毫秒4096个的限制
6. 使用批量生成API提高高并发场景下的性能
7. 定期检查ID的唯一性，特别是在添加新节点时
8. 考虑使用自定义Epoch延长ID的有效期
`);

console.log('\n=== 分布式配置示例完成 ===');