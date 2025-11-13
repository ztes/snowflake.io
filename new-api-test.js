import { 
  // 新的API（推荐使用）
  generateSnowflakeId, 
  generateSnowflakeIds, 
  parseSnowflakeId, 
  isValidSnowflakeId,
  generateSnowflakeIdAsBigInt,
  generateSnowflakeIdAsBuffer,
  // Snowflake类的新方法
  Snowflake
} from './lib/index.js';

console.log('=== 测试新的API命名 ===\n');

// 测试新的函数API
console.log('1. 测试新的函数API:');
const id1 = generateSnowflakeId({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeId():', id1, typeof id1);

const ids = generateSnowflakeIds(5, { datacenter: 1, worker: 1 });
console.log('generateSnowflakeIds(5):', ids);

const idBigInt = generateSnowflakeIdAsBigInt({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeIdAsBigInt():', idBigInt, typeof idBigInt);

const idBuffer = generateSnowflakeIdAsBuffer({ datacenter: 1, worker: 1 });
console.log('generateSnowflakeIdAsBuffer():', idBuffer, idBuffer.constructor.name);

const parsed = parseSnowflakeId(id1);
console.log('parseSnowflakeId(id1):', parsed);

const isValid = isValidSnowflakeId(id1);
console.log('isValidSnowflakeId(id1):', isValid);

console.log('\n2. 测试Snowflake类的新方法:');
const id2 = Snowflake.generateId({ datacenter: 1, worker: 1 });
console.log('Snowflake.generateId():', id2, typeof id2);

const ids2 = Snowflake.generateIds(5, { datacenter: 1, worker: 1 });
console.log('Snowflake.generateIds(5):', ids2);

const idBigInt2 = Snowflake.generateIdAsBigInt({ datacenter: 1, worker: 1 });
console.log('Snowflake.generateIdAsBigInt():', idBigInt2, typeof idBigInt2);

const idBuffer2 = Snowflake.generateIdAsBuffer({ datacenter: 1, worker: 1 });
console.log('Snowflake.generateIdAsBuffer():', idBuffer2, idBuffer2.constructor.name);

const parsed2 = Snowflake.parseId(id2);
console.log('Snowflake.parseId(id2):', parsed2);

const isValid2 = Snowflake.isValidId(id2);
console.log('Snowflake.isValidId(id2):', isValid2);

console.log('\n3. 测试新旧API的一致性:');
const oldId = Snowflake.generateString({ datacenter: 1, worker: 1 });
const newId = Snowflake.generateId({ datacenter: 1, worker: 1 });
console.log('旧API Snowflake.generateString():', oldId);
console.log('新API Snowflake.generateId():', newId);
console.log('新旧API生成ID类型一致:', typeof oldId === typeof newId);

const oldParsed = Snowflake.deconstruct(oldId);
const newParsed = Snowflake.parseId(newId);
console.log('旧API Snowflake.deconstruct():', oldParsed);
console.log('新API Snowflake.parseId():', newParsed);
console.log('新旧API解析结果一致:', JSON.stringify(oldParsed) === JSON.stringify(newParsed));

const oldValid = Snowflake.validate(oldId);
const newValid = Snowflake.isValidId(newId);
console.log('旧API Snowflake.validate():', oldValid);
console.log('新API Snowflake.isValidId():', newValid);
console.log('新旧API验证结果一致:', oldValid === newValid);

console.log('\n=== 新API测试完成 ===');