/// <reference types="node" />
/// <reference types="node" />
import type { SnowflakeIOOptions } from './constant.js';
/**
 * 分布式ID生成器 (雪花算法改进版)
 * 64位ID结构: [时间戳(42位) | 节点ID(10位) | 序列号(12位)]
 */
declare class SnowflakeId {
    private static readonly MAX_DATACENTER;
    private static readonly MAX_WORKER;
    private static readonly MAX_SEQUENCE;
    private readonly id;
    private readonly genId;
    private readonly epoch;
    private readonly seqMask;
    private seq;
    private lastTime;
    private overflow;
    constructor(options?: SnowflakeIOOptions);
    next(cb?: (err: Error | null, id?: Buffer) => void): Buffer | undefined;
    private handleClockBackwards;
    private handleOverflow;
    private generateId;
}
export default SnowflakeId;
