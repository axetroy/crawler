import { AxiosBasicCredentials } from "axios";
import { Options } from "../Option";
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
