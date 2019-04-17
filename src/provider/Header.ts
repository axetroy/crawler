import { IncomingHttpHeaders } from "http";

export interface Headers {
  resolve(url: string, method: string): Promise<IncomingHttpHeaders>;
}
