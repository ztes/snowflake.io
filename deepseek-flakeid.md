```typescript
// types/snowflake.ts
export interface SnowflakeOptions {
  /** 节点ID (0-1023) */
  nodeId?: number;
  /** 自定义纪元时间戳 (毫秒) */
  epoch?: number;
  /** 是否启用时钟回拨等待 */
  enableClockSkewWait?: boolean;
  /** 时钟回拨最大等待时间 (毫秒) */
  maxClockSkewWait?: number;
}

export interface SnowflakeDeconstructed {
  timestamp: number;
  nodeId: number;
  sequence: number;
  epoch: number;
}
// utils/snowflake.ts
import { SnowflakeOptions, SnowflakeDeconstructed } from '../types/snowflake';

/**
 * 高精度分布式雪花ID生成器
 * 64位结构: [符号位(1) | 时间戳(41) | 节点ID(10) | 序列号(12)]
 */
class HighPrecisionSnowflake {
  // 常量定义 (使用 BigInt 避免精度问题)
  private static readonly NODE_ID_BITS = 10n;
  private static readonly SEQUENCE_BITS = 12n;
  private static readonly TIMESTAMP_BITS = 41n;
  
  private static readonly MAX_NODE_ID = (1n << HighPrecisionSnowflake.NODE_ID_BITS) - 1n;
  private static readonly MAX_SEQUENCE = (1n << HighPrecisionSnowflake.SEQUENCE_BITS) - 1n;
  
  private static readonly NODE_ID_SHIFT = HighPrecisionSnowflake.SEQUENCE_BITS;
  private static readonly TIMESTAMP_SHIFT = HighPrecisionSnowflake.NODE_ID_SHIFT + HighPrecisionSnowflake.NODE_ID_BITS;
  
  // 默认纪元: 2020-01-01 00:00:00 UTC
  private static readonly DEFAULT_EPOCH = 1577836800000n;
  
  private readonly nodeId: bigint;
  private readonly epoch: bigint;
  private readonly enableClockSkewWait: boolean;
  private readonly maxClockSkewWait: number;
  
  private sequence: bigint = 0n;
  private lastTimestamp: bigint = -1n;
  private readonly sequenceMutex = Promise.resolve();
  
  constructor(options: SnowflakeOptions = {}) {
    const nodeId = BigInt(options.nodeId ?? 0);
    
    if (nodeId < 0n || nodeId > HighPrecisionSnowflake.MAX_NODE_ID) {
      throw new Error(`Node ID must be between 0 and ${HighPrecisionSnowflake.MAX_NODE_ID}`);
    }
    
    this.nodeId = nodeId;
    this.epoch = BigInt(options.epoch ?? Number(HighPrecisionSnowflake.DEFAULT_EPOCH));
    this.enableClockSkewWait = options.enableClockSkewWait ?? true;
    this.maxClockSkewWait = options.maxClockSkewWait ?? 10000;
  }

  /**
   * 生成下一个ID
   */
  public nextId(): string {
    let timestamp = this.currentTimestamp();
    let sequence: bigint;

    // 处理时钟回拨
    if (timestamp < this.lastTimestamp) {
      if (!this.enableClockSkewWait) {
        throw new Error(`Clock moved backwards. Refusing to generate ID for ${Number(this.lastTimestamp - timestamp)}ms`);
      }
      
      const waitTime = Number(this.lastTimestamp - timestamp);
      if (waitTime > this.maxClockSkewWait) {
        throw new Error(`Clock skew too large: ${waitTime}ms. Maximum allowed: ${this.maxClockSkewWait}ms`);
      }
      
      this.wait(waitTime);
      timestamp = this.currentTimestamp();
    }

    // 处理同一毫秒内的序列号
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & HighPrecisionSnowflake.MAX_SEQUENCE;
      
      // 序列号耗尽，等待下一毫秒
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;
    sequence = this.sequence;

    return this.generateId(timestamp, sequence).toString();
  }

  /**
   * 批量生成ID (高性能场景)
   */
  public nextIds(count: number): string[] {
    if (count <= 0 || count > 1000) {
      throw new Error('Count must be between 1 and 1000');
    }

    const ids: string[] = [];
    let timestamp = this.currentTimestamp();

    // 处理时钟回拨
    if (timestamp < this.lastTimestamp) {
      if (!this.enableClockSkewWait) {
        throw new Error('Clock moved backwards');
      }
      this.wait(Number(this.lastTimestamp - timestamp));
      timestamp = this.currentTimestamp();
    }

    // 如果时间戳变化或首次生成，重置序列号
    if (timestamp !== this.lastTimestamp) {
      this.sequence = 0n;
    }

    for (let i = 0; i < count; i++) {
      this.sequence = (this.sequence + 1n) & HighPrecisionSnowflake.MAX_SEQUENCE;
      
      // 序列号耗尽，等待下一毫秒
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(timestamp);
      }
      
      ids.push(this.generateId(timestamp, this.sequence).toString());
    }

    this.lastTimestamp = timestamp;
    return ids;
  }

  /**
   * 解析雪花ID
   */
  public deconstruct(snowflakeId: string): SnowflakeDeconstructed {
    const id = BigInt(snowflakeId);
    
    const timestamp = (id >> HighPrecisionSnowflake.TIMESTAMP_SHIFT) + this.epoch;
    const nodeId = Number((id >> HighPrecisionSnowflake.NODE_ID_SHIFT) & HighPrecisionSnowflake.MAX_NODE_ID);
    const sequence = Number(id & HighPrecisionSnowflake.MAX_SEQUENCE);
    
    return {
      timestamp: Number(timestamp),
      nodeId,
      sequence,
      epoch: Number(this.epoch)
    };
  }

  /**
   * 验证雪花ID格式
   */
  public validate(snowflakeId: string): boolean {
    try {
      const id = BigInt(snowflakeId);
      if (id < 0n) return false;
      
      const deconstructed = this.deconstruct(snowflakeId);
      const now = Date.now();
      
      // 检查时间戳是否在合理范围内 (过去10年到未来1年)
      if (deconstructed.timestamp < now - 10 * 365 * 24 * 60 * 60 * 1000 ||
          deconstructed.timestamp > now + 365 * 24 * 60 * 60 * 1000) {
        return false;
      }
      
      // 检查节点ID和序列号范围
      if (deconstructed.nodeId < 0 || deconstructed.nodeId > Number(HighPrecisionSnowflake.MAX_NODE_ID) ||
          deconstructed.sequence < 0 || deconstructed.sequence > Number(HighPrecisionSnowflake.MAX_SEQUENCE)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    return {
      nodeId: Number(this.nodeId),
      epoch: Number(this.epoch),
      lastTimestamp: Number(this.lastTimestamp),
      sequence: Number(this.sequence),
      maxSequence: Number(HighPrecisionSnowflake.MAX_SEQUENCE),
      maxNodeId: Number(HighPrecisionSnowflake.MAX_NODE_ID)
    };
  }

  private generateId(timestamp: bigint, sequence: bigint): bigint {
    return ((timestamp - this.epoch) << HighPrecisionSnowflake.TIMESTAMP_SHIFT) |
           (this.nodeId << HighPrecisionSnowflake.NODE_ID_SHIFT) |
           sequence;
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }

  private wait(ms: number): void {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // 忙等待
    }
  }
}

export default HighPrecisionSnowflake;

