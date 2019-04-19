import { AxiosBasicCredentials } from "axios";
import { Options } from "../Config";

export interface AuthFactory {
  new (options: Options): Auth;
}

export interface Auth {
  resolve(url: string, method: string): Promise<AxiosBasicCredentials>;
}
