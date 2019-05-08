import { EventEmitter } from "events";
import { Task, Scheduler } from "./Scheduler";
import { Options } from "./Option";
import { Provider, ProviderFactory } from "./Provider";
import { Http, Method, Body, HTTPHeaders } from "./Http";
import { Persistence } from "./Persistence";
import { UserAgent, Proxy, Headers, Auth } from "./agent";
import { logger } from "./Logger";
import { sleep } from "./utils";
import { Storage } from "./Storage";

export class Crawler extends EventEmitter {
  public active = true;
  public scheduler: Scheduler;
  public provider: Provider;
  public userAgent: UserAgent;
  public proxy: Proxy;
  public headers: Headers;
  public auth: Auth;
  public persistence: Persistence;
  public http: Http;
  public storage: Storage;
  constructor(ProviderClass: ProviderFactory, public options: Options = {}) {
    super();
    // init config
    options.timeout = options.timeout || 1000 * 60;
    options.retry = options.retry || 0;

    this.provider = new ProviderClass(this);
    this.http = new Http(this);
    this.userAgent = options.UserAgent
      ? new options.UserAgent(options)
      : undefined;
    this.storage = options.Storage || undefined;

    this.proxy = options.Proxy ? new options.Proxy(options) : undefined;
    this.headers = options.Headers ? new options.Headers(options) : undefined;
    this.auth = options.Auth ? new options.Auth(options) : undefined;
    const { concurrency } = this.options;

    this.scheduler = new Scheduler({ concurrency });

    /**
     * it can re-run the task with this `this.scheduler.push(task);`
     */
    this.scheduler.on("error", (err, task) => {
      logger.error(`Running task ${task.url} [${task.type}]: ${err.message}`);
      this.emit("error", err, task);
    });

    this.scheduler.on("task.done", () => {
      // if task done. then sync to task file
      if (this.persistence) {
        const { runningQueue, pendingQueue } = this.scheduler;
        this.persistence.sync(runningQueue, pendingQueue);
      }
    });

    /**
     * Where there is no task to do
     */
    this.scheduler.on("finish", () => {
      this.emit("finish");
    });

    // handler the task
    this.scheduler.subscribe(async task => {
      // if not request type. then ignore it.
      switch (task.type) {
        case "request":
          await this.request(task.url, task.method, task.body, task.headers);
          break;
        case "download":
          // @ts-ignore
          const { filepath, options } = task.body;
          await this.http.downloadResource(task.url, filepath, options);
        default:
          break;
      }
    });

    this.persistence = options.persistence
      ? new Persistence(this.scheduler)
      : undefined;
  }
  public async request(
    url: string,
    method: Method,
    body?: Body,
    headers?: HTTPHeaders
  ): Promise<void> {
    const response = await this.http.request(url, method, body, headers);

    // parse response
    const dataList = await this.provider.parse(response);

    if (this.storage) {
      await this.storage.append(dataList);
    }

    this.emit("data", dataList);

    if (this.options.interval) {
      await sleep(this.options.interval);
    }
  }
  /**
   * start crawl
   */
  public async start() {
    const { provider } = this;

    if (provider.beforeRequest) {
      await provider.beforeStart();
    }

    if (this.persistence) {
      const loadSuccess = this.persistence.load();
      if (loadSuccess) {
        logger.info(
          `Continue to the last spider from '${this.persistence.TaskFilePath}'`
        );
        return;
      }
    }
    for (const url of this.provider.urls) {
      if (typeof url === "string") {
        this.scheduler.push(new Task("request", "GET", url));
      } else {
        this.scheduler.push(new Task("request", url.method, url.url, url.body));
      }
    }
  }
  /**
   * stop crawl
   */
  public async stop() {
    this.active = false;
    if (this.scheduler) {
      this.http.cancel();
      this.scheduler.clear();
    }
  }
}
