import { Response } from "../_Response";
import { Options } from "../Config";

export type Method =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

export type Body = string | Buffer | FormData | Uint8Array | null;

export interface UrlCustomer {
  url: string;
  method?: Method;
  body?: Body;
}

export type Url = string | UrlCustomer;

export interface ProviderFactory {
  new (options?: Options): Provider;
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
   * How to parse the response and extract data
   * @param respone The request response
   */
  parse(respone: Response): Promise<any>;
}
