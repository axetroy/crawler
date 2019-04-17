import { AxiosResponse } from "axios";

export interface Provider {
  /**
   * The urls that was originally crawled
   */
  urls: string[];
  /**
   * How to parse the response and extract data
   * @param respone The request response
   */
  parse(respone: AxiosResponse): Promise<any>;
  /**
   * Decide if you should continue to crawl the next url
   * @param lastResponse The request response
   */
  next(respone: AxiosResponse): Promise<string>;
}
