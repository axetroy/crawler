import * as retry from "p-retry";
import * as timeout from "p-timeout";
import { Persistence } from "./Persistence";
export interface Task<T> {
  name: string;
  data?: T;
}

export interface Options {
  concurrency?: number;
  timeout?: number;
  retry?: number;
}

export class Scheduling {
  public shouldPersistence: boolean;
  private _persistence: Persistence;
  private _queue: Task<any>[] = [];
  private _runningQueue: Task<any>[] = [];
  private running: number;
  constructor(
    private cb: (task: Task<any>) => Promise<void>,
    private options: Options
  ) {
    this.options.concurrency = this.options.concurrency || 1;
    this.options.timeout = this.options.timeout || 1000 * 30;
    this.options.retry = this.options.retry || 0;
    this._persistence = new Persistence();
  }
  private _syncPersistence() {
    if (this.shouldPersistence) {
      // update crawler file
      this._persistence.sync(this._runningQueue);
    }
  }
  private _exec(task: Task<any>): Promise<any> {
    // set timeout and retry
    const timeoutAction = timeout(
      this.cb(task),
      this.options.timeout,
      `request '${task.data}' timeout.`
    );
    const action = retry(() => timeoutAction, {
      retries: this.options.retry,
      onFailedAttempt(err) {
        console.log(err.toString());
      }
    });

    return action;
  }
  private _next() {
    const queue = this._queue;

    // if queue is empty or is busy then return
    if (!queue.length || this.running >= this.options.concurrency) return;
    this.running = this.running + 1;
    const task = queue.shift();

    this._runningQueue.push(task);

    this._syncPersistence();

    this._exec(task)
      .catch(() => {
        // ignore error
      })
      .finally(() => {
        this.running = this.running - 1;
        // remove running task
        const currentTaskIndex = this._runningQueue.findIndex(t => t === task);
        this._runningQueue.splice(currentTaskIndex, 1);
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
