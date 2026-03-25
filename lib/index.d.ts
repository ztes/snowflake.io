import SnowflakeId from './snowflake.js';
import type { SnowflakeOptions, SnowflakeDeconstructed, SnowflakeIdInput } from './constant.js';
declare class Snowflake {
    private static instance;
    private instances;
    static generate(options?: SnowflakeOptions): Buffer;
    static generateId(options?: SnowflakeOptions): string;
    static generateIdAsync(options?: SnowflakeOptions): Promise<string>;
    static generateIds(count: number, options?: SnowflakeOptions): string[];
    static generateIdsAsync(count: number, options?: SnowflakeOptions): Promise<string[]>;
    static deconstruct(snowflakeId: SnowflakeIdInput, options?: SnowflakeOptions): SnowflakeDeconstructed;
    static validate(snowflakeId: SnowflakeIdInput, options?: SnowflakeOptions): boolean;
    static getStats(options?: SnowflakeOptions): ReturnType<SnowflakeId['getStats']>;
    static getNodeId(options?: SnowflakeOptions): number;
    private static getOrCreateInstance;
    private static createCacheKey;
    private static getInstance;
}
declare function generateId(options?: SnowflakeOptions): string;
declare function generateIdAsync(options?: SnowflakeOptions): Promise<string>;
declare function generateIds(count: number, options?: SnowflakeOptions): string[];
declare function generateIdsAsync(count: number, options?: SnowflakeOptions): Promise<string[]>;
declare function parseId(snowflakeId: SnowflakeIdInput, options?: SnowflakeOptions): SnowflakeDeconstructed;
declare function isValidId(snowflakeId: SnowflakeIdInput, options?: SnowflakeOptions): boolean;
export { Snowflake, generateId, generateIdAsync, generateIds, generateIdsAsync, parseId, isValidId };
export type { SnowflakeOptions, SnowflakeDeconstructed, SnowflakeIdInput };
//# sourceMappingURL=index.d.ts.map