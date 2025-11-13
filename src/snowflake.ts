import type { SnowflakeOptions, SnowflakeDeconstructed } from './constant.js'

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
class SnowflakeId {
  // 常量定义 (使用 BigInt 避免精度问题)
  private static readonly NODE_ID_BITS = 10n
  private static readonly SEQUENCE_BITS = 12n
  private static readonly TIMESTAMP_BITS = 41n
  
  private static readonly MAX_NODE_ID = (1n << SnowflakeId.NODE_ID_BITS) - 1n
  private static readonly MAX_SEQUENCE = (1n << SnowflakeId.SEQUENCE_BITS) - 1n
  
  private static readonly NODE_ID_SHIFT = SnowflakeId.SEQUENCE_BITS
  private static readonly TIMESTAMP_SHIFT = SnowflakeId.NODE_ID_SHIFT + SnowflakeId.NODE_ID_BITS
  
  // 默认纪元: 2020-01-01 00:00:00 UTC
  private static readonly DEFAULT_EPOCH = 1577836800000n
  
  private readonly nodeId: bigint
  private readonly epoch: bigint
  private readonly enableClockSkewWait: boolean
  private readonly maxClockSkewWait: number
  
  private sequence: bigint = 0n
  private lastTimestamp: bigint = -1n
  
  constructor(options: SnowflakeOptions = {}) {
    // 处理节点ID
    if (typeof options.id === 'number') {
      this.nodeId = BigInt(options.id & 0x3ff)
    } else if (typeof options.id === 'bigint') {
      this.nodeId = options.id & SnowflakeId.MAX_NODE_ID
    } else {
      // 兼容原有的datacenter和worker模式
      const datacenter = BigInt(options.datacenter || 0) & 0x1fn
      const worker = BigInt(options.worker || 0) & 0x1fn
      this.nodeId = (datacenter << 5n) | worker
    }
    
    if (this.nodeId < 0n || this.nodeId > SnowflakeId.MAX_NODE_ID) {
      throw new Error(`Node ID must be between 0 and ${SnowflakeId.MAX_NODE_ID}`)
    }
    
    this.epoch = BigInt(options.epoch || Number(SnowflakeId.DEFAULT_EPOCH))
    this.enableClockSkewWait = options.enableClockSkewWait ?? true
    this.maxClockSkewWait = options.maxClockSkewWait ?? 10000
  }

  /**
   * 生成下一个ID (Buffer格式)
   */
  public next(cb?: (err: Error | null, id?: Buffer) => void): Buffer | undefined {
    try {
      const id = this.nextId()
      const buffer = this.bigintToBuffer(BigInt(id))
      
      if (cb) {
        process.nextTick(() => cb(null, buffer))
        return
      }
      
      return buffer
    } catch (error) {
      if (cb) {
        process.nextTick(() => cb(error as Error))
        return
      }
      
      throw error
    }
  }

