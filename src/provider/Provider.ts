import { AxiosResponse } from "axios";

export interface Provider {
  urls: string[];
  parse(respone: AxiosResponse): Promise<any>;
  next(lastResponse: AxiosResponse): Promise<string>;
}
