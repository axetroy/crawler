import { Options } from "../Option";
export interface AgentFactory {
  new (options?: Options): UserAgent;
}
export interface UserAgent {
  resolve(url: string, method: string): Promise<string | false>;
}
