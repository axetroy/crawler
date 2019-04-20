import { AxiosProxyConfig } from "axios";
import { Options } from "../Option";

export interface ProxyFactory {
  new (options: Options): Proxy;
}

export interface Proxy {
  resolve(url: string, method: string): Promise<AxiosProxyConfig | false>;
}
