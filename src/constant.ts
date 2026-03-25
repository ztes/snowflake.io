export interface SnowflakeOptions {
  /** 直接指定的10位节点ID (覆盖datacenter和worker) */
  id?: number | bigint
  /** 数据中心ID (5位) */
  datacenter?: number
  /** 工作节点ID (5位) */
  worker?: number
  /** 自定义纪元时间戳 (毫秒) */
  epoch?: number
  /** 时钟回拨处理策略: 'throw' 抛出异常 | 'wait' 等待 | 'auto_adjust' 自动调整 */
  clockSkewHandler?: 'throw' | 'wait' | 'auto_adjust'
  /** 时钟回拨最大等待时间 (毫秒)，仅当 clockSkewHandler='wait' 时有效 */
  maxClockSkewWait?: number
}

export interface SnowflakeDeconstructed {
  timestamp: number
  nodeId: number
  sequence: number
  epoch: number
}

export type SnowflakeIdInput = string | Buffer | bigint
