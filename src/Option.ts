import { AgentFactory } from "./agent/UserAgent";
import { ProxyFactory } from "./agent/Proxy";
import { HeadersFactory } from "./agent/Headers";
import { AuthFactory } from "./agent/Auth";

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
   * The interval between after request done. let it take a rest. Default: `0`.
   */
  interval?: number;
  /**
   * The timeout of each request. Default: `60 * 1000` ms.
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
  Proxy?: ProxyFactory;
  /**
   * The Usage-Agent provider.
   */
  UserAgent?: AgentFactory;
  /**
   * The headers provider.
   */
  Headers?: HeadersFactory;
  /**
   * The auth provider.
   */
  Auth?: AuthFactory;
}