  /**
   * 生成下一个ID (字符串格式)
   */
  public nextId(): string {
    let timestamp = this.currentTimestamp()
    let sequence: bigint

    // 处理时钟回拨
    if (timestamp < this.lastTimestamp) {
      if (!this.enableClockSkewWait) {
        throw new Error(`Clock moved backwards. Refusing to generate ID for ${Number(this.lastTimestamp - timestamp)}ms`)
      }
      
      const waitTime = Number(this.lastTimestamp - timestamp)
      if (waitTime > this.maxClockSkewWait) {
        throw new Error(`Clock skew too large: ${waitTime}ms. Maximum allowed: ${this.maxClockSkewWait}ms`)
      }
      
      this.wait(waitTime)
      timestamp = this.currentTimestamp()
    }

    // 处理同一毫秒内的序列号
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE
      
      // 序列号耗尽，等待下一毫秒
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(this.lastTimestamp)
      }
    } else {
      this.sequence = 0n
    }

    this.lastTimestamp = timestamp
    sequence = this.sequence

    return this.generateId(timestamp, sequence).toString()
  }

  /**
   * 批量生成ID (高性能场景)
   */
  public nextIds(count: number): string[] {
    if (count <= 0 || count > 1000) {
      throw new Error('Count must be between 1 and 1000')
    }

    const ids: string[] = []
    let timestamp = this.currentTimestamp()

    // 处理时钟回拨
    if (timestamp < this.lastTimestamp) {
      if (!this.enableClockSkewWait) {
        throw new Error('Clock moved backwards')
      }
      this.wait(Number(this.lastTimestamp - timestamp))
      timestamp = this.currentTimestamp()
    }

    // 如果时间戳变化或首次生成，重置序列号
    if (timestamp !== this.lastTimestamp) {
      this.sequence = 0n
    }

    for (let i = 0; i < count; i++) {
      this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE
      
      // 序列号耗尽，等待下一毫秒
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(timestamp)
      }
      
      ids.push(this.generateId(timestamp, this.sequence).toString())
    }

    this.lastTimestamp = timestamp
    return ids
  }

  /**
   * 解析雪花ID
   */
  public deconstruct(snowflakeId: string | Buffer | bigint): SnowflakeDeconstructed {
    let id: bigint
    
    if (typeof snowflakeId === 'string') {
      id = BigInt(snowflakeId)
    } else if (typeof snowflakeId === 'bigint') {
      id = snowflakeId
    } else {
      // Buffer
      id = this.bufferToBigint(snowflakeId)
    }
    
    const timestamp = (id >> SnowflakeId.TIMESTAMP_SHIFT) + this.epoch
    const nodeId = Number((id >> SnowflakeId.NODE_ID_SHIFT) & SnowflakeId.MAX_NODE_ID)
    const sequence = Number(id & SnowflakeId.MAX_SEQUENCE)
    
    return {
      timestamp: Number(timestamp),
      nodeId,
      sequence,
      epoch: Number(this.epoch)
    }
  }

  /**
   * 验证雪花ID格式
   */
  public validate(snowflakeId: string | Buffer | bigint): boolean {
    try {
      let id: bigint
      
      if (typeof snowflakeId === 'string') {
        // 检查空字符串
        if (snowflakeId.trim() === '') {
          return false
        }
        id = BigInt(snowflakeId)
      } else if (typeof snowflakeId === 'bigint') {
        id = snowflakeId
      } else {
        // Buffer
        id = this.bufferToBigint(snowflakeId)
      }
      
      if (id < 0n) return false
      
      const deconstructed = this.deconstruct(snowflakeId)
      const now = Date.now()
      
      // 检查时间戳是否在合理范围内 (过去10年到未来1年)
      if (deconstructed.timestamp < now - 10 * 365 * 24 * 60 * 60 * 1000 ||
          deconstructed.timestamp > now + 365 * 24 * 60 * 60 * 1000) {
        return false
      }
      
      // 检查节点ID和序列号范围
      if (deconstructed.nodeId < 0 || deconstructed.nodeId > Number(SnowflakeId.MAX_NODE_ID) ||
          deconstructed.sequence < 0 || deconstructed.sequence > Number(SnowflakeId.MAX_SEQUENCE)) {
        return false
      }
      
      return true
    } catch {
      return false
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
      maxSequence: Number(SnowflakeId.MAX_SEQUENCE),
      maxNodeId: Number(SnowflakeId.MAX_NODE_ID)
    }
  }

  private generateId(timestamp: bigint, sequence: bigint): bigint {
    return ((timestamp - this.epoch) << SnowflakeId.TIMESTAMP_SHIFT) |
           (this.nodeId << SnowflakeId.NODE_ID_SHIFT) |
           sequence
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now())
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp()
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp()
    }
    return timestamp
  }

  private wait(ms: number): void {
    const start = Date.now()
    while (Date.now() - start < ms) {
      // 忙等待
    }
  }

  /**
   * 将BigInt转换为8字节Buffer
   */
  private bigintToBuffer(value: bigint): Buffer {
    const buffer = Buffer.alloc(8)
    
    // 高位32位
    buffer.writeUInt32BE(Number(value >> 32n), 0)
    
    // 低位32位
    buffer.writeUInt32BE(Number(value & 0xffffffffn), 4)
    
    return buffer
  }

  /**
   * 将8字节Buffer转换为BigInt
   */
  private bufferToBigint(buffer: Buffer): bigint {
    if (buffer.length !== 8) {
      throw new Error('Buffer must be 8 bytes long')
    }
    
    const high = buffer.readUInt32BE(0)
    const low = buffer.readUInt32BE(4)
    
    return (BigInt(high) << 32n) | BigInt(low)
  }
}

export default SnowflakeId