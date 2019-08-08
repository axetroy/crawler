import { AxiosProxyConfig } from "axios";
import { Options } from "../option";
import { Method, Body } from "../http";

export interface ProxyFactory {
  new (options: Options): Proxy;
}

export interface Proxy {
  resolve(
    url: string,
    method: Method,
    body?: Body
  ): Promise<AxiosProxyConfig | false>;
}
