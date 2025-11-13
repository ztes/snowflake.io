import { 
  // 新的API
  generateSnowflakeId, 
  generateSnowflakeIds, 
  parseSnowflakeId, 
  isValidSnowflakeId,
  generateSnowflakeIdAsBigInt,
  generateSnowflakeIdAsBuffer,
  // Snowflake类
  Snowflake
} from './lib/index.js';

console.log('=== snowflake.io 性能测试 ===\n');

// 性能测试函数
function performanceTest(name, fn, iterations = 100000) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // 转换为毫秒
  const opsPerSec = Math.round(iterations / (duration / 1000));
  
  console.log(`${name}:`);
  console.log(`  ${iterations} 次操作耗时: ${duration.toFixed(2)} ms`);
  console.log(`  每秒操作数: ${opsPerSec.toLocaleString()} ops/sec`);
  console.log('');
  
  return opsPerSec;
}

// 1. 测试单个ID生成性能
console.log('1. 单个ID生成性能:');
const newApiPerf = performanceTest(
  '新API generateSnowflakeId',
  () => generateSnowflakeId({ datacenter: 1, worker: 1 }),
  100000
);

const classApiPerf = performanceTest(
  'Snowflake类 generateId',
  () => Snowflake.generateId({ datacenter: 1, worker: 1 }),
  100000
);

const bigIntApiPerf = performanceTest(
  'generateSnowflakeIdAsBigInt',
  () => generateSnowflakeIdAsBigInt({ datacenter: 1, worker: 1 }),
  100000
);

const bufferApiPerf = performanceTest(
  'generateSnowflakeIdAsBuffer',
  () => generateSnowflakeIdAsBuffer({ datacenter: 1, worker: 1 }),
  100000
);

// 2. 测试批量生成性能
console.log('2. 批量生成性能:');

// 测试每次生成1000个ID，执行100次，总共100000个ID
const batchPerf = performanceTest(
  'generateSnowflakeIds(1000)',
  () => generateSnowflakeIds(1000, { datacenter: 1, worker: 1 }),
  100 // 100次，每次生成1000个，总共100000个ID
);

const classBatchPerf = performanceTest(
  'Snowflake.generateIds(1000)',
  () => Snowflake.generateIds(1000, { datacenter: 1, worker: 1 }),
  100 // 100次，每次生成1000个，总共100000个ID
);

// 计算每秒生成的ID数量（而不是每秒批量操作数）
const batchIdPerSec = batchPerf * 1000; // 每次生成1000个ID
const classBatchIdPerSec = classBatchPerf * 1000; // 每次生成1000个ID

console.log(`批量生成每秒ID数(新API): ${batchIdPerSec.toLocaleString()} IDs/sec`);
console.log(`批量生成每秒ID数(类方法): ${classBatchIdPerSec.toLocaleString()} IDs/sec\n`);

// 3. 测试解析性能
console.log('3. ID解析性能:');
const testId = generateSnowflakeId({ datacenter: 1, worker: 1 });

const parsePerf = performanceTest(
  'parseSnowflakeId',
  () => parseSnowflakeId(testId),
  100000
);

const classParsePerf = performanceTest(
  'Snowflake.parseId',
  () => Snowflake.parseId(testId),
  100000
);

// 4. 测试验证性能
console.log('4. ID验证性能:');
const validatePerf = performanceTest(
  'isValidSnowflakeId',
  () => isValidSnowflakeId(testId),
  100000
);

const classValidatePerf = performanceTest(
  'Snowflake.isValidId',
  () => Snowflake.isValidId(testId),
  100000
);

// 5. 测试不同格式ID的解析性能
console.log('5. 不同格式ID的解析性能:');
const stringId = generateSnowflakeId({ datacenter: 1, worker: 1 });
const bigIntId = generateSnowflakeIdAsBigInt({ datacenter: 1, worker: 1 });
const bufferId = generateSnowflakeIdAsBuffer({ datacenter: 1, worker: 1 });

