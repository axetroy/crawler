import { AxiosBasicCredentials } from "axios";
import { Options } from "../option";
import { Method, Body } from "../http";

export interface AuthFactory {
  new (options: Options): Auth;
}

export interface Auth {
  resolve(
    url: string,
    method: Method,
    body?: Body
  ): Promise<AxiosBasicCredentials>;
}
