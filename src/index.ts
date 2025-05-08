// 后续替换方案
import SnowflakeId from './gen'
import { bufToBigint } from 'bigint-conversion'
import { SnowflakeIOOptions, BigInt2String } from './constant'
import { isObject, allowedFields } from './util'

/**
 * Snowflake
 * @description 雪花算法生成类
 */
export class Snowflake {
  private static instance: Snowflake
  private instances: Map<string, SnowflakeId> = new Map()

  /**
   * @description 生成雪花算法ID
   * @param options
   */
  static generate(options: SnowflakeIOOptions = {}): Buffer {
    const snowflake = this.getInstance().setOptions(options)
    return snowflake.next() as Buffer
  }

  private maker(options: SnowflakeIOOptions = {}): SnowflakeId {
    return new SnowflakeId(options)
  }

  /**
   * @description 设置雪花算法配置
   * @param options
   */
  public setOptions(options: SnowflakeIOOptions): SnowflakeId {
    const defaultOptions: SnowflakeIOOptions = {}
    if (isObject(options)) {
      options = allowedFields(options, ['datacenter', 'worker', 'id', 'epoch', 'seqMask'])
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
  static generateSnowflakeIdBuffer(options?: SnowflakeIOOptions): Buffer {
    return this.generate(options)
  }

  /**
   * @description 快速生成雪花id，BigInt
   */
  static generateSnowflakeIdBigint(options?: SnowflakeIOOptions): BigInt {
    return bufToBigint(this.generateSnowflakeIdBuffer(options))
  }

  /**
   * @description 快速生成雪花id，String(BigInt)
   */
  static generateSnowflakeIdString(options?: SnowflakeIOOptions): BigInt2String {
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
export const generateSnowflakeIdBuffer = (options?: SnowflakeIOOptions): Buffer => {
  return isObject(options) ? Snowflake.generate(options) : Snowflake.generate()
}

/**
 * 快速生成雪花id，BigInt
 * @param options
 * @return BigInt
 */
export const generateSnowflakeIdBigint = (options?: SnowflakeIOOptions): BigInt => {
  return bufToBigint(generateSnowflakeIdBuffer(options))
}

/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 * @return String(BigInt)
 */
export const generateSnowflakeIdString = (options?: SnowflakeIOOptions): BigInt2String => {
  return String(generateSnowflakeIdBigint(options))
}

/**
 * 快速生成雪花id，String(BigInt)
 * @param options
 */
export const snowflakeId = (options?: SnowflakeIOOptions): BigInt2String => {
  return generateSnowflakeIdString(options)
}

export { SnowflakeIOOptions }
