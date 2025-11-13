/**
 * 分布式ID生成器 (雪花算法改进版)
 * 64位ID结构: [时间戳(42位) | 节点ID(10位) | 序列号(12位)]
 */
class SnowflakeId {
    // 静态常量
    static MAX_DATACENTER = 0x1f; // 5位最大值 (31)
    static MAX_WORKER = 0x1f; // 5位最大值 (31)
    static MAX_SEQUENCE = 0xfff; // 12位序列号最大值 (4095)
    // 实例变量
    id;
    genId;
    epoch;
    seqMask;
    seq = 0;
    lastTime = 0;
    overflow = false;
    constructor(options = {}) {
        if (typeof options.id === 'number') {
            this.id = options.id & 0x3ff;
        }
        else {
            const datacenter = (options.datacenter || 0) & SnowflakeId.MAX_DATACENTER;
            const worker = (options.worker || 0) & SnowflakeId.MAX_WORKER;
            this.id = (datacenter << 5) | worker;
        }
        this.genId = this.id << 12;
        this.epoch = options.epoch || 0;
        this.seqMask = options.seqMask || SnowflakeId.MAX_SEQUENCE;
    }
    next(cb) {
        const time = Date.now() - this.epoch;
        const id = Buffer.alloc(8);
        if (time < this.lastTime) {
            return this.handleClockBackwards(time, cb);
        }
        if (time === this.lastTime) {
            if (this.overflow) {
                return this.handleOverflow(cb);
            }
            this.seq = (this.seq + 1) & this.seqMask;
            if (this.seq === 0)
                this.overflow = true;
        }
        else {
            this.overflow = false;
            this.seq = 0;
        }
        this.lastTime = time;
        this.generateId(id, time);
        if (cb) {
            process.nextTick(() => cb(null, id));
        }
        else {
            return id;
        }
    }
    handleClockBackwards(time, cb) {
        const backTime = this.lastTime - time;
        if (cb) {
            setTimeout(() => this.next(cb), backTime);
            return;
        }
        throw new Error(`Clock moved backwards. Refusing to generate id for ${backTime}ms`);
    }
    handleOverflow(cb) {
        if (cb) {
            setTimeout(() => this.next(cb), 1);
            return;
        }
        throw new Error('Sequence overflow. Use callback for async handling');
    }
    generateId(id, time) {
        // 高位32位: 时间戳的高32位 (42位时间戳的前32位)
        id.writeUInt32BE(Math.floor(time / 4) >>> 0, 0);
        // 低位32位: [时间戳低2位(2) | 节点ID(10) | 序列号(12)]
        const lowBits = ((time & 0x3) << 22) | this.genId | this.seq;
        id.writeUInt32BE(lowBits >>> 0, 4);
    }
}
export default SnowflakeId;
