import type { SnowflakeOptions, SnowflakeDeconstructed } from './constant.js'

class SnowflakeId {
  private static readonly NODE_ID_BITS = 10n
  private static readonly SEQUENCE_BITS = 12n
  private static readonly TIMESTAMP_BITS = 41n
  
  private static readonly MAX_NODE_ID = (1n << SnowflakeId.NODE_ID_BITS) - 1n
  private static readonly MAX_SEQUENCE = (1n << SnowflakeId.SEQUENCE_BITS) - 1n
  private static readonly MAX_TIMESTAMP = (1n << SnowflakeId.TIMESTAMP_BITS) - 1n
  
  private static readonly NODE_ID_SHIFT = SnowflakeId.SEQUENCE_BITS
  private static readonly TIMESTAMP_SHIFT = SnowflakeId.NODE_ID_SHIFT + SnowflakeId.NODE_ID_BITS
  
  private static readonly DEFAULT_EPOCH = 1577836800000n
  
  private readonly nodeId: bigint
  private readonly epoch: bigint
  private readonly clockSkewHandler: 'throw' | 'wait' | 'auto_adjust'
  private readonly maxClockSkewWait: number
  
  private sequence: bigint = 0n
  private lastTimestamp: bigint = -1n
  private clockBackwardsCount: number = 0
  private totalGenerated: number = 0
  
  private asyncQueue: Array<() => void> = []
  private asyncLocked: boolean = false

  constructor(options: SnowflakeOptions = {}) {
    this.nodeId = this.resolveNodeId(options)
    
    if (this.nodeId < 0n || this.nodeId > SnowflakeId.MAX_NODE_ID) {
      throw new Error(`Node ID must be between 0 and ${SnowflakeId.MAX_NODE_ID}, got ${this.nodeId}`)
    }
    
    this.epoch = BigInt(options.epoch || Number(SnowflakeId.DEFAULT_EPOCH))
    this.clockSkewHandler = options.clockSkewHandler ?? 'wait'
    this.maxClockSkewWait = options.maxClockSkewWait ?? 5000
    
    this.validateEpoch()
  }

  private resolveNodeId(options: SnowflakeOptions): bigint {
    if (typeof options.id === 'number') {
      return BigInt(options.id & 0x3ff)
    }
    if (typeof options.id === 'bigint') {
      return options.id & SnowflakeId.MAX_NODE_ID
    }
    if (typeof options.datacenter === 'number' || typeof options.worker === 'number') {
      const datacenter = BigInt(options.datacenter || 0) & 0x1fn
      const worker = BigInt(options.worker || 0) & 0x1fn
      return (datacenter << 5n) | worker
    }
    return this.autoAssignNodeId()
  }

  private autoAssignNodeId(): bigint {
    const pid = process.pid
    const hash = this.simpleHash(pid.toString())
    return BigInt(hash % Number(SnowflakeId.MAX_NODE_ID))
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private validateEpoch(): void {
    const now = BigInt(Date.now())
    if (this.epoch > now) {
      throw new Error('Epoch cannot be in the future')
    }
    const maxEpoch = now - SnowflakeId.MAX_TIMESTAMP
    if (this.epoch < maxEpoch) {
      throw new Error('Epoch is too far in the past, timestamp will overflow')
    }
  }

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

  public nextId(): string {
    return this.doGenerateId()
  }

  public async nextIdAsync(): Promise<string> {
    await this.acquireAsyncLock()
    try {
      return await this.doGenerateIdAsync()
    } finally {
      this.releaseAsyncLock()
    }
  }

  private doGenerateId(): string {
    let timestamp = this.currentTimestamp()
    
    if (timestamp < this.lastTimestamp) {
      timestamp = this.handleClockBackwards(timestamp)
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE
      
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillisSync(this.lastTimestamp)
      }
    } else {
      this.sequence = 0n
    }

    this.lastTimestamp = timestamp
    this.totalGenerated++

    return this.generateId(timestamp, this.sequence).toString()
  }

  private async doGenerateIdAsync(): Promise<string> {
    let timestamp = this.currentTimestamp()
    
    if (timestamp < this.lastTimestamp) {
      timestamp = await this.handleClockBackwardsAsync(timestamp)
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE
      
      if (this.sequence === 0n) {
        timestamp = await this.waitNextMillisAsync(this.lastTimestamp)
      }
    } else {
      this.sequence = 0n
    }

    this.lastTimestamp = timestamp
    this.totalGenerated++

    return this.generateId(timestamp, this.sequence).toString()
  }

