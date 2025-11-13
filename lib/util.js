const opt = Object.prototype.toString;
export function isObject(obj) {
    return opt.call(obj) === '[object Object]';
}
export function isEmptyObject(obj) {
    return isObject(obj) && Object.keys(obj).length === 0;
}
export function isEmpty(obj) {
    // null undefined '' 排除 0
    if (!obj && obj !== 0) {
        return true;
    }
    return isEmptyObject(obj);
}
/**
 * 允许【仅允许】字段，即仅允许fields中的字段 * @param data
 * @param data
 * @param fields
 */
export function allowedFields(data, fields) {
    if (isEmpty(data)) {
        return {};
    }
    if (isObject(data)) {
        const newData = {};
        fields.map((key) => {
            if (key in data) {
                // @ts-ignore
                newData[key] = data[key];
            }
        });
        return newData;
    }
    if (Array.isArray(data)) {
        return data.map((item) => {
            return allowedFields(item, fields);
        });
    }
    return {};
}
