import { IncomingHttpHeaders } from "http";
import { AxiosRequestConfig } from "axios";
import { Crawler } from "./Crawler";
import { Url, Response } from "./http";

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
   * Before start crawl the starts up. we can return a new start urls.
   * You can change `urls` in this function.
   * @param startUrls
   */
  beforeStartUrl?(startUrls: Url[]): Promise<Url[]>;
  /**
   * Before start provider. something we want to do.
   * eg. connect to database.
   */
  beforeStart?(): Promise<void>;
  /**
   * When before request. You can change the config before send request.
   * @param config
   */
  beforeRequest?(config: AxiosRequestConfig): Promise<void>;
}
