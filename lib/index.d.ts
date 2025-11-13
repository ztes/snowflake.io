/// <reference types="node" />
/// <reference types="node" />
import SnowflakeId from './snowflake.js';
import { SnowflakeOptions, SnowflakeDeconstructed, SnowflakeIOOptions, BigInt2String } from './constant.js';
/**
 * Snowflake
 * @description 雪花算法生成类
 */
export declare class Snowflake {
    private static instance;
    private instances;
    /**
     * @description 生成雪花算法ID (Buffer格式)
     * @param options
     */
    static generate(options?: SnowflakeOptions): Buffer;
    /**
     * @description 生成雪花算法ID (字符串格式)
     * @param options
     */
    static generateString(options?: SnowflakeOptions): string;
    /**
     * @description 批量生成雪花ID (字符串格式)
     * @param count 生成数量
     * @param options
     */
    static generateBatch(count: number, options?: SnowflakeOptions): string[];
    /**
     * @description 解析雪花ID
     * @param snowflakeId
     * @param options
     */
    static deconstruct(snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): SnowflakeDeconstructed;
    /**
     * @description 验证雪花ID
     * @param snowflakeId
     * @param options
     */
    static validate(snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): boolean;
    /**
     * @description 获取雪花ID生成器统计信息
     * @param options
     */
    static getStats(options?: SnowflakeOptions): {
        nodeId: number;
        epoch: number;
        lastTimestamp: number;
        sequence: number;
        maxSequence: number;
        maxNodeId: number;
    };
    private maker;
    /**
     * @description 设置雪花算法配置
     * @param options
     */
    setOptions(options: SnowflakeOptions): SnowflakeId;
    /**
     * @description 快速生成雪花id，Buffer
     */
    static generateSnowflakeIdBuffer(options?: SnowflakeOptions): Buffer;
    /**
     * @description 快速生成雪花id，BigInt
     */
    static generateSnowflakeIdBigint(options?: SnowflakeOptions): BigInt;
    /**
     * @description 快速生成雪花id，String(BigInt)
     */
    static generateSnowflakeIdString(options?: SnowflakeOptions): BigInt2String;
    /**
     * @description Snowflake Instance
     */
    static getInstance(): Snowflake;
}
/**
 * 快速生成雪花id，Buffer
 * @param options
 * @return Buffer
 */
export declare const generateSnowflakeIdBuffer: (options?: SnowflakeOptions) => Buffer;
/**
 * 快速生成雪花id，BigInt
 * @param options
 * @return BigInt
 */
export declare const generateSnowflakeIdBigint: (options?: SnowflakeOptions) => BigInt;
/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 * @return String(BigInt)
 */
export declare const generateSnowflakeIdString: (options?: SnowflakeOptions) => BigInt2String;
/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 */
export declare const snowflakeId: (options?: SnowflakeOptions) => BigInt2String;
/**
 * 生成雪花ID字符串
 * @param options
 * @returns 字符串格式的雪花ID
 */
export declare const generateSnowflakeString: (options?: SnowflakeOptions) => string;
/**
 * 批量生成雪花ID字符串
 * @param count 生成数量
 * @param options
 * @returns 字符串格式的雪花ID数组
 */
export declare const generateSnowflakeBatch: (count: number, options?: SnowflakeOptions) => string[];
/**
 * 解析雪花ID
 * @param snowflakeId
 * @param options
 * @returns 解析后的雪花ID组件
 */
export declare const deconstructSnowflake: (snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions) => SnowflakeDeconstructed;
/**
 * 验证雪花ID
 * @param snowflakeId
 * @param options
 * @returns 是否有效
 */
export declare const validateSnowflake: (snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions) => boolean;
export { SnowflakeOptions, SnowflakeDeconstructed, SnowflakeIOOptions };
