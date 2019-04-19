import { IncomingHttpHeaders } from "http";
import { Options } from "../Config";

export interface HeadersFactory {
  new (options: Options): Headers;
}

export interface Headers {
  resolve(url: string, method: string): Promise<IncomingHttpHeaders>;
}
