import { Options } from "../option";
import { Method, Body } from "../http";
export interface AgentFactory {
  new (options?: Options): UserAgent;
}
export interface UserAgent {
  resolve(url: string, method: Method, body?: Body): Promise<string | false>;
}
