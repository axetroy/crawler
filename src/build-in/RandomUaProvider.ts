import { AgentProvider } from "../provider/Agent";
const ua = require("modern-random-ua");

export class RandomUserAgentProvider implements AgentProvider {
  async resolve() {
    return ua.generate() as string;
  }
}
