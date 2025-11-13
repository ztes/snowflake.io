/// <reference types="node" />
/// <reference types="node" />
export interface SnowflakeOptions {
    /** 直接指定的10位节点ID (覆盖datacenter和worker) */
    id?: number | bigint;
    /** 数据中心ID (5位) */
    datacenter?: number;
    /** 工作节点ID (5位) */
    worker?: number;
    /** 自定义纪元时间戳 (毫秒) */
    epoch?: number;
    /** 是否启用时钟回拨等待 */
    enableClockSkewWait?: boolean;
    /** 时钟回拨最大等待时间 (毫秒) */
    maxClockSkewWait?: number;
    /** 序列号掩码 (保留兼容性) */
    seqMask?: number;
}
export interface SnowflakeDeconstructed {
    timestamp: number;
    nodeId: number;
    sequence: number;
    epoch: number;
}
export type SnowflakeIdMode = 'Buffer' | 'BigInt' | 'String';
export type SnowflakeId = string | Buffer | bigint;
export type BigInt2String = string;
export type SnowflakeIOOptions = SnowflakeOptions;
