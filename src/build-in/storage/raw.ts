import * as fs from "fs-extra";
import { Storage } from "../../storage";

export interface RawOptions {
  filepath: string; // the json file path
}

/**
 * Storage the data as a json file
 */
export class Raw implements Storage {
  constructor(private options: RawOptions) {
    fs.ensureFileSync(options.filepath);
  }
  async append(dataList: any[]) {
    for (const data of dataList) {
      await fs.appendFile(this.options.filepath, data + "\n");
    }
  }
}
