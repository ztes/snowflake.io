interface FlakeIdOptions {
  id?: number
  datacenter?: number
  worker?: number
  epoch?: number
  seqMask?: number
}

class FlakeId {
  private id: number
  private genId: number
  private epoch: number
  private seq: number
  private lastTime: number
  private overflow: boolean
  private seqMask: number

  static POW10: number = Math.pow(2, 10)
  static POW26: number = Math.pow(2, 26)
  private datacenter: number | undefined
  private worker: number | undefined

  constructor(private options: FlakeIdOptions = {}) {
    this.options = options || {}

    if (typeof this.options.id === 'number') {
      this.id = this.options.id & 0x3ff
    } else {
      this.datacenter = (this.options.datacenter || 0) & 0x1f
      this.worker = (this.options.worker || 0) & 0x1f
      this.id = (this.datacenter << 5) | this.worker
    }
    this.genId = this.id
    this.genId <<= 12
    // @ts-ignore
    this.epoch = +this.options.epoch || 0
    this.seq = 0
    this.lastTime = 0
    this.overflow = false
    this.seqMask = this.options.seqMask || 0xfff
  }

  next(cb?: (err: Error | null, id?: Buffer) => void): Buffer | undefined {
    const id = Buffer.alloc(8)
    const time = Date.now() - this.epoch

    if (time < this.lastTime) {
      const backTime = this.lastTime - time
      if (cb) {
        setTimeout(() => this.next(cb), backTime)
        return
      }
      throw new Error(`Clock moved backwards. Refusing to generate id for ${backTime} milliseconds`)
    }

    if (time === this.lastTime) {
      if (this.overflow) {
        this.handleOverflow(cb)
        return
      }

      this.seq = (this.seq + 1) & this.seqMask
      if (this.seq === 0) {
        this.overflow = true
        this.handleOverflow(cb)
        return
      }
    } else {
      this.overflow = false
      this.seq = 0
    }
    this.lastTime = time

    this.generateId(id, time)

    if (cb) {
      process.nextTick(() => cb(null, id))
    } else {
      return id
    }
  }

  private handleOverflow(cb?: (err: Error | null, id?: Buffer) => void): void {
    if (cb) {
      setTimeout(() => this.next(cb), 1)
    } else {
      throw new Error('Sequence exceeded its maximum value. Provide callback function to handle sequence overflow')
    }
  }

  private generateId(id: Buffer, time: number): void {
    id.writeUInt32BE(((time & 0x3) << 22) | this.genId | this.seq, 4)
    id.writeUInt8(Math.floor(time / 4) & 0xff, 4)
    id.writeUInt16BE(Math.floor(time / FlakeId.POW10) & 0xffff, 2)
    id.writeUInt16BE(Math.floor(time / FlakeId.POW26) & 0xffff, 0)
  }
}

export default FlakeId
