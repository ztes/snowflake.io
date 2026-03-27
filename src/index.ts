import SnowflakeId from './snowflake.js'
import type {
  SnowflakeDeconstructed,
  SnowflakeIdInput,
  SnowflakeNodeInfo,
  SnowflakeOptions,
  SnowflakeStats
} from './constant.js'

class Snowflake {
  private static instance: Snowflake
  private instances: Map<string, SnowflakeId> = new Map()

  static generate(options: SnowflakeOptions = {}): Buffer {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.next() as Buffer
  }

  static generateId(options: SnowflakeOptions = {}): string {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.nextId()
  }

  static async generateIdAsync(options: SnowflakeOptions = {}): Promise<string> {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.nextIdAsync()
  }

  static generateIds(count: number, options: SnowflakeOptions = {}): string[] {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.nextIds(count)
  }

  static async generateIdsAsync(count: number, options: SnowflakeOptions = {}): Promise<string[]> {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.nextIdsAsync(count)
  }

  static deconstruct(snowflakeId: SnowflakeIdInput, options: SnowflakeOptions = {}): SnowflakeDeconstructed {
    const snowflake = this.getOrCreateDecoderInstance(options)
    return snowflake.deconstruct(snowflakeId)
  }

  static validate(snowflakeId: SnowflakeIdInput, options: SnowflakeOptions = {}): boolean {
    const snowflake = this.getOrCreateDecoderInstance(options)
    return snowflake.validate(snowflakeId)
  }

  static getStats(options: SnowflakeOptions = {}): SnowflakeStats {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.getStats()
  }

  static getNodeInfo(options: SnowflakeOptions = {}): SnowflakeNodeInfo {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.getNodeInfo()
  }

  static getNodeId(options: SnowflakeOptions = {}): number {
    const snowflake = this.getOrCreateInstance(options)
    return snowflake.getNodeId()
  }

  static composeNodeId(datacenter: number | bigint, worker: number | bigint): number {
    return SnowflakeId.composeNodeId(datacenter, worker)
  }

  static decomposeNodeId(nodeId: number | bigint): SnowflakeNodeInfo {
    return SnowflakeId.decomposeNodeId(nodeId)
  }

  private static getOrCreateInstance(options: SnowflakeOptions): SnowflakeId {
    const key = this.createCacheKey(options)
    
    let instance = this.getInstance().instances.get(key)
    if (!instance) {
      instance = new SnowflakeId(options)
      this.getInstance().instances.set(key, instance)
    }
    return instance
  }

  private static getOrCreateDecoderInstance(options: SnowflakeOptions): SnowflakeId {
    if (
      options.id !== undefined ||
      options.datacenter !== undefined ||
      options.worker !== undefined ||
      options.allowUnsafeAutoNodeId === true
    ) {
      return this.getOrCreateInstance(options)
    }

    return this.getOrCreateInstance({ ...options, id: 0 })
  }

  private static createCacheKey(options: SnowflakeOptions): string {
    const sortedKeys = Object.keys(options).sort()
    const parts: string[] = []
    
    for (const key of sortedKeys) {
      const value = options[key as keyof SnowflakeOptions]
      if (value !== undefined) {
        parts.push(`${key}:${value}`)
      }
    }
    
    return parts.join('|')
  }

  private static getInstance(): Snowflake {
    if (!this.instance) {
      this.instance = new Snowflake()
    }
    return this.instance
  }
}

function generateId(options?: SnowflakeOptions): string {
  return Snowflake.generateId(options)
}

async function generateIdAsync(options?: SnowflakeOptions): Promise<string> {
  return Snowflake.generateIdAsync(options)
}

function generateIds(count: number, options?: SnowflakeOptions): string[] {
  return Snowflake.generateIds(count, options)
}

async function generateIdsAsync(count: number, options?: SnowflakeOptions): Promise<string[]> {
  return Snowflake.generateIdsAsync(count, options)
}

function parseId(snowflakeId: SnowflakeIdInput, options?: SnowflakeOptions): SnowflakeDeconstructed {
  return Snowflake.deconstruct(snowflakeId, options)
}

function isValidId(snowflakeId: SnowflakeIdInput, options?: SnowflakeOptions): boolean {
  return Snowflake.validate(snowflakeId, options)
}

function getNodeInfo(options?: SnowflakeOptions): SnowflakeNodeInfo {
  return Snowflake.getNodeInfo(options)
}

function composeNodeId(datacenter: number | bigint, worker: number | bigint): number {
  return Snowflake.composeNodeId(datacenter, worker)
}

function decomposeNodeId(nodeId: number | bigint): SnowflakeNodeInfo {
  return Snowflake.decomposeNodeId(nodeId)
}

export {
  Snowflake,
  generateId,
  generateIdAsync,
  generateIds,
  generateIdsAsync,
  parseId,
  isValidId,
  getNodeInfo,
  composeNodeId,
  decomposeNodeId
}

export type {
  SnowflakeOptions,
  SnowflakeDeconstructed,
  SnowflakeIdInput,
  SnowflakeNodeInfo,
  SnowflakeStats
}
