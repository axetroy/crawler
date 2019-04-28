import { IncomingHttpHeaders } from "http";
import { AxiosRequestConfig } from "axios";
import { Crawler } from "./Crawler";
import { Url, Response } from "./Http";

export interface ProviderFactory {
  new (ctx: Crawler): Provider;
}

export interface Provider {
  /**
   * The name of provider
   */
  name: string;
  /**
   * The urls that was originally crawled
   */
  urls: Url[];
  /**
   * The default headers for send request.
   */
  defaultHeaders?: IncomingHttpHeaders;
  /**
   * How to parse the response and extract data
   * @param respone The request response
   */
  parse(respone: Response): Promise<any[]>;
  /**
   * Before start provider. something we want to do.
   * eg. connect to database.
   */
  beforeStart?(): Promise<void>;
  /**
   * When before request. You can change the config before send request.
   */
  beforeRequest?(config: AxiosRequestConfig): Promise<void>;
}
