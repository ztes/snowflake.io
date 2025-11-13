// 性能测试
import { 
  generateSnowflakeString,
  generateSnowflakeBatch,
  deconstructSnowflake,
  validateSnowflake,
  Snowflake
} from './lib/index.js';

console.log('=== 性能测试 ===\n');

// 1. 单个ID生成性能测试
console.log('1. 单个ID生成性能测试');
console.log('-------------------');
const singleGenCount = 10000;
const singleGenStart = Date.now();
for (let i = 0; i < singleGenCount; i++) {
  generateSnowflakeString();
}
const singleGenEnd = Date.now();
const singleGenTime = singleGenEnd - singleGenStart;
console.log(`生成 ${singleGenCount} 个单个ID 耗时: ${singleGenTime}ms`);
console.log(`平均每个ID生成耗时: ${(singleGenTime / singleGenCount).toFixed(4)}ms`);
console.log(`每秒可生成ID数量: ${(singleGenCount / singleGenTime * 1000).toFixed(0)} 个/秒\n`);

// 2. 批量ID生成性能测试
console.log('2. 批量ID生成性能测试');
console.log('-------------------');
const batchGenCount = 1000;
const batchSize = 100;
const batchGenStart = Date.now();
for (let i = 0; i < batchGenCount; i++) {
  generateSnowflakeBatch(batchSize);
}
const batchGenEnd = Date.now();
const batchGenTime = batchGenEnd - batchGenStart;
const totalBatchIds = batchGenCount * batchSize;
console.log(`批量生成 ${totalBatchIds} 个ID (每批${batchSize}个) 耗时: ${batchGenTime}ms`);
console.log(`平均每个ID生成耗时: ${(batchGenTime / totalBatchIds).toFixed(4)}ms`);
console.log(`每秒可生成ID数量: ${(totalBatchIds / batchGenTime * 1000).toFixed(0)} 个/秒\n`);

// 3. ID解析性能测试
console.log('3. ID解析性能测试');
console.log('---------------');
const testIds = generateSnowflakeBatch(1000);
const parseStart = Date.now();
for (const id of testIds) {
  deconstructSnowflake(id);
}
const parseEnd = Date.now();
const parseTime = parseEnd - parseStart;
console.log(`解析 ${testIds.length} 个ID 耗时: ${parseTime}ms`);
console.log(`平均每个ID解析耗时: ${(parseTime / testIds.length).toFixed(4)}ms`);
console.log(`每秒可解析ID数量: ${(testIds.length / parseTime * 1000).toFixed(0)} 个/秒\n`);

// 4. ID验证性能测试
console.log('4. ID验证性能测试');
console.log('---------------');
const validateStart = Date.now();
for (const id of testIds) {
  validateSnowflake(id);
}
const validateEnd = Date.now();
const validateTime = validateEnd - validateStart;
console.log(`验证 ${testIds.length} 个ID 耗时: ${validateTime}ms`);
console.log(`平均每个ID验证耗时: ${(validateTime / testIds.length).toFixed(4)}ms`);
console.log(`每秒可验证ID数量: ${(testIds.length / validateTime * 1000).toFixed(0)} 个/秒\n`);

// 5. 类方法与函数方法性能对比
console.log('5. 类方法与函数方法性能对比');
console.log('-----------------------');
const compareCount = 5000;

// 函数方法
const funcStart = Date.now();
for (let i = 0; i < compareCount; i++) {
  generateSnowflakeString();
}
const funcEnd = Date.now();
const funcTime = funcEnd - funcStart;

// 类方法
const classStart = Date.now();
for (let i = 0; i < compareCount; i++) {
  Snowflake.generateString();
}
const classEnd = Date.now();
const classTime = classEnd - classStart;

console.log(`函数方法生成 ${compareCount} 个ID 耗时: ${funcTime}ms`);
console.log(`类方法生成 ${compareCount} 个ID 耗时: ${classTime}ms`);
console.log(`性能差异: ${funcTime > classTime ? '类方法更快' : '函数方法更快'} (${Math.abs(funcTime - classTime)}ms)\n`);

// 6. 不同批量大小性能对比
console.log('6. 不同批量大小性能对比');
console.log('---------------------');
const batchSizes = [1, 10, 50, 100, 500, 1000];
const testBatches = 100;

for (const size of batchSizes) {
  const start = Date.now();
  for (let i = 0; i < testBatches; i++) {
    generateSnowflakeBatch(size);
  }
  const end = Date.now();
  const time = end - start;
  const totalIds = testBatches * size;
  console.log(`批量大小 ${size}: 生成 ${totalIds} 个ID 耗时 ${time}ms, 平均每个ID ${(time / totalIds).toFixed(4)}ms`);
}

console.log('\n=== 性能测试完成 ===');