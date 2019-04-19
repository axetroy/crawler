import { EventEmitter } from "events";
import * as fs from "fs-extra";
import axios from "axios";
import { Task, Scheduling } from "./_Scheduling";
import { sleep } from "./_utils";
import { crawlerFilepath } from "./_constant";
import { Config } from "./Config";
import { CreateResponse } from "./Response";

/**
 * @ignore
 */
const http = axios.create();

export class Crawler extends EventEmitter {
  private _active = true;
  private _scheduling: Scheduling;
  constructor(public config: Config) {
    super();
    const { concurrency, interval, timeout, retry } = this.config;

    const scheduling = new Scheduling(
      async (task: Task<any>) => {
        const nextUrl = await this._next(task.data as string, "GET");
        if (interval > 0) {
          await sleep(interval);
        }
        if (this._active && nextUrl) {
          scheduling.push({ name: nextUrl, data: nextUrl });
        }
      },
      {
        concurrency,
        timeout,
        retry
      }
    );

    this._scheduling = scheduling;
  }
  private async _next(url: string, method: string): Promise<string> {
    const { provider, proxy, agent, logger, headers } = this.config;

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

    const response = CreateResponse(httpResponse);

    // parse response
    const data = await provider.parse(response);
    this.emit("data", data);

    // should go to next page?
    const nextUrl = await provider.next(response);
    if (nextUrl) {
      return nextUrl;
    }
    return;
  }
  /**
   * start crawl
   */
  public start() {
    const { provider, persistence } = this.config;

    const crawlerPathExist = fs.pathExistsSync(crawlerFilepath);

    this._scheduling.shouldPersistence = persistence;

    if (this._scheduling.shouldPersistence) {
      if (crawlerPathExist) {
        this._scheduling.sync();
        return;
      }
    }

    for (const url of provider.urls) {
      this._scheduling.push({ name: url, data: url });
    }
  }
  /**
   * stop crawl
   */
  public stop() {
    this._active = false;
    if (this._scheduling) {
      this._scheduling.clear();
    }
  }
}
