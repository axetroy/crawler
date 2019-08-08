import { IncomingHttpHeaders } from "http";
import { Options } from "../option";
import { Method, Body } from "../http";

export interface HeadersFactory {
  new (options: Options): Headers;
}

export interface Headers {
  resolve(
    url: string,
    method: Method,
    body?: Body
  ): Promise<IncomingHttpHeaders>;
}
