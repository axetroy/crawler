import { AgentFactory } from "./provider/Agent";
import { ProxyFactory } from "./provider/Proxy";
import { HeadersFactory } from "./provider/Headers";

export interface Options {
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
   * The timeout of each request. Default: `0` ms. no timeout.
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
  proxy?: ProxyFactory;
  /**
   * The Usage-Agent provider.
   */
  agent?: AgentFactory;
  /**
   * The headers provider.
   */
  headers?: HeadersFactory;
}
