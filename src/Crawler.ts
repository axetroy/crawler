import { EventEmitter } from "events";
import * as fs from "fs-extra";
import axios from "axios";
import { Task, Scheduling } from "./Scheduling";
import { AgentProvider } from "./provider/Agent";
import { ProxyProvider } from "./provider/Proxy";
import { LoggerProvider } from "./provider/Logger";
import { HeaderProvider } from "./provider/Header";
import { Provider } from "./provider/Provider";
import { sleep } from "./utils";
import { crawlerFilepath } from "./constant";

const http = axios.create();

export interface Config {
  /**
   * The max concurrency of request. Default `1`
   */
  concurrency?: number;
  /**
   * Run in headless mode. Default: `false`
   */
  headless?: boolean;
  /**
   * The interval between each loop. Default: `0`
   */
  interval?: number;
  /**
   * The timeout of each request. Default: `1000 * 30` ms
   */
  timeout?: number;
  /**
   * The retry times of each request when fail. Default: `1`
   */
  retry?: number;
  persistence?: boolean;
  proxy?: ProxyProvider;
  agent?: AgentProvider;
  headers?: HeaderProvider;
  logger?: LoggerProvider;
  provider: Provider;
}

export class Crawler extends EventEmitter {
  private _active = true;
  private _scheduling: Scheduling;
  constructor(private config: Config) {
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
    const response = await http.request({
      url,
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
  start() {
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
  stop() {
    this._active = false;
    if (this._scheduling) {
      this._scheduling.clear();
    }
  }
}
