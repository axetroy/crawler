export interface Task<T> {
  name: string;
  data?: T;
}

export class Scheduling {
  constructor(
    public concurrency: number,
    private cb: (task: Task<any>) => Promise<void>
  ) {}
  private _queue: Task<any>[] = [];
  private running: number;
  public push(task: Task<any>) {
    this._queue.push(task);
    this.next();
  }
  public next() {
    const queue = this._queue;

    // if queue is empty or is busy then return
    if (!queue.length || this.running >= this.concurrency) return;
    this.running = this.running + 1;
    const task = queue.shift();

    this.cb(task).finally(() => {
      this.running = this.running - 1;
    });
  }
  clear() {
    this._queue = [];
  }
}
