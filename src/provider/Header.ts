import { IncomingHttpHeaders } from "http";

export interface HeaderProvider {
  resolve(url: string, method: string): Promise<IncomingHttpHeaders>;
}
