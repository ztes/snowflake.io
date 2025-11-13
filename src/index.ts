// 优化的雪花ID生成器
import SnowflakeId from './snowflake.js'
import { SnowflakeOptions, SnowflakeDeconstructed, SnowflakeIOOptions, BigInt2String } from './constant.js'
import { isObject, allowedFields } from './util.js'

/**
 * Snowflake
 * @description 雪花算法生成类
 */
export class Snowflake {
  private static instance: Snowflake
  private instances: Map<string, SnowflakeId> = new Map()

  /**
   * @description 生成雪花算法ID (Buffer格式)
   * @param options
   */
  static generate(options: SnowflakeOptions = {}): Buffer {
    const snowflake = this.getInstance().setOptions(options)
    return snowflake.next() as Buffer
  }

  /**
   * @description 生成雪花算法ID (字符串格式)
   * @param options
   */
  static generateString(options: SnowflakeOptions = {}): string {
    const snowflake = this.getInstance().setOptions(options)
    return snowflake.nextId()
  }

  /**
   * @description 批量生成雪花ID (字符串格式)
   * @param count 生成数量
   * @param options
   */
  static generateBatch(count: number, options: SnowflakeOptions = {}): string[] {
    const snowflake = this.getInstance().setOptions(options)
    return snowflake.nextIds(count)
  }

  /**
   * @description 解析雪花ID
   * @param snowflakeId
   * @param options
   */
  static deconstruct(snowflakeId: string | Buffer | bigint, options: SnowflakeOptions = {}): SnowflakeDeconstructed {
    const snowflake = this.getInstance().setOptions(options)
    return snowflake.deconstruct(snowflakeId)
  }

  /**
   * @description 验证雪花ID
   * @param snowflakeId
   * @param options
   */
  static validate(snowflakeId: string | Buffer | bigint, options: SnowflakeOptions = {}): boolean {
    const snowflake = this.getInstance().setOptions(options)
    return snowflake.validate(snowflakeId)
  }

  /**
   * @description 获取雪花ID生成器统计信息
   * @param options
   */
  static getStats(options: SnowflakeOptions = {}) {
    const snowflake = this.getInstance().setOptions(options)
    return snowflake.getStats()
  }

  private maker(options: SnowflakeOptions = {}): SnowflakeId {
    return new SnowflakeId(options)
  }

  /**
   * @description 设置雪花算法配置
   * @param options
   */
  public setOptions(options: SnowflakeOptions): SnowflakeId {
    const defaultOptions: SnowflakeOptions = {}
    if (isObject(options)) {
      options = allowedFields(options, ['datacenter', 'worker', 'id', 'epoch', 'seqMask', 'enableClockSkewWait', 'maxClockSkewWait'])
      if (Reflect.has(options, 'datacenter')) {
        defaultOptions.datacenter = options.datacenter
      }
      if (Reflect.has(options, 'worker')) {
        defaultOptions.worker = options.worker
      }
      if (Reflect.has(options, 'id')) {
        defaultOptions.id = options.id
      }
      if (Reflect.has(options, 'epoch')) {
        defaultOptions.epoch = options.epoch
      }
      if (Reflect.has(options, 'seqMask')) {
        defaultOptions.seqMask = options.seqMask
      }
      if (Reflect.has(options, 'enableClockSkewWait')) {
        defaultOptions.enableClockSkewWait = options.enableClockSkewWait
      }
      if (Reflect.has(options, 'maxClockSkewWait')) {
        defaultOptions.maxClockSkewWait = options.maxClockSkewWait
      }
    }
    const instanceKey = JSON.stringify(defaultOptions)
    if (!this.instances.has(instanceKey)) {
      this.instances.set(instanceKey, this.maker(defaultOptions))
    }
    return this.instances.get(instanceKey) as SnowflakeId
  }

  /**
   * @description 快速生成雪花id，Buffer
   */
  static generateSnowflakeIdBuffer(options?: SnowflakeOptions): Buffer {
    return this.generate(options)
  }

  /**
   * @description 快速生成雪花id，BigInt
   */
  static generateSnowflakeIdBigint(options?: SnowflakeOptions): BigInt {
    const buffer = this.generateSnowflakeIdBuffer(options)
    // 将Buffer转换为BigInt
    let result = 0n
    for (let i = 0; i < buffer.length; i++) {
      result = (result << 8n) | BigInt(buffer[i])
    }
    return result as BigInt
  }

  /**
   * @description 快速生成雪花id，String(BigInt)
   */
  static generateSnowflakeIdString(options?: SnowflakeOptions): BigInt2String {
    return String(this.generateSnowflakeIdBigint(options))
  }

  /**
   * @description Snowflake Instance
   */
  static getInstance(): Snowflake {
    let instance = this.instance
    if (!instance || !(instance instanceof this)) {
      instance = this.instance = new Snowflake()
    }
    return instance
  }
}

/**
 * 快速生成雪花id，Buffer
 * @param options
 * @return Buffer
 */
export const generateSnowflakeIdBuffer = (options?: SnowflakeOptions): Buffer => {
  return isObject(options) ? Snowflake.generate(options) : Snowflake.generate()
}

/**
 * 快速生成雪花id，BigInt
 * @param options
 * @return BigInt
 */
export const generateSnowflakeIdBigint = (options?: SnowflakeOptions): BigInt => {
  return Snowflake.generateSnowflakeIdBigint(options)
}

/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 * @return String(BigInt)
 */
export const generateSnowflakeIdString = (options?: SnowflakeOptions): BigInt2String => {
  return Snowflake.generateSnowflakeIdString(options)
}

/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 */
export const snowflakeId = (options?: SnowflakeOptions): BigInt2String => {
  return generateSnowflakeIdString(options)
}

// 导出新的便捷函数
/**
 * 生成雪花ID字符串
 * @param options
 * @returns 字符串格式的雪花ID
 */
export const generateSnowflakeString = (options?: SnowflakeOptions): string => {
  return Snowflake.generateString(options)
}

/**
 * 批量生成雪花ID字符串
 * @param count 生成数量
 * @param options
 * @returns 字符串格式的雪花ID数组
 */
export const generateSnowflakeBatch = (count: number, options?: SnowflakeOptions): string[] => {
  return Snowflake.generateBatch(count, options)
}

/**
 * 解析雪花ID
 * @param snowflakeId
 * @param options
 * @returns 解析后的雪花ID组件
 */
export const deconstructSnowflake = (snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): SnowflakeDeconstructed => {
  return Snowflake.deconstruct(snowflakeId, options)
}

/**
 * 验证雪花ID
 * @param snowflakeId
 * @param options
 * @returns 是否有效
 */
export const validateSnowflake = (snowflakeId: string | Buffer | bigint, options?: SnowflakeOptions): boolean => {
  return Snowflake.validate(snowflakeId, options)
}

export { SnowflakeOptions, SnowflakeDeconstructed, SnowflakeIOOptions }