const parseStringPerf = performanceTest(
  '解析字符串ID',
  () => parseSnowflakeId(stringId),
  100000
);

const parseBigIntPerf = performanceTest(
  '解析BigInt ID',
  () => parseSnowflakeId(bigIntId),
  100000
);

const parseBufferPerf = performanceTest(
  '解析Buffer ID',
  () => parseSnowflakeId(bufferId),
  100000
);

// 6. 测试不同格式ID的验证性能
console.log('6. 不同格式ID的验证性能:');
const validateStringPerf = performanceTest(
  '验证字符串ID',
  () => isValidSnowflakeId(stringId),
  100000
);

const validateBigIntPerf = performanceTest(
  '验证BigInt ID',
  () => isValidSnowflakeId(bigIntId),
  100000
);

const validateBufferPerf = performanceTest(
  '验证Buffer ID',
  () => isValidSnowflakeId(bufferId),
  100000
);

// 7. 内存使用测试
console.log('7. 内存使用测试:');
const memBefore = process.memoryUsage();

// 生成10000个ID（分批生成）
const ids = [];
for (let i = 0; i < 1000; i++) {
  ids.push(...generateSnowflakeIds(10, { datacenter: 1, worker: 1 }));
}
const memAfter = process.memoryUsage();

const heapUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024; // MB
console.log(`生成10000个ID的内存使用: ${heapUsed.toFixed(2)} MB`);
console.log(`平均每个ID内存使用: ${(heapUsed / 10000 * 1024).toFixed(2)} KB`);

// 8. 性能对比总结
console.log('\n8. 性能对比总结:');
console.log('单个ID生成性能对比:');
console.log(`  新API generateSnowflakeId: ${newApiPerf.toLocaleString()} ops/sec`);
console.log(`  Snowflake类 generateId: ${classApiPerf.toLocaleString()} ops/sec`);
console.log(`  BigInt格式生成: ${bigIntApiPerf.toLocaleString()} ops/sec`);
console.log(`  Buffer格式生成: ${bufferApiPerf.toLocaleString()} ops/sec`);

console.log('\n批量生成性能对比:');
console.log(`  新API generateSnowflakeIds: ${batchPerf.toLocaleString()} ops/sec`);
console.log(`  Snowflake类 generateIds: ${classBatchPerf.toLocaleString()} ops/sec`);
console.log(`  批量生成每秒ID数(新API): ${batchIdPerSec.toLocaleString()} IDs/sec`);
console.log(`  批量生成每秒ID数(类方法): ${classBatchIdPerSec.toLocaleString()} IDs/sec`);

console.log('\nID解析性能对比:');
console.log(`  parseSnowflakeId: ${parsePerf.toLocaleString()} ops/sec`);
console.log(`  Snowflake.parseId: ${classParsePerf.toLocaleString()} ops/sec`);

console.log('\nID验证性能对比:');
console.log(`  isValidSnowflakeId: ${validatePerf.toLocaleString()} ops/sec`);
console.log(`  Snowflake.isValidId: ${classValidatePerf.toLocaleString()} ops/sec`);

console.log('\n不同格式ID解析性能对比:');
console.log(`  字符串ID解析: ${parseStringPerf.toLocaleString()} ops/sec`);
console.log(`  BigInt ID解析: ${parseBigIntPerf.toLocaleString()} ops/sec`);
console.log(`  Buffer ID解析: ${parseBufferPerf.toLocaleString()} ops/sec`);

console.log('\n不同格式ID验证性能对比:');
console.log(`  字符串ID验证: ${validateStringPerf.toLocaleString()} ops/sec`);
console.log(`  BigInt ID验证: ${validateBigIntPerf.toLocaleString()} ops/sec`);
console.log(`  Buffer ID验证: ${validateBufferPerf.toLocaleString()} ops/sec`);

console.log('\n=== 性能测试完成 ===');