interface FlakeIdOptions {
    id?: number;
    datacenter?: number;
    worker?: number;
    epoch?: number;
    seqMask?: number;
}
declare class FlakeId {
    private options;
    private id;
    private genId;
    private epoch;
    private seq;
    private lastTime;
    private overflow;
    private seqMask;
    static POW10: number;
    static POW26: number;
    private datacenter;
    private worker;
    constructor(options?: FlakeIdOptions);
    next(cb?: (err: Error | null, id?: Buffer) => void): Buffer | undefined;
    private handleOverflow;
    private generateId;
}

interface SnowflakeOptions {
    datacenter?: number | undefined;
    worker?: number | undefined;
    id?: number | undefined;
    epoch?: number | undefined;
    seqMask?: number | undefined;
}
declare type BigInt2String = string;

/**
 * Snowflake
 * @description 雪花算法生成类
 */
declare class Snowflake {
    private static instance;
    private instances;
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
    setOptions(options: SnowflakeOptions): FlakeId;
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

export { Snowflake, generateSnowflakeIdBigint, generateSnowflakeIdBuffer, generateSnowflakeIdString };
