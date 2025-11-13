/// <reference types="node" />
/// <reference types="node" />
import type { SnowflakeOptions, SnowflakeDeconstructed } from './constant.js';
/**
 * 高性能分布式雪花ID生成器
 * 64位结构: [符号位(1) | 时间戳(41) | 节点ID(10) | 序列号(12)]
 *
 * 特性:
 * - 使用BigInt避免JavaScript数字精度问题
 * - 支持时钟回拨检测和处理
 * - 支持批量生成ID
 * - 提供ID解析和验证功能
 * - 线程安全的序列号生成
 */
declare class SnowflakeId {
    private static readonly NODE_ID_BITS;
    private static readonly SEQUENCE_BITS;
    private static readonly TIMESTAMP_BITS;
    private static readonly MAX_NODE_ID;
    private static readonly MAX_SEQUENCE;
    private static readonly NODE_ID_SHIFT;
    private static readonly TIMESTAMP_SHIFT;
    private static readonly DEFAULT_EPOCH;
    private readonly nodeId;
    private readonly epoch;
    private readonly enableClockSkewWait;
    private readonly maxClockSkewWait;
    private sequence;
    private lastTimestamp;
    constructor(options?: SnowflakeOptions);
    /**
     * 生成下一个ID (Buffer格式)
     */
    next(cb?: (err: Error | null, id?: Buffer) => void): Buffer | undefined;
    /**
     * 生成下一个ID (字符串格式)
     */
    nextId(): string;
    /**
     * 批量生成ID (高性能场景)
     */
    nextIds(count: number): string[];
    /**
     * 解析雪花ID
     */
    deconstruct(snowflakeId: string | Buffer | bigint): SnowflakeDeconstructed;
    /**
     * 验证雪花ID格式
     */
    validate(snowflakeId: string | Buffer | bigint): boolean;
    /**
     * 获取统计信息
     */
    getStats(): {
        nodeId: number;
        epoch: number;
        lastTimestamp: number;
        sequence: number;
        maxSequence: number;
        maxNodeId: number;
    };
    private generateId;
    private currentTimestamp;
    private waitNextMillis;
    private wait;
    /**
     * 将BigInt转换为8字节Buffer
     */
    private bigintToBuffer;
    /**
     * 将8字节Buffer转换为BigInt
     */
    private bufferToBigint;
}
export default SnowflakeId;
