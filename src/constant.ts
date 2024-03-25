export interface SnowflakeOptions {
  datacenter?: number | undefined;
  worker?: number | undefined;
  id?: number | undefined;
  epoch?: number | undefined;
  seqMask?: number | undefined;
}

export type SnowflakeIdMode = 'Buffer' | 'BigInt' | 'String';
export type SnowflakeId = string | Buffer | bigint;

export type BigInt2String = string;
