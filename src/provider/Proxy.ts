import { AxiosProxyConfig } from "axios";

export interface ProxyProvider {
  resolve(url: string, method: string): Promise<AxiosProxyConfig | false>;
}
