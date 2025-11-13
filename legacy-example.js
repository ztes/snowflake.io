// 兼容旧版本API的使用示例
import { 
  snowflakeId,
  generateSnowflakeIdBigint,
  generateSnowflakeIdBuffer
} from './lib/index.js';

console.log('=== 兼容旧版本API的使用示例 ===\n');

// 1. 使用snowflakeId方法（兼容旧版本）
console.log('1. 使用snowflakeId方法:');
const id = snowflakeId({
  datacenter: 1,
  worker: 2
});
console.log(`生成的ID: ${id}\n`);

// 2. 生成BigInt格式的雪花ID
console.log('2. 生成BigInt格式的雪花ID:');
const bigintId = generateSnowflakeIdBigint({
  datacenter: 1,
  worker: 2
});
console.log(`生成的BigInt ID: ${bigintId}\n`);

// 3. 生成Buffer格式的雪花ID
console.log('3. 生成Buffer格式的雪花ID:');
const bufferId = generateSnowflakeIdBuffer({
  datacenter: 1,
  worker: 2
});
console.log(`生成的Buffer ID: ${bufferId}\n`);

console.log('=== 示例完成 ===');