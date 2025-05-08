export interface SnowflakeIOOptions {
  id?: number // 直接指定的10位ID (覆盖datacenter和worker)
  datacenter?: number // 数据中心ID (5位)
  worker?: number // 工作节点ID (5位)
  epoch?: number // 自定义起始时间戳 (毫秒)
  seqMask?: number // 序列号掩码 (默认12位)
}

export type SnowflakeIdMode = 'Buffer' | 'BigInt' | 'String'
export type SnowflakeId = string | Buffer | bigint

export type BigInt2String = string
