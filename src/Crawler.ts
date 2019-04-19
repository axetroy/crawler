import { EventEmitter } from "events";
import * as fs from "fs-extra";
import axios from "axios";
import { Task, Scheduling } from "./_Scheduling";
import { crawlerFilepath } from "./_constant";
import { Options } from "./Config";
import { CreateResponse } from "./Response";
import { Provider } from "./provider/Provider";

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
  private _scheduling: Scheduling;
  constructor(private provider: Provider, public options: Options = {}) {
    super();
    const { concurrency, timeout, retry } = this.options;

    const scheduling = new Scheduling(
      async (task: Task<any>) => {
        this._next(task.data as string, "GET");
      },
      {
        concurrency,
        timeout,
        retry
      }
    );

    this._scheduling = scheduling;
  }
  private async _next(url: string, method: string): Promise<void> {
    const { proxy, agent, logger, headers } = this.options;

    // resolve proxy
    const _proxy = proxy ? await proxy.resolve(url, method) : false;

    // resolve useragent
    const userAgent = agent ? await agent.resolve(url, method) : undefined;

    // resolve headers
    const _headers = headers ? await headers.resolve(url, method) : {};

    // send request
    const httpResponse = await http.request({
      url,
      method,
      proxy: _proxy,
      headers: {
        ..._headers,
        ...(userAgent ? { "User-Agent": userAgent } : {})
      }
    });

    // print to logger
    if (logger) {
      logger.log(url);
    }

    const response = CreateResponse(httpResponse, this, this._scheduling);

    // parse response
    const data = await this.provider.parse(response);
    this.emit("data", data);
  }
  /**
   * start crawl
   */
  public start() {
    const { persistence } = this.options;

    const crawlerPathExist = fs.pathExistsSync(crawlerFilepath);

    this._scheduling.shouldPersistence = persistence;

    if (this._scheduling.shouldPersistence) {
      if (crawlerPathExist) {
        this._scheduling.sync();
        return;
      }
    }

    for (const url of this.provider.urls) {
      this._scheduling.push(new Task(url, url));
    }
  }
  /**
   * stop crawl
   */
  public stop() {
    this.active = false;
    if (this._scheduling) {
      this._scheduling.clear();
    }
  }
}
