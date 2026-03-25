class SnowflakeId {
    static NODE_ID_BITS = 10n;
    static SEQUENCE_BITS = 12n;
    static TIMESTAMP_BITS = 41n;
    static MAX_NODE_ID = (1n << SnowflakeId.NODE_ID_BITS) - 1n;
    static MAX_SEQUENCE = (1n << SnowflakeId.SEQUENCE_BITS) - 1n;
    static MAX_TIMESTAMP = (1n << SnowflakeId.TIMESTAMP_BITS) - 1n;
    static NODE_ID_SHIFT = SnowflakeId.SEQUENCE_BITS;
    static TIMESTAMP_SHIFT = SnowflakeId.NODE_ID_SHIFT + SnowflakeId.NODE_ID_BITS;
    static DEFAULT_EPOCH = 1577836800000n;
    nodeId;
    epoch;
    clockSkewHandler;
    maxClockSkewWait;
    sequence = 0n;
    lastTimestamp = -1n;
    clockBackwardsCount = 0;
    totalGenerated = 0;
    asyncQueue = [];
    asyncLocked = false;
    constructor(options = {}) {
        this.nodeId = this.resolveNodeId(options);
        if (this.nodeId < 0n || this.nodeId > SnowflakeId.MAX_NODE_ID) {
            throw new Error(`Node ID must be between 0 and ${SnowflakeId.MAX_NODE_ID}, got ${this.nodeId}`);
        }
        this.epoch = BigInt(options.epoch || Number(SnowflakeId.DEFAULT_EPOCH));
        this.clockSkewHandler = options.clockSkewHandler ?? 'wait';
        this.maxClockSkewWait = options.maxClockSkewWait ?? 5000;
        this.validateEpoch();
    }
    resolveNodeId(options) {
        if (typeof options.id === 'number') {
            return BigInt(options.id & 0x3ff);
        }
        if (typeof options.id === 'bigint') {
            return options.id & SnowflakeId.MAX_NODE_ID;
        }
        if (typeof options.datacenter === 'number' || typeof options.worker === 'number') {
            const datacenter = BigInt(options.datacenter || 0) & 0x1fn;
            const worker = BigInt(options.worker || 0) & 0x1fn;
            return (datacenter << 5n) | worker;
        }
        return this.autoAssignNodeId();
    }
    autoAssignNodeId() {
        const pid = process.pid;
        const hash = this.simpleHash(pid.toString());
        return BigInt(hash % Number(SnowflakeId.MAX_NODE_ID));
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    validateEpoch() {
        const now = BigInt(Date.now());
        if (this.epoch > now) {
            throw new Error('Epoch cannot be in the future');
        }
        const maxEpoch = now - SnowflakeId.MAX_TIMESTAMP;
        if (this.epoch < maxEpoch) {
            throw new Error('Epoch is too far in the past, timestamp will overflow');
        }
    }
    next(cb) {
        try {
            const id = this.nextId();
            const buffer = this.bigintToBuffer(BigInt(id));
            if (cb) {
                process.nextTick(() => cb(null, buffer));
                return;
            }
            return buffer;
        }
        catch (error) {
            if (cb) {
                process.nextTick(() => cb(error));
                return;
            }
            throw error;
        }
    }
    nextId() {
        return this.doGenerateId();
    }
    async nextIdAsync() {
        await this.acquireAsyncLock();
        try {
            return await this.doGenerateIdAsync();
        }
        finally {
            this.releaseAsyncLock();
        }
    }
    doGenerateId() {
        let timestamp = this.currentTimestamp();
        if (timestamp < this.lastTimestamp) {
            timestamp = this.handleClockBackwards(timestamp);
        }
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE;
            if (this.sequence === 0n) {
                timestamp = this.waitNextMillisSync(this.lastTimestamp);
            }
        }
        else {
            this.sequence = 0n;
        }
        this.lastTimestamp = timestamp;
        this.totalGenerated++;
        return this.generateId(timestamp, this.sequence).toString();
    }
    async doGenerateIdAsync() {
        let timestamp = this.currentTimestamp();
        if (timestamp < this.lastTimestamp) {
            timestamp = await this.handleClockBackwardsAsync(timestamp);
        }
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE;
            if (this.sequence === 0n) {
                timestamp = await this.waitNextMillisAsync(this.lastTimestamp);
            }
        }
        else {
            this.sequence = 0n;
        }
        this.lastTimestamp = timestamp;
        this.totalGenerated++;
        return this.generateId(timestamp, this.sequence).toString();
    }
    handleClockBackwards(timestamp) {
        const skew = Number(this.lastTimestamp - timestamp);
        this.clockBackwardsCount++;
        switch (this.clockSkewHandler) {
            case 'throw':
                throw new Error(`Clock moved backwards by ${skew}ms. Refusing to generate ID.`);
            case 'auto_adjust':
                return this.lastTimestamp;
            case 'wait':
            default:
                if (skew > this.maxClockSkewWait) {
                    throw new Error(`Clock skew too large: ${skew}ms. Maximum allowed: ${this.maxClockSkewWait}ms. ` +
                        `Consider using 'auto_adjust' mode or increasing maxClockSkewWait.`);
                }
                return this.waitNextMillisSync(this.lastTimestamp);
        }
    }
    async handleClockBackwardsAsync(timestamp) {
        const skew = Number(this.lastTimestamp - timestamp);
        this.clockBackwardsCount++;
        switch (this.clockSkewHandler) {
            case 'throw':
                throw new Error(`Clock moved backwards by ${skew}ms. Refusing to generate ID.`);
            case 'auto_adjust':
                return this.lastTimestamp;
            case 'wait':
            default:
                if (skew > this.maxClockSkewWait) {
                    throw new Error(`Clock skew too large: ${skew}ms. Maximum allowed: ${this.maxClockSkewWait}ms.`);
                }
                return this.waitNextMillisAsync(this.lastTimestamp);
        }
    }
    waitNextMillisSync(lastTimestamp) {
        let timestamp = this.currentTimestamp();
        const startTime = Date.now();
        while (timestamp <= lastTimestamp) {
            const elapsed = Date.now() - startTime;
            if (elapsed > this.maxClockSkewWait) {
                throw new Error(`Timeout waiting for next millisecond after ${elapsed}ms. ` +
                    `Use async API for better handling.`);
            }
            timestamp = this.currentTimestamp();
        }
        return timestamp;
    }
    async waitNextMillisAsync(lastTimestamp) {
        let timestamp = this.currentTimestamp();
        while (timestamp <= lastTimestamp) {
            await this.sleep(1);
            timestamp = this.currentTimestamp();
        }
        return timestamp;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async acquireAsyncLock() {
        if (!this.asyncLocked) {
            this.asyncLocked = true;
            return;
        }
        return new Promise(resolve => {
            this.asyncQueue.push(resolve);
        });
    }
    releaseAsyncLock() {
        const next = this.asyncQueue.shift();
        if (next) {
            next();
        }
        else {
            this.asyncLocked = false;
        }
    }
    nextIds(count) {
        if (count <= 0) {
            throw new Error('Count must be positive');
        }
        if (count > 10000) {
            throw new Error('Count cannot exceed 10000');
        }
        return this.doGenerateIds(count);
    }
    async nextIdsAsync(count) {
        if (count <= 0) {
            throw new Error('Count must be positive');
        }
        if (count > 10000) {
            throw new Error('Count cannot exceed 10000');
        }
        await this.acquireAsyncLock();
        try {
            return await this.doGenerateIdsAsync(count);
        }
        finally {
            this.releaseAsyncLock();
        }
    }
    doGenerateIds(count) {
        const ids = [];
        let timestamp = this.currentTimestamp();
        if (timestamp < this.lastTimestamp) {
            timestamp = this.handleClockBackwards(timestamp);
        }
        if (timestamp !== this.lastTimestamp) {
            this.sequence = 0n;
        }
        for (let i = 0; i < count; i++) {
            this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE;
            if (this.sequence === 0n) {
                timestamp = this.waitNextMillisSync(timestamp);
            }
            ids.push(this.generateId(timestamp, this.sequence).toString());
        }
        this.lastTimestamp = timestamp;
        this.totalGenerated += count;
        return ids;
    }
    async doGenerateIdsAsync(count) {
        const ids = [];
        let timestamp = this.currentTimestamp();
        if (timestamp < this.lastTimestamp) {
            timestamp = await this.handleClockBackwardsAsync(timestamp);
        }
        if (timestamp !== this.lastTimestamp) {
            this.sequence = 0n;
        }
        for (let i = 0; i < count; i++) {
            this.sequence = (this.sequence + 1n) & SnowflakeId.MAX_SEQUENCE;
            if (this.sequence === 0n) {
                timestamp = await this.waitNextMillisAsync(timestamp);
            }
            ids.push(this.generateId(timestamp, this.sequence).toString());
        }
        this.lastTimestamp = timestamp;
        this.totalGenerated += count;
        return ids;
    }
    deconstruct(snowflakeId) {
        let id;
        if (typeof snowflakeId === 'string') {
            if (!/^\d+$/.test(snowflakeId.trim())) {
                throw new Error('Invalid snowflake ID format: must be a numeric string');
            }
            id = BigInt(snowflakeId);
        }
        else if (typeof snowflakeId === 'bigint') {
            id = snowflakeId;
        }
        else {
            id = this.bufferToBigint(snowflakeId);
        }
        if (id < 0n) {
            throw new Error('Snowflake ID cannot be negative');
        }
        const timestamp = (id >> SnowflakeId.TIMESTAMP_SHIFT) + this.epoch;
        const nodeId = Number((id >> SnowflakeId.NODE_ID_SHIFT) & SnowflakeId.MAX_NODE_ID);
        const sequence = Number(id & SnowflakeId.MAX_SEQUENCE);
        if (timestamp > BigInt(Date.now()) + BigInt(365 * 24 * 60 * 60 * 1000)) {
            throw new Error('Snowflake ID timestamp is in the far future');
        }
        return {
            timestamp: Number(timestamp),
            nodeId,
            sequence,
            epoch: Number(this.epoch)
        };
    }
    validate(snowflakeId) {
        try {
            let id;
            if (typeof snowflakeId === 'string') {
                if (snowflakeId.trim() === '' || !/^\d+$/.test(snowflakeId.trim())) {
                    return false;
                }
                id = BigInt(snowflakeId);
            }
            else if (typeof snowflakeId === 'bigint') {
                id = snowflakeId;
            }
            else {
                if (snowflakeId.length !== 8) {
                    return false;
                }
                id = this.bufferToBigint(snowflakeId);
            }
            if (id < 0n)
                return false;
            const deconstructed = this.deconstruct(snowflakeId);
            const now = Date.now();
            const tenYearsAgo = now - 10 * 365 * 24 * 60 * 60 * 1000;
            const oneYearAhead = now + 365 * 24 * 60 * 60 * 1000;
            if (deconstructed.timestamp < tenYearsAgo || deconstructed.timestamp > oneYearAhead) {
                return false;
            }
            if (deconstructed.nodeId < 0 || deconstructed.nodeId > Number(SnowflakeId.MAX_NODE_ID)) {
                return false;
            }
            if (deconstructed.sequence < 0 || deconstructed.sequence > Number(SnowflakeId.MAX_SEQUENCE)) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    getStats() {
        return {
            nodeId: Number(this.nodeId),
            epoch: Number(this.epoch),
            lastTimestamp: Number(this.lastTimestamp),
            sequence: Number(this.sequence),
            maxSequence: Number(SnowflakeId.MAX_SEQUENCE),
            maxNodeId: Number(SnowflakeId.MAX_NODE_ID),
            clockBackwardsCount: this.clockBackwardsCount,
            totalGenerated: this.totalGenerated
        };
    }
    getNodeId() {
        return Number(this.nodeId);
    }
    getEpoch() {
        return Number(this.epoch);
    }
    generateId(timestamp, sequence) {
        const relativeTimestamp = timestamp - this.epoch;
        if (relativeTimestamp < 0n) {
            throw new Error('Timestamp is before epoch');
        }
        if (relativeTimestamp > SnowflakeId.MAX_TIMESTAMP) {
            throw new Error('Timestamp overflow: epoch is too old or system time is corrupted');
        }
        return (relativeTimestamp << SnowflakeId.TIMESTAMP_SHIFT) |
            (this.nodeId << SnowflakeId.NODE_ID_SHIFT) |
            sequence;
    }
    currentTimestamp() {
        return BigInt(Date.now());
    }
    bigintToBuffer(value) {
        const buffer = Buffer.alloc(8);
        buffer.writeBigUInt64BE(value);
        return buffer;
    }
    bufferToBigint(buffer) {
        if (buffer.length !== 8) {
            throw new Error('Buffer must be 8 bytes long');
        }
        return buffer.readBigUInt64BE();
    }
}
export default SnowflakeId;
//# sourceMappingURL=snowflake.js.map