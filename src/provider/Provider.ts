import { Options } from "../Option";
import { Url, Response } from "../Http";

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
