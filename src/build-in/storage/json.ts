import * as fs from "fs-extra";
import { Storage } from "../../storage";

export interface JsonOptions {
  filepath: string; // the json file path
}

/**
 * Storage the data as a json file
 */
export class Json implements Storage {
  constructor(private options: JsonOptions) {
    const jsonFilePath = options.filepath;

    const isExist = fs.pathExistsSync(jsonFilePath);

    if (isExist === false) {
      // ensure json file exist
      fs.ensureFileSync(jsonFilePath);
      fs.writeJsonSync(jsonFilePath, []);
    } else {
      const json = fs.readJsonSync(jsonFilePath);
      if (!Array.isArray(json)) {
        this.throwInvalidJsonFile();
      }
    }
  }
  private throwInvalidJsonFile() {
    throw new Error(
      `The file '${this.options.filepath}' is not a valid json file.`
    );
  }
  public async append(dataList: any[]) {
    const jsonFilePath = this.options.filepath;
    let list = await fs.readJson(jsonFilePath);
    if (Array.isArray(list)) {
      list = list.concat(dataList);
      await fs.writeJson(jsonFilePath, list, { replacer: null, spaces: 4 });
    } else {
      this.throwInvalidJsonFile();
    }
  }
}
