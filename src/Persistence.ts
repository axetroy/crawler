import * as fs from "fs-extra";
import { Task } from "./Scheduling";
import { crawlerFilepath } from "./constant";

export class Persistence {
  private filename = crawlerFilepath;
  sync(tasks?: Task<any>[]) {
    if (!tasks) {
      return fs.readJsonSync(this.filename);
    } else {
      fs.writeJsonSync(this.filename, tasks, { spaces: 2 });
      return tasks;
    }
  }
}
