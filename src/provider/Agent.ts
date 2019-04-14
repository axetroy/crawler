export interface AgentProvider {
  resolve(url: string, method: string): Promise<string | false>;
}