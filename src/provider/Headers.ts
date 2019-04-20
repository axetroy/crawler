import { IncomingHttpHeaders } from "http";
import { Options } from "../Option";

export interface HeadersFactory {
  new (options: Options): Headers;
}

export interface Headers {
  resolve(url: string, method: string): Promise<IncomingHttpHeaders>;
}
