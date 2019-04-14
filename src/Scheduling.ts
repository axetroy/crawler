import { Persistence } from "./Persistence";
export interface Task<T> {
  name: string;
  data?: T;
}

export class Scheduling {
  public shouldPersistence: boolean;
  private _persistence: Persistence;
  constructor(
    public concurrency: number,
    private cb: (task: Task<any>) => Promise<void>
  ) {
    this._persistence = new Persistence();
  }
  private _queue: Task<any>[] = [];
  private _runningQueue: Task<any>[] = [];
  private running: number;
  private _syncPersistence() {
    if (this.shouldPersistence) {
      // update crawler file
      this._persistence.sync(this._runningQueue);
    }
  }
  private _next() {
    const queue = this._queue;

    // if queue is empty or is busy then return
    if (!queue.length || this.running >= this.concurrency) return;
    this.running = this.running + 1;
    const task = queue.shift();

    this._runningQueue.push(task);

    this._syncPersistence();

    this.cb(task).finally(() => {
      this.running = this.running - 1;
      // remove running task
      this._runningQueue.splice(
        this._runningQueue.findIndex(t => t === task),
        1
      );
      this._syncPersistence();
    });
  }
  public sync() {
    this._queue = this._persistence.sync();
    if (!this._queue.length) {
      console.log("found crawler.json but no task.");
    }
    this._next();
  }
  public push(task: Task<any>) {
    this._queue.push(task);
    this._next();
  }
  clear() {
    this._queue = [];
  }
}
