import { EventEmitter } from "events";
import axios from "axios";
import { Task, Scheduling } from "./Scheduling";
import { AgentProvider } from "./provider/Agent";
import { ProxyProvider } from "./provider/Proxy";
import { LoggerProvider } from "./provider/Logger";
import { HeaderProvider } from "./provider/Header";
import { Provider } from "./provider/Provider";
import { sleep } from "./utils";
const ua = require("modern-random-ua");

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
  proxy?: ProxyProvider;
  agent?: AgentProvider;
  headers?: HeaderProvider;
  logger?: LoggerProvider;
  provider: Provider;
}

export class Crawler extends EventEmitter {
  private _scheduling: Scheduling;
  constructor(private config: Config) {
    super();
  }
  private async _next(url: string, method: string): Promise<string> {
    const { provider, proxy, agent, logger, headers } = this.config;

    // resolve proxy
    const _proxy = proxy ? (await proxy.resolve(url, method)) || false : false;

    // resolve useragent
    const userAgent = agent
      ? agent.resolve(url, method)
      : (ua.generate() as string);

    // resolve headers
    const _headers = headers ? headers.resolve(url, method) : {};

    // send request
    const response = await http.request({
      url,
      proxy: _proxy,
      headers: {
        ..._headers,
        "User-Agent": userAgent
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
    const { provider, interval } = this.config;
    const concurrency = this.config.concurrency || 1;
    const method = "GET";

    const scheduling = new Scheduling(concurrency, async (task: Task<any>) => {
      const nextUrl = await this._next(task.data as string, method);
      if (interval > 0) {
        await sleep(interval);
      }
      if (nextUrl) {
        scheduling.push({ name: nextUrl, data: nextUrl });
      }
    });

    this._scheduling = scheduling;

    for (const url of provider.urls) {
      scheduling.push({ name: url, data: url });
    }
  }
  /**
   * stop crawl
   */
  stop() {
    if (this._scheduling) {
      this._scheduling.clear();
    }
  }
}
