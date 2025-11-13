// 测试空字符串验证问题
import { validateSnowflake } from './lib/index.js';

console.log('=== 测试空字符串验证问题 ===\n');

// 测试空字符串
console.log('测试空字符串:');
const emptyStringResult = validateSnowflake('');
console.log(`空字符串验证结果: ${emptyStringResult}`);

// 测试空字符串的BigInt转换
console.log('\n测试空字符串的BigInt转换:');
try {
  const bigIntResult = BigInt('');
  console.log(`BigInt('') 结果: ${bigIntResult}`);
} catch (error) {
  console.log(`BigInt('') 抛出错误: ${error.message}`);
}

// 测试空字符串的解析
console.log('\n测试空字符串的解析:');
try {
  const deconstructResult = validateSnowflake('');
  console.log(`空字符串解析结果: ${deconstructResult}`);
} catch (error) {
  console.log(`空字符串解析抛出错误: ${error.message}`);
}

// 测试null
console.log('\n测试null:');
const nullResult = validateSnowflake(null);
console.log(`null验证结果: ${nullResult}`);

// 测试undefined
console.log('\n测试undefined:');
const undefinedResult = validateSnowflake(undefined);
console.log(`undefined验证结果: ${undefinedResult}`);

console.log('\n=== 测试完成 ===');