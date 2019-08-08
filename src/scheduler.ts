import { EventEmitter } from "events";
import { Method, Body, HTTPHeaders } from "./http";

let id = 0;

export type TaskType = "request" | "download";

export enum Events {
  Error = "error",
  Complete = "complete"
}

export class Task {
  public id: number;
  constructor(
    public type: TaskType,
    public method: Method,
    public url: string,
    public body?: Body,
    public headers?: HTTPHeaders
  ) {
    this.id = ++id;
  }
}

export interface Options {
  concurrency?: number;
}

type SubscribeFn = (task: Task) => Promise<void>;

interface IScheduler extends EventEmitter {
  subscribe(fn: SubscribeFn): void;
  push(task: Task): void;
  clear(): void;
  length: number;
}

export class Scheduler extends EventEmitter implements IScheduler {
  public readonly pendingQueue: Task[] = []; // The pending queue
  public readonly runningQueue: Task[] = []; // The running queue
  private subscriptionFn: SubscribeFn = undefined; // The subscription
  constructor(private options: Options = {}) {
    super();
    this.options.concurrency = this.options.concurrency || 1;
  }
  /**
   * execute a task
   * @param task a task to execute
   */
  private exec(task: Task): Promise<void> {
    return this.subscriptionFn(task);
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
  /**
   * Go to the next task
   */
  private next() {
    if (!this.nextable) return;

    const task = this.pendingQueue.shift();

    this.runningQueue.push(task);

    this.exec(task)
      .catch(err => {
        this.emit(Events.Error, err, task);
      })
      .finally(() => {
        // remove running task
        const currentTaskIndex = this.runningQueue.findIndex(t => t === task);
        this.runningQueue.splice(currentTaskIndex, 1);

        // If there are still pending task, continue processing
        if (this.nextable) this.next();

        this.emit(Events.Complete);
      });
  }
  /**
   * Subscribe the task
   * @param fn
   */
  public subscribe(fn: SubscribeFn) {
    this.subscriptionFn = fn;
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
    this.pendingQueue.splice(0);
  }
  /**
   * Get the length for this scheduler
   */
  public get length() {
    return this.pendingQueue.length + this.runningQueue.length;
  }
}
