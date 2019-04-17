import { Agent } from "../provider/Agent";
const ua = require("modern-random-ua");

export class RandomUserAgentProvider implements Agent {
  async resolve() {
    return ua.generate() as string;
  }
}
