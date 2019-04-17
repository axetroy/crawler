export interface Agent {
  resolve(url: string, method: string): Promise<string | false>;
}