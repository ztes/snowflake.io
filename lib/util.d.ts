export declare function isObject(obj: any): obj is Record<string, unknown>;
export declare function isEmptyObject(obj: any): boolean;
export declare function isEmpty(obj: any): boolean;
/**
 * 允许【仅允许】字段，即仅允许fields中的字段 * @param data
 * @param data
 * @param fields
 */
export declare function allowedFields<T extends string[]>(data: unknown, fields: T): Record<string, any>;
