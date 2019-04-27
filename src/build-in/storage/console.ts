import { Storage } from "../../Storage";

/**
 * Print data to console.log
 */
export class Console implements Storage {
  async append(dataList: any[]) {
    for (const data of dataList) {
      console.log(data);
    }
  }
}
