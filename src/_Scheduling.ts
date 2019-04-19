import { EventEmitter } from "events";

let id = 0;

export class Task<T> {
  public id: number;
  constructor(public name: string, public data?: T) {
    this.id = ++id;
  }
}

export interface Options {
  concurrency?: number;
}

type SubscribeFn = (task: Task<any>) => Promise<void>;

export class Scheduling extends EventEmitter {
  private pendingQueue: Task<any>[] = []; // The pendding queue
  private runningQueue: Task<any>[] = []; // The running queue
  private subscriptions: SubscribeFn[] = []; // The subscription
  constructor(private options: Options = {}) {
    super();
    this.options.concurrency = this.options.concurrency || 1;
  }
  /**
   * execute a task
   * @param task a task to execute
   */
  private exec<T>(task: Task<T>): Promise<void> {
    const link = this.subscriptions.reduce((prev, current) => {
      return prev.then(() => current(task));
    }, Promise.resolve());
    return link;
  }
  private get isBusy(): boolean {
    return this.runningQueue.length >= this.options.concurrency;
  }
  private get nextable() {
    return this.pendingQueue.length && !this.isBusy;
  }
  /**
   * Go to the next task
   */
  private next() {
    if (!this.nextable) return;

    const task = this.pendingQueue.shift();

    this.runningQueue.push(task);

    this.exec(task)
      .catch(err => {
        this.emit("error", task, err);
      })
      .finally(() => {
        // remove running task
        const currentTaskIndex = this.runningQueue.findIndex(t => t === task);
        this.runningQueue.splice(currentTaskIndex, 1);

        if (this.nextable) this.next();
        if (!this.pendingQueue.length && !this.runningQueue.length) {
          this.emit("finish");
        }
      });
  }
  /**
   * Subscribe the task
   * @param fn
   */
  public subscribe(fn: SubscribeFn) {
    this.subscriptions.push(fn);
  }
  /**
   * Push a new task to the pool
   * @param task a new task
   */
  public push(task: Task<any>) {
    this.pendingQueue.push(task);
    if (this.nextable) this.next();
  }
  /**
   * Clear the pendingQueue
   */
  public clear() {
    this.pendingQueue = [];
  }
}
