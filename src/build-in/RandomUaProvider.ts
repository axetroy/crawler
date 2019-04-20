import { Agent } from "../agent/Agent";

/**
 * Build-in Agent provider.
 * Set random `Usage-Agent` for every request.
 */
export class RandomUserAgentProvider implements Agent {
  /**
   * Resolve random `Usage-Agent`
   */
  async resolve() {
    return require("modern-random-ua").generate() as string;
  }
}
