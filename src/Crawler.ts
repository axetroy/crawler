import { EventEmitter } from "events";
import axios from "axios";
import { Task, Scheduling } from "./_Scheduling";
import { Options } from "./Config";
import { CreateResponse } from "./_Response";
import { Provider, ProviderFactory, Method, Body } from "./provider/Provider";
import { Agent } from "./provider/Agent";
import { Proxy } from "./provider/Proxy";
import { Headers } from "./provider/Headers";
import { Auth } from "./provider/Auth";
import * as pRetry from "p-retry";

/**
 * @ignore
 */
const http = axios.create();

export interface ICrawler {
  active: boolean;
  options: Options;
  start(): void;
  stop(): void;
}

export class Crawler extends EventEmitter implements ICrawler {
  public active = true;
  private scheduling: Scheduling;
  private provider: Provider;
  private agent: Agent;
  private proxy: Proxy;
  private headers: Headers;
  private auth: Auth;
  constructor(ProviderClass: ProviderFactory, public options: Options = {}) {
    super();
    this.provider = new ProviderClass(options);
    this.agent = options.agent ? new options.agent(options) : undefined;
    this.proxy = options.proxy ? new options.proxy(options) : undefined;
    this.headers = options.headers ? new options.headers(options) : undefined;
    this.auth = options.auth ? new options.auth(options) : undefined;
    const { concurrency } = this.options;

    this.scheduling = new Scheduling({ concurrency });

    /**
     * it can re-run the task with this `this.scheduling.push(task);`
     */
    this.scheduling.on("error", (err, task) => {
      this.emit("error", err, task);
    });

    this.scheduling.on("finish", () => {
      this.emit("finish");
    });

    this.scheduling.subscribe(async task => {
      await this.request(task.url, task.method, task.body);
    });
  }
  private async request(
    url: string,
    method: Method = "GET",
    body?: Body
  ): Promise<void> {
    const { timeout, retry } = this.options;

    const [_proxy, userAgent, headers, auth] = await Promise.all([
      this.proxy ? await this.proxy.resolve(url, method) : undefined,
      this.agent ? await this.agent.resolve(url, method) : undefined,
      this.headers ? await this.headers.resolve(url, method) : {},
      this.auth ? await this.auth.resolve(url, method) : undefined
    ]);

    const request = async () => {
      return await http.request({
        url,
        method,
        proxy: _proxy,
        timeout,
        data: body,
        auth,
        headers: {
          ...headers,
          ...(userAgent ? { "User-Agent": userAgent } : {})
        }
      });
    };

    // send request
    const httpResponse = await pRetry(request, {
      retries: retry || 0,
      onFailedAttempt: error => {
        console.log(
          `Attempt [${method}]: '${url}' ${
            error.attemptNumber
          } failed. There are ${error.retriesLeft} retries left.`
        );
        // 1st request => Attempt 1 failed. There are 4 retries left.
        // 2nd request => Attempt 2 failed. There are 3 retries left.
        // …
      }
    });

    const response = CreateResponse(httpResponse, this, this.scheduling);

    // parse response
    const data = await this.provider.parse(response);
    this.emit("data", data);
  }
  /**
   * start crawl
   */
  public start() {
    for (const url of this.provider.urls) {
      if (typeof url === "string") {
        this.scheduling.push(new Task(url));
      } else {
        this.scheduling.push(new Task(url.url, url.method, url.body));
      }
    }
  }
  /**
   * stop crawl
   */
  public stop() {
    this.active = false;
    if (this.scheduling) {
      this.scheduling.clear();
    }
  }
}
