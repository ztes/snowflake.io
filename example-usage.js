// 推荐的使用方式示例
import { 
  generateSnowflakeString,
  generateSnowflakeBatch,
  deconstructSnowflake,
  validateSnowflake
} from './lib/index.js';

console.log('=== 推荐的使用方式示例 ===\n');

// 1. 生成单个雪花ID
console.log('1. 生成单个雪花ID:');
const id = generateSnowflakeString({
  datacenter: 1,
  worker: 2
});
console.log(`生成的ID: ${id}\n`);

// 2. 批量生成雪花ID
console.log('2. 批量生成雪花ID:');
const ids = generateSnowflakeBatch(5, {
  datacenter: 1,
  worker: 2
});
console.log(`批量生成的5个ID: ${JSON.stringify(ids, null, 2)}\n`);

// 3. 解析雪花ID
console.log('3. 解析雪花ID:');
const parts = deconstructSnowflake(id);
console.log(`ID解析结果: ${JSON.stringify(parts, null, 2)}\n`);

// 4. 验证雪花ID
console.log('4. 验证雪花ID:');
const isValid = validateSnowflake(id);
const isInvalid = validateSnowflake('invalid-id');
console.log(`ID有效性: ${isValid}`);
console.log(`无效ID测试: ${isInvalid}\n`);

// 5. 使用自定义epoch
console.log('5. 使用自定义epoch:');
const customEpochId = generateSnowflakeString({
  datacenter: 1,
  worker: 2,
  epoch: new Date('2023-01-01').getTime()
});
console.log(`使用自定义epoch生成的ID: ${customEpochId}\n`);

console.log('=== 示例完成 ===');