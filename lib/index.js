// 优化的雪花ID生成器
import SnowflakeId from './snowflake.js';
import { isObject, allowedFields } from './util.js';
/**
 * Snowflake
 * @description 雪花算法生成类
 */
export class Snowflake {
    static instance;
    instances = new Map();
    /**
     * @description 生成雪花算法ID (Buffer格式)
     * @param options
     */
    static generate(options = {}) {
        const snowflake = this.getInstance().setOptions(options);
        return snowflake.next();
    }
    /**
     * @description 生成雪花算法ID (字符串格式)
     * @param options
     */
    static generateString(options = {}) {
        const snowflake = this.getInstance().setOptions(options);
        return snowflake.nextId();
    }
    /**
     * @description 批量生成雪花ID (字符串格式)
     * @param count 生成数量
     * @param options
     */
    static generateBatch(count, options = {}) {
        const snowflake = this.getInstance().setOptions(options);
        return snowflake.nextIds(count);
    }
    /**
     * @description 解析雪花ID
     * @param snowflakeId
     * @param options
     */
    static deconstruct(snowflakeId, options = {}) {
        const snowflake = this.getInstance().setOptions(options);
        return snowflake.deconstruct(snowflakeId);
    }
    /**
     * @description 验证雪花ID
     * @param snowflakeId
     * @param options
     */
    static validate(snowflakeId, options = {}) {
        const snowflake = this.getInstance().setOptions(options);
        return snowflake.validate(snowflakeId);
    }
    /**
     * @description 获取雪花ID生成器统计信息
     * @param options
     */
    static getStats(options = {}) {
        const snowflake = this.getInstance().setOptions(options);
        return snowflake.getStats();
    }
    // 新的命名方法（推荐使用）
    /**
     * @description 生成雪花ID（字符串格式）
     * @param options
     */
    static generateId(options = {}) {
        return this.generateString(options);
    }
    /**
     * @description 批量生成雪花ID（字符串格式）
     * @param count 生成数量
     * @param options
     */
    static generateIds(count, options = {}) {
        return this.generateBatch(count, options);
    }
    /**
     * @description 生成雪花ID（BigInt格式）
     * @param options
     */
    static generateIdAsBigInt(options = {}) {
        return this.generateSnowflakeIdBigint(options);
    }
    /**
     * @description 生成雪花ID（Buffer格式）
     * @param options
     */
    static generateIdAsBuffer(options = {}) {
        return this.generate(options);
    }
    /**
     * @description 解析雪花ID
     * @param snowflakeId
     * @param options
     */
    static parseId(snowflakeId, options = {}) {
        return this.deconstruct(snowflakeId, options);
    }
    /**
     * @description 验证雪花ID
     * @param snowflakeId
     * @param options
     */
    static isValidId(snowflakeId, options = {}) {
        return this.validate(snowflakeId, options);
    }
    maker(options = {}) {
        return new SnowflakeId(options);
    }
    /**
     * @description 设置雪花算法配置
     * @param options
     */
    setOptions(options) {
        const defaultOptions = {};
        if (isObject(options)) {
            options = allowedFields(options, ['datacenter', 'worker', 'id', 'epoch', 'seqMask', 'enableClockSkewWait', 'maxClockSkewWait']);
            if (Reflect.has(options, 'datacenter')) {
                defaultOptions.datacenter = options.datacenter;
            }
            if (Reflect.has(options, 'worker')) {
                defaultOptions.worker = options.worker;
            }
            if (Reflect.has(options, 'id')) {
                defaultOptions.id = options.id;
            }
            if (Reflect.has(options, 'epoch')) {
                defaultOptions.epoch = options.epoch;
            }
            if (Reflect.has(options, 'seqMask')) {
                defaultOptions.seqMask = options.seqMask;
            }
            if (Reflect.has(options, 'enableClockSkewWait')) {
                defaultOptions.enableClockSkewWait = options.enableClockSkewWait;
            }
            if (Reflect.has(options, 'maxClockSkewWait')) {
                defaultOptions.maxClockSkewWait = options.maxClockSkewWait;
            }
        }
        const instanceKey = JSON.stringify(defaultOptions);
        if (!this.instances.has(instanceKey)) {
            this.instances.set(instanceKey, this.maker(defaultOptions));
        }
        return this.instances.get(instanceKey);
    }
    /**
     * @description 快速生成雪花id，Buffer
     */
    static generateSnowflakeIdBuffer(options) {
        return this.generate(options);
    }
    /**
     * @description 快速生成雪花id，BigInt
     */
    static generateSnowflakeIdBigint(options) {
        const buffer = this.generateSnowflakeIdBuffer(options);
        // 将Buffer转换为BigInt
        let result = 0n;
        for (let i = 0; i < buffer.length; i++) {
            result = (result << 8n) | BigInt(buffer[i]);
        }
        return result;
    }
    /**
     * @description 快速生成雪花id，String(BigInt)
     */
    static generateSnowflakeIdString(options) {
        return String(this.generateSnowflakeIdBigint(options));
    }
    /**
     * @description Snowflake Instance
     */
    static getInstance() {
        let instance = this.instance;
        if (!instance || !(instance instanceof this)) {
            instance = this.instance = new Snowflake();
        }
        return instance;
    }
}
/**
 * 快速生成雪花id，Buffer
 * @param options
 * @return Buffer
 */
export const generateSnowflakeIdBuffer = (options) => {
    return isObject(options) ? Snowflake.generate(options) : Snowflake.generate();
};
/**
 * 快速生成雪花id，BigInt
 * @param options
 * @return BigInt
 */
export const generateSnowflakeIdBigint = (options) => {
    return Snowflake.generateSnowflakeIdBigint(options);
};
/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 * @return String(BigInt)
 */
export const generateSnowflakeIdString = (options) => {
    return Snowflake.generateSnowflakeIdString(options);
};
/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 */
export const snowflakeId = (options) => {
    return generateSnowflakeIdString(options);
};
// 导出新的便捷函数
/**
 * 生成雪花ID（字符串格式）
 * @param options
 * @returns 字符串格式的雪花ID
 */
export const generateSnowflakeId = (options) => {
    return Snowflake.generateString(options);
};
/**
 * 批量生成雪花ID（字符串格式）
 * @param count 生成数量
 * @param options
 * @returns 字符串格式的雪花ID数组
 */
export const generateSnowflakeIds = (count, options) => {
    return Snowflake.generateBatch(count, options);
};
/**
 * 生成雪花ID（BigInt格式）
 * @param options
 * @returns BigInt格式的雪花ID
 */
export const generateSnowflakeIdAsBigInt = (options) => {
    return Snowflake.generateSnowflakeIdBigint(options);
};
/**
 * 生成雪花ID（Buffer格式）
 * @param options
 * @returns Buffer格式的雪花ID
 */
export const generateSnowflakeIdAsBuffer = (options) => {
    return Snowflake.generate(options);
};
/**
 * 解析雪花ID
 * @param snowflakeId
 * @param options
 * @returns 解析后的雪花ID组件
 */
export const parseSnowflakeId = (snowflakeId, options) => {
    return Snowflake.deconstruct(snowflakeId, options);
};
/**
 * 验证雪花ID
 * @param snowflakeId
 * @param options
 * @returns 是否有效
 */
export const isValidSnowflakeId = (snowflakeId, options) => {
    return Snowflake.validate(snowflakeId, options);
};
