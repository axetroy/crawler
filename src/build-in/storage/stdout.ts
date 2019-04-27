import { Storage } from "../../Storage";

/**
 * Print data to stdout
 */
export class Stdout implements Storage {
  async append(dataList: any[]) {
    for (const data of dataList) {
      process.stdout.write(data + "\n");
    }
  }
}
