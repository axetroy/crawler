import { IncomingHttpHeaders } from "http";
import { Options } from "../Option";
import { Method, Body } from "../Http";

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
