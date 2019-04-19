import * as retry from "p-retry";
import * as timeout from "p-timeout";
import { Persistence } from "./_Persistence";

let id = 0;

export class Task<T> {
  public id: number;
  constructor(public name: string, public data?: T) {
    this.id = ++id;
  }
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
  private syncPersistence() {
    if (this.shouldPersistence) {
      // update crawler file
      this._persistence.sync(this._runningQueue);
    }
  }
  /**
   * execute a task
   * @param task a task to execute
   */
  private exec(task: Task<any>): Promise<any> {
    // set timeout and retry
    const timeoutAction = timeout(
      this.cb(task),
      this.options.timeout,
      `Request '${task.data}' timeout.`
    );
    const action = retry(() => timeoutAction, {
      retries: this.options.retry,
      onFailedAttempt(err) {
        console.log(err.toString());
      }
    });

    return action;
  }
  /**
   * Go to the next task
   */
  private next() {
    const queue = this._queue;

    // if queue is empty or is busy then return
    if (!queue.length || this.running >= this.options.concurrency) return;

    this.running = this.running + 1;
    const task = queue.shift();

    this._runningQueue.push(task);

    this.syncPersistence();

    this.exec(task)
      .catch(() => {
        // ignore error
      })
      .finally(() => {
        this.running = this.running - 1;
        // remove running task
        const currentTaskIndex = this._runningQueue.findIndex(t => t === task);
        this._runningQueue.splice(currentTaskIndex, 1);
        this.syncPersistence();
      });
  }
  /**
   * Sync the next
   */
  public sync() {
    this._queue = this._persistence.sync();
    if (!this._queue.length) {
      console.log("found crawler.json but no task.");
    }
    this.next();
  }
  /**
   * Push a new task to the pool
   * @param task a new task
   */
  public push(task: Task<any>) {
    this._queue.push(task);
    this.next();
  }
  /**
   * Clear the queue
   */
  public clear() {
    this._queue = [];
  }
}
