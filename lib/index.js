import SnowflakeId from './snowflake.js';
class Snowflake {
    static instance;
    instances = new Map();
    static generate(options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.next();
    }
    static generateId(options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.nextId();
    }
    static async generateIdAsync(options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.nextIdAsync();
    }
    static generateIds(count, options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.nextIds(count);
    }
    static async generateIdsAsync(count, options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.nextIdsAsync(count);
    }
    static deconstruct(snowflakeId, options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.deconstruct(snowflakeId);
    }
    static validate(snowflakeId, options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.validate(snowflakeId);
    }
    static getStats(options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.getStats();
    }
    static getNodeId(options = {}) {
        const snowflake = this.getOrCreateInstance(options);
        return snowflake.getNodeId();
    }
    static getOrCreateInstance(options) {
        const key = this.createCacheKey(options);
        let instance = this.getInstance().instances.get(key);
        if (!instance) {
            instance = new SnowflakeId(options);
            this.getInstance().instances.set(key, instance);
        }
        return instance;
    }
    static createCacheKey(options) {
        const sortedKeys = Object.keys(options).sort();
        const parts = [];
        for (const key of sortedKeys) {
            const value = options[key];
            if (value !== undefined) {
                parts.push(`${key}:${value}`);
            }
        }
        return parts.join('|');
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new Snowflake();
        }
        return this.instance;
    }
}
function generateId(options) {
    return Snowflake.generateId(options);
}
async function generateIdAsync(options) {
    return Snowflake.generateIdAsync(options);
}
function generateIds(count, options) {
    return Snowflake.generateIds(count, options);
}
async function generateIdsAsync(count, options) {
    return Snowflake.generateIdsAsync(count, options);
}
function parseId(snowflakeId, options) {
    return Snowflake.deconstruct(snowflakeId, options);
}
function isValidId(snowflakeId, options) {
    return Snowflake.validate(snowflakeId, options);
}
export { Snowflake, generateId, generateIdAsync, generateIds, generateIdsAsync, parseId, isValidId };
//# sourceMappingURL=index.js.map