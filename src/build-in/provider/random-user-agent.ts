import { UserAgent } from "../../agent/user-agent";

/**
 * Build-in Agent provider.
 * Set random `Usage-Agent` for every request.
 */
export class RandomUserAgent implements UserAgent {
  /**
   * Resolve random `Usage-Agent`
   */
  async resolve() {
    return require("modern-random-ua").generate() as string;
  }
}
