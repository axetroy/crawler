import { AxiosProxyConfig } from "axios";
import { Options } from "../Option";
import { Method, Body } from "../Http";

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
