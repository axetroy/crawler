import { Agent } from "./provider/Agent";
import { Proxy } from "./provider/Proxy";
import { Logger } from "./provider/Logger";
import { Headers } from "./provider/Header";
import { Provider } from "./provider/Provider";

export interface Config {
  /**
   * The max concurrency of request. Default `1`.
   */
  concurrency?: number;
  /**
   * Run in headless mode. Default: `false`.
   */
  headless?: boolean;
  /**
   * The interval between each loop. Default: `0`.
   */
  interval?: number;
  /**
   * The timeout of each request. Default: `1000 * 30` ms.
   */
  timeout?: number;
  /**
   * The retry times of each request when fail. Default: `0`.
   */
  retry?: number;
  /**
   * Whether to continue the last crawl. Default: `false`.
   */
  persistence?: boolean;
  /**
   * The proxy provider.
   */
  proxy?: Proxy;
  /**
   * The Usage-Agent provider.
   */
  agent?: Agent;
  /**
   * The headers provider.
   */
  headers?: Headers;
  /**
   * The logger provider.
   */
  logger?: Logger;
  /**
   * The main provider you want to crawl. required.
   */
  provider: Provider;
}
