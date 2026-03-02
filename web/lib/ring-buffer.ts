/** Fixed-size ring buffer for time-series metric history. */
export class RingBuffer {
  private data: Float64Array;
  private head = 0;
  private count = 0;

  constructor(public readonly capacity: number) {
    this.data = new Float64Array(capacity);
  }

  push(value: number) {
    this.data[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  /** Get the last N values in chronological order. */
  getLastN(n: number): Float64Array {
    const len = Math.min(n, this.count);
    const result = new Float64Array(len);
    const start = (this.head - len + this.capacity) % this.capacity;
    for (let i = 0; i < len; i++) {
      result[i] = this.data[(start + i) % this.capacity];
    }
    return result;
  }

  /** Get all stored values in chronological order. */
  getAll(): Float64Array {
    return this.getLastN(this.count);
  }

  get length(): number {
    return this.count;
  }

  get latest(): number {
    if (this.count === 0) return 0;
    return this.data[(this.head - 1 + this.capacity) % this.capacity];
  }

  clear() {
    this.head = 0;
    this.count = 0;
  }
}