  private handleClockBackwards(timestamp: bigint): bigint {
    const skew = Number(this.lastTimestamp - timestamp)
    this.clockBackwardsCount++
    
    switch (this.clockSkewHandler) {
      case 'throw':
        throw new Error(`Clock moved backwards by ${skew}ms. Refusing to generate ID.`)
      
      case 'auto_adjust':
        return this.lastTimestamp
      
      case 'wait':
      default:
        if (skew > this.maxClockSkewWait) {
          throw new Error(
            `Clock skew too large: ${skew}ms. Maximum allowed: ${this.maxClockSkewWait}ms. ` +
            `Consider using 'auto_adjust' mode or increasing maxClockSkewWait.`
          )
        }
        return this.waitNextMillisSync(this.lastTimestamp)
    }
  }

  private async handleClockBackwardsAsync(timestamp: bigint): Promise<bigint> {
    const skew = Number(this.lastTimestamp - timestamp)
    this.clockBackwardsCount++
    
    switch (this.clockSkewHandler) {
      case 'throw':
        throw new Error(`Clock moved backwards by ${skew}ms. Refusing to generate ID.`)
      
      case 'auto_adjust':
        return this.lastTimestamp
      
      case 'wait':
      default:
        if (skew > this.maxClockSkewWait) {
          throw new Error(
            `Clock skew too large: ${skew}ms. Maximum allowed: ${this.maxClockSkewWait}ms.`
          )
        }
        return this.waitNextMillisAsync(this.lastTimestamp)
    }
  }

  private waitNextMillisSync(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp()
    const startTime = Date.now()
    
    while (timestamp <= lastTimestamp) {
      const elapsed = Date.now() - startTime
      if (elapsed > this.maxClockSkewWait) {
        throw new Error(
          `Timeout waiting for next millisecond after ${elapsed}ms. ` +
          `Use async API for better handling.`
        )
      }
      timestamp = this.currentTimestamp()
    }
    return timestamp
  }

  private async waitNextMillisAsync(lastTimestamp: bigint): Promise<bigint> {
    let timestamp = this.currentTimestamp()
    
    while (timestamp <= lastTimestamp) {
      await this.sleep(1)
      timestamp = this.currentTimestamp()
    }
    return timestamp
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async acquireAsyncLock(): Promise<void> {
    if (!this.asyncLocked) {
      this.asyncLocked = true
      return
    }

    return new Promise<void>(resolve => {
      this.asyncQueue.push(resolve)
    })
  }

  private releaseAsyncLock(): void {
    const next = this.asyncQueue.shift()
    if (next) {
      next()
    } else {
      this.asyncLocked = false
    }
  }

  public nextIds(count: number): string[] {
    if (count <= 0) {
      throw new Error('Count must be positive')
    }
    if (count > 10000) {
      throw new Error('Count cannot exceed 10000')
    }

    return this.doGenerateIds(count)
  }

  public async nextIdsAsync(count: number): Promise<string[]> {
    if (count <= 0) {
      throw new Error('Count must be positive')
    }
    if (count > 10000) {
      throw new Error('Count cannot exceed 10000')
    }

    await this.acquireAsyncLock()
    try {
      return await this.doGenerateIdsAsync(count)
    } finally {
      this.releaseAsyncLock()
    }
  }

  private doGenerateIds(count: number): string[] {
    const ids: string[] = []
    let timestamp = this.currentTimestamp()

    if (timestamp < this.lastTimestamp) {
      timestamp = this.handleClockBackwards(timestamp)
    }

    if (timestamp !== this.lastTimestamp) {
      this.sequence = 0n
    }

    for (let i = 0; i < count; i++) {
      this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE
      
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillisSync(timestamp)
      }
      
      ids.push(this.generateId(timestamp, this.sequence).toString())
    }

    this.lastTimestamp = timestamp
    this.totalGenerated += count
    return ids
  }

  private async doGenerateIdsAsync(count: number): Promise<string[]> {
    const ids: string[] = []
    let timestamp = this.currentTimestamp()

    if (timestamp < this.lastTimestamp) {
      timestamp = await this.handleClockBackwardsAsync(timestamp)
    }

    if (timestamp !== this.lastTimestamp) {
      this.sequence = 0n
    }

    for (let i = 0; i < count; i++) {
      this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE
      
      if (this.sequence === 0n) {
        timestamp = await this.waitNextMillisAsync(timestamp)
      }
      
      ids.push(this.generateId(timestamp, this.sequence).toString())
    }

    this.lastTimestamp = timestamp
    this.totalGenerated += count
    return ids
  }

