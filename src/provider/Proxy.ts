import { AxiosProxyConfig } from "axios";

export interface Proxy {
  resolve(url: string, method: string): Promise<AxiosProxyConfig | false>;
}
