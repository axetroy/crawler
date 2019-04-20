import { Options } from "../Option";
import { Method, Body } from "../Http";
export interface AgentFactory {
  new (options?: Options): UserAgent;
}
export interface UserAgent {
  resolve(url: string, method: Method, body?: Body): Promise<string | false>;
}