  public deconstruct(snowflakeId: string | Buffer | bigint): SnowflakeDeconstructed {
    let id: bigint
    
    if (typeof snowflakeId === 'string') {
      if (!/^\d+$/.test(snowflakeId.trim())) {
        throw new Error('Invalid snowflake ID format: must be a numeric string')
      }
      id = BigInt(snowflakeId)
    } else if (typeof snowflakeId === 'bigint') {
      id = snowflakeId
    } else {
      id = this.bufferToBigint(snowflakeId)
    }
    
    if (id < 0n) {
      throw new Error('Snowflake ID cannot be negative')
    }
    
    const timestamp = (id >> SnowflakeId.TIMESTAMP_SHIFT) + this.epoch
    const nodeId = Number((id >> SnowflakeId.NODE_ID_SHIFT) & SnowflakeId.MAX_NODE_ID)
    const sequence = Number(id & SnowflakeId.MAX_SEQUENCE)
    
    if (timestamp > BigInt(Date.now()) + BigInt(365 * 24 * 60 * 60 * 1000)) {
      throw new Error('Snowflake ID timestamp is in the far future')
    }
    
    return {
      timestamp: Number(timestamp),
      nodeId,
      sequence,
      epoch: Number(this.epoch)
    }
  }

  public validate(snowflakeId: string | Buffer | bigint): boolean {
    try {
      let id: bigint
      
      if (typeof snowflakeId === 'string') {
        if (snowflakeId.trim() === '' || !/^\d+$/.test(snowflakeId.trim())) {
          return false
        }
        id = BigInt(snowflakeId)
      } else if (typeof snowflakeId === 'bigint') {
        id = snowflakeId
      } else {
        if (snowflakeId.length !== 8) {
          return false
        }
        id = this.bufferToBigint(snowflakeId)
      }
      
      if (id < 0n) return false
      
      const deconstructed = this.deconstruct(snowflakeId)
      const now = Date.now()
      const tenYearsAgo = now - 10 * 365 * 24 * 60 * 60 * 1000
      const oneYearAhead = now + 365 * 24 * 60 * 60 * 1000
      
      if (deconstructed.timestamp < tenYearsAgo || deconstructed.timestamp > oneYearAhead) {
        return false
      }
      
      if (deconstructed.nodeId < 0 || deconstructed.nodeId > Number(SnowflakeId.MAX_NODE_ID)) {
        return false
      }
      
      if (deconstructed.sequence < 0 || deconstructed.sequence > Number(SnowflakeId.MAX_SEQUENCE)) {
        return false
      }
      
      return true
    } catch {
      return false
    }
  }

  public getStats() {
    return {
      nodeId: Number(this.nodeId),
      epoch: Number(this.epoch),
      lastTimestamp: Number(this.lastTimestamp),
      sequence: Number(this.sequence),
      maxSequence: Number(SnowflakeId.MAX_SEQUENCE),
      maxNodeId: Number(SnowflakeId.MAX_NODE_ID),
      clockBackwardsCount: this.clockBackwardsCount,
      totalGenerated: this.totalGenerated
    }
  }

  public getNodeId(): number {
    return Number(this.nodeId)
  }

  public getEpoch(): number {
    return Number(this.epoch)
  }

  private generateId(timestamp: bigint, sequence: bigint): bigint {
    const relativeTimestamp = timestamp - this.epoch
    
    if (relativeTimestamp < 0n) {
      throw new Error('Timestamp is before epoch')
    }
    
    if (relativeTimestamp > SnowflakeId.MAX_TIMESTAMP) {
      throw new Error('Timestamp overflow: epoch is too old or system time is corrupted')
    }
    
    return (relativeTimestamp << SnowflakeId.TIMESTAMP_SHIFT) |
           (this.nodeId << SnowflakeId.NODE_ID_SHIFT) |
           sequence
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now())
  }

  private bigintToBuffer(value: bigint): Buffer {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(value)
    return buffer
  }

  private bufferToBigint(buffer: Buffer): bigint {
    if (buffer.length !== 8) {
      throw new Error('Buffer must be 8 bytes long')
    }
    return buffer.readBigUInt64BE()
  }
}

export default SnowflakeId
