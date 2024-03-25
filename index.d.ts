interface SnowflakeOptions {
    datacenter?: number | undefined;
    worker?: number | undefined;
    id?: number | undefined;
    epoch?: number | undefined;
    seqMask?: number | undefined;
}
declare type BigInt2String = string;

interface SnowflakeId {
    constructor(options?: SnowflakeOptions): this;
    next(callback?: (err: Error, id: Buffer) => void): Buffer;
}
/**
 * Snowflake
 * @description 雪花算法生成类
 */
declare class Snowflake {
    private static instance;
    private instances;
    private options;
    /**
     * @description 生成雪花算法ID
     * @param options
     */
    static generate(options?: SnowflakeOptions): Buffer;
    private maker;
    /**
     * @description 设置雪花算法配置
     * @param options
     */
    setOptions(options: SnowflakeOptions): any;
    /**
     * @description 获取雪花算法配置
     */
    static get getOptions(): SnowflakeOptions;
    /**
     * @description 快速生成雪花id，Buffer
     */
    static generateSnowflakeIdBuffer(options?: SnowflakeOptions): Buffer;
    /**
     * @description 快速生成雪花id，BigInt
     */
    static generateSnowflakeIdBigint(): BigInt;
    /**
     * @description 快速生成雪花id，String(BigInt)
     */
    static generateSnowflakeIdString(): BigInt2String;
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
declare const generateSnowflakeIdBuffer: (options?: SnowflakeOptions) => Buffer;
/**
 * 快速生成雪花id，BigInt
 * @param options
 * @return BigInt
 */
declare const generateSnowflakeIdBigint: (options?: SnowflakeOptions) => BigInt;
/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 * @return String(BigInt)
 */
declare const generateSnowflakeIdString: (options?: SnowflakeOptions) => BigInt2String;

export { Snowflake, SnowflakeId, generateSnowflakeIdBigint, generateSnowflakeIdBuffer, generateSnowflakeIdString };
