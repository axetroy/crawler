import { Storage } from "../../Storage";

/**
 * Print data to stderr
 */
export class Stderr implements Storage {
  async append(dataList: any[]) {
    for (const data of dataList) {
      process.stderr.write(data + "\n");
    }
  }
}
