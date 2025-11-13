/**
 * 性能对比测试脚本
 * 用于验证snowflake.io与其他雪花ID生成库的性能对比
 */

import { performance } from 'perf_hooks';

// 导入snowflake.io
import { 
  generateSnowflakeString,
  generateSnowflakeBatch,
  Snowflake
} from './lib/index.js';

// 测试参数
const SINGLE_COUNT = 1000000;  // 单个生成测试数量
const BATCH_COUNT = 1000;      // 批量大小
const BATCH_ITERATIONS = 1000; // 批量生成迭代次数

// 测试函数：单个ID生成性能
function testSingleGeneration(name, generator, count = SINGLE_COUNT) {
  console.log(`\n测试 ${name} 单个ID生成性能 (${count} 个ID)...`);
  
  const startTime = performance.now();
  for (let i = 0; i < count; i++) {
    generator();
  }
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  const opsPerSec = Math.round(count / (duration / 1000));
  
  console.log(`耗时: ${duration.toFixed(2)}ms`);
  console.log(`每秒生成数: ${opsPerSec.toLocaleString()}`);
  
  return opsPerSec;
}

// 测试函数：批量ID生成性能
function testBatchGeneration(name, generator, batchSize = BATCH_COUNT, iterations = BATCH_ITERATIONS) {
  console.log(`\n测试 ${name} 批量ID生成性能 (批量大小: ${batchSize}, 迭代次数: ${iterations})...`);
  
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    generator(batchSize);
  }
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  const totalIds = batchSize * iterations;
  const opsPerSec = Math.round(totalIds / (duration / 1000));
  
  console.log(`耗时: ${duration.toFixed(2)}ms`);
  console.log(`总生成数: ${totalIds.toLocaleString()}`);
  console.log(`每秒生成数: ${opsPerSec.toLocaleString()}`);
  
  return opsPerSec;
}

// 测试内存使用
function testMemoryUsage(name, generator, count = 100000) {
  console.log(`\n测试 ${name} 内存使用情况 (生成 ${count} 个ID)...`);
  
  // 强制垃圾回收（如果可用）
  if (global.gc) {
    global.gc();
  }
  
  const memBefore = process.memoryUsage();
  const ids = [];
  
  for (let i = 0; i < count; i++) {
    ids.push(generator());
  }
  
  const memAfter = process.memoryUsage();
  const heapUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024; // MB
  
  console.log(`堆内存增长: ${heapUsed.toFixed(2)} MB`);
  console.log(`每个ID平均内存: ${(heapUsed * 1024 / count).toFixed(4)} KB`);
  
  return heapUsed;
}

// 主测试函数
function runPerformanceTests() {
  console.log('='.repeat(60));
  console.log('Snowflake.io 性能测试');
  console.log('='.repeat(60));
  
  // 创建snowflake.io实例
  const snowflake = new Snowflake({ datacenter: 1, worker: 1 });
  
  // 测试snowflake.io单个ID生成
  const snowflakeSingleOps = testSingleGeneration(
    'snowflake.io (generateSnowflakeString)',
    () => generateSnowflakeString({ datacenter: 1, worker: 1 })
  );
  
  // 测试snowflake.io类方法单个ID生成
  const snowflakeClassSingleOps = testSingleGeneration(
    'snowflake.io (Snowflake.generateString)',
    () => Snowflake.generateString({ datacenter: 1, worker: 1 })
  );
  
  // 测试snowflake.io批量生成
  const snowflakeBatchOps = testBatchGeneration(
    'snowflake.io (generateSnowflakeBatch)',
    (count) => generateSnowflakeBatch(count, { datacenter: 1, worker: 1 })
  );
  
  // 测试snowflake.io类方法批量生成
  const snowflakeClassBatchOps = testBatchGeneration(
    'snowflake.io (Snowflake.generateBatch)',
    (count) => Snowflake.generateBatch(count, { datacenter: 1, worker: 1 })
  );
  
  // 测试内存使用
  const snowflakeMemory = testMemoryUsage(
    'snowflake.io',
    () => generateSnowflakeString({ datacenter: 1, worker: 1 })
  );
  
  // 输出性能对比表格
  console.log('\n' + '='.repeat(60));
  console.log('性能对比总结');
  console.log('='.repeat(60));
  
  console.log('\n| 方法 | 单个生成 (ops/sec) | 批量生成 (ops/sec) | 内存占用 (MB) |');
  console.log('|------|-------------------|-------------------|---------------|');
  console.log(`| snowflake.io (函数) | ${snowflakeSingleOps.toLocaleString()} | ${snowflakeBatchOps.toLocaleString()} | ${snowflakeMemory.toFixed(2)} |`);
  console.log(`| snowflake.io (类) | ${snowflakeClassSingleOps.toLocaleString()} | ${snowflakeClassBatchOps.toLocaleString()} | ${snowflakeMemory.toFixed(2)} |`);
  
  // 计算性能提升
  const batchImprovement = Math.round((snowflakeBatchOps / snowflakeSingleOps - 1) * 100);
  console.log(`\n批量生成性能提升: ${batchImprovement}%`);
  
  // 验证ID唯一性
  console.log('\n验证ID唯一性...');
  const uniqueIds = new Set();
  const testCount = 100000;
  
  for (let i = 0; i < testCount; i++) {
    uniqueIds.add(generateSnowflakeString({ datacenter: 1, worker: 1 }));
  }
  
  console.log(`生成 ${testCount} 个ID，唯一数量: ${uniqueIds.size}`);
  console.log(`唯一性验证: ${uniqueIds.size === testCount ? '通过' : '失败'}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('性能测试完成');
  console.log('='.repeat(60));
}

// 运行测试
runPerformanceTests();