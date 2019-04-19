import { Response } from "../Response";

export interface Provider {
  /**
   * The name of provider
   */
  name: string;
  /**
   * The urls that was originally crawled
   */
  urls: string[];
  /**
   * How to parse the response and extract data
   * @param respone The request response
   */
  parse(respone: Response): Promise<any>;
}
