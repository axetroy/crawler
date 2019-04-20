import { EventEmitter } from "events";
import { Method, Body } from "./Http";
import { Persistence } from "./Persistence";

let id = 0;

export class Task {
  public id: number;
  constructor(public url: string, public method?: Method, public body?: Body) {
    this.id = ++id;
  }
}

export interface Options {
  concurrency?: number;
  persistenceFn?(): Persistence;
}

type SubscribeFn = (task: Task) => Promise<void>;

export class Scheduler extends EventEmitter {
  private pendingQueue: Task[] = []; // The pendding queue
  private runningQueue: Task[] = []; // The running queue
  private subscriptions: SubscribeFn[] = []; // The subscription
  constructor(private options: Options = {}) {
    super();
    this.options.concurrency = this.options.concurrency || 1;
  }
  /**
   * execute a task
   * @param task a task to execute
   */
  private exec(task: Task): Promise<void> {
    const link = this.subscriptions.reduce((prev, current) => {
      return prev.then(() => current(task));
    }, Promise.resolve());
    return link;
  }
  /**
   * Is the scheduler busy?
   */
  private get isBusy(): boolean {
    return this.runningQueue.length >= this.options.concurrency;
  }
  /**
   * Is the scheduler can go to next task?
   */
  private get nextable() {
    return this.pendingQueue.length && !this.isBusy;
  }
  private sync() {
    const { persistenceFn } = this.options;
    if (persistenceFn) {
      const persistence = persistenceFn();
      if (persistence) {
        persistence.sync(this.runningQueue.concat(this.pendingQueue));
      }
    }
  }
  /**
   * Go to the next task
   */
  private next() {
    if (!this.nextable) return;

    const task = this.pendingQueue.shift();

    this.runningQueue.push(task);

    this.sync();

    this.exec(task)
      .catch(err => {
        this.emit("error", err, task);
      })
      .finally(() => {
        // remove running task
        const currentTaskIndex = this.runningQueue.findIndex(t => t === task);
        this.runningQueue.splice(currentTaskIndex, 1);

        if (this.nextable) this.next();
        if (!this.pendingQueue.length && !this.runningQueue.length) {
          this.emit("finish");
        }
        this.sync();
      });
  }
  /**
   * Set current id for the task
   * @param initializationId
   */
  public setCurrentId(initializationId: number) {
    id = initializationId || 0;
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
  public push(task: Task) {
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
