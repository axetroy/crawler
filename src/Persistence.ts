import * as fs from "fs-extra";
import { Task } from "./Scheduler";
import { crawlerFilepath } from "./Constant";

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
