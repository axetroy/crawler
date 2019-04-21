import { EventEmitter } from "events";
import { Task, Scheduler } from "./Scheduler";
import { Options } from "./Option";
import { Provider, ProviderFactory } from "./Provider";
import { Http, Method, Body } from "./Http";
import { Persistence } from "./Persistence";
import { UserAgent, Proxy, Headers, Auth } from "./agent";
import { logger } from "./Logger";
import { sleep } from "./utils";

export interface ICrawler {
  active: boolean;
  options: Options;
  start(): void;
  stop(): void;
}

export class Crawler extends EventEmitter implements ICrawler {
  public active = true;
  public scheduler: Scheduler;
  public provider: Provider;
  public userAgent: UserAgent;
  public proxy: Proxy;
  public headers: Headers;
  public auth: Auth;
  public persistence: Persistence;
  public http: Http;
  constructor(ProviderClass: ProviderFactory, public options: Options = {}) {
    super();
    // init config
    options.timeout = options.timeout || 1000 * 60;
    options.retry = options.retry || 0;

    this.provider = new ProviderClass(options);
    this.http = new Http(this);
    this.userAgent = options.UserAgent
      ? new options.UserAgent(options)
      : undefined;
    this.proxy = options.Proxy ? new options.Proxy(options) : undefined;
    this.headers = options.Headers ? new options.Headers(options) : undefined;
    this.auth = options.Auth ? new options.Auth(options) : undefined;
    const { concurrency } = this.options;

    const getPersistenceFn = options.persistence
      ? () => this.persistence
      : undefined;

    this.scheduler = new Scheduler({
      concurrency,
      persistenceFn: getPersistenceFn
    });

    /**
     * it can re-run the task with this `this.scheduler.push(task);`
     */
    this.scheduler.on("error", (err, task) => {
      this.emit("error", err, task);
    });

    /**
     * Where there is no task to do
     */
    this.scheduler.on("finish", () => {
      this.emit("finish");
    });

    this.scheduler.subscribe(async task => {
      return await this.request(task.url, task.method, task.body);
    });

    this.persistence = options.persistence
      ? new Persistence(this.scheduler)
      : undefined;
  }
  private async request(
    url: string,
    method: Method,
    body?: Body
  ): Promise<void> {
    const response = await this.http.request(url, method, body);
    // parse response
    const data = await this.provider.parse(response);
    this.emit("data", data);

    if (this.options.interval) {
      await sleep(this.options.interval);
    }
  }
  /**
   * start crawl
   */
  public start() {
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
        this.scheduler.push(new Task(url));
      } else {
        this.scheduler.push(new Task(url.url, url.method, url.body));
      }
    }
  }
  /**
   * stop crawl
   */
  public stop() {
    this.active = false;
    if (this.scheduler) {
      this.http.cancel();
      this.scheduler.clear();
    }
  }
}
