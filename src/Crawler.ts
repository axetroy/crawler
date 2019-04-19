import { EventEmitter } from "events";
import axios from "axios";
import { Task, Scheduling } from "./_scheduling";
import { Options } from "./Config";
import { CreateResponse } from "./Response";
import { Provider } from "./provider/Provider";
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
  constructor(private provider: Provider, public options: Options = {}) {
    super();
    const { concurrency } = this.options;

    this.scheduling = new Scheduling({ concurrency });

    /**
     * it can re-run the task with this `this.scheduling.push(task);`
     */
    this.scheduling.on("error", (task, err) => {
      this.emit("error", task, err);
    });

    this.scheduling.subscribe(async task => {
      await this.request(task.name, "GET");
    });
  }
  private async request(url: string, method: string): Promise<void> {
    const { proxy, agent, logger, headers, timeout, retry } = this.options;

    // resolve proxy
    const _proxy = proxy ? await proxy.resolve(url, method) : false;

    // resolve useragent
    const userAgent = agent ? await agent.resolve(url, method) : undefined;

    // resolve headers
    const _headers = headers ? await headers.resolve(url, method) : {};

    const request = async () => {
      return await http.request({
        url,
        method,
        proxy: _proxy,
        timeout,
        headers: {
          ..._headers,
          ...(userAgent ? { "User-Agent": userAgent } : {})
        }
      });
    };

    // send request
    const httpResponse = await pRetry(request, {
      retries: retry || 0,
      onFailedAttempt: error => {
        console.log(
          `Attempt ${error.attemptNumber} failed. There are ${
            error.retriesLeft
          } retries left.`
        );
        // 1st request => Attempt 1 failed. There are 4 retries left.
        // 2nd request => Attempt 2 failed. There are 3 retries left.
        // …
      }
    });

    // print to logger
    if (logger) {
      logger.log(url);
    }

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
      this.scheduling.push(new Task(url, url));
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
