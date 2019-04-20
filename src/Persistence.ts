import * as path from "path";
import * as fs from "fs-extra";
import { Task, Scheduler } from "./Scheduler";

export class Persistence {
  public CrawlerDirPath = path.join(process.cwd(), ".crawler");
  public TaskFilePath = path.join(this.CrawlerDirPath, "task.json");
  constructor(private scheduler: Scheduler) {
    fs.ensureDirSync(this.CrawlerDirPath);
    fs.ensureFileSync(this.TaskFilePath);
  }
  /**
   * Load the last tasks from file
   * @returns Whether load success or not
   */
  public load(): boolean {
    try {
      const tasks = fs.readJsonSync(this.TaskFilePath) as Task[];
      // if task is empty
      if (!tasks.length) {
        return false;
      }
      const taskIds = tasks.map(v => v.id);
      this.scheduler.setCurrentId(Math.max(...taskIds));
      for (const task of tasks) {
        this.scheduler.push(task);
      }
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Sync current task to file
   * @param tasks
   */
  public sync(tasks: Task[]) {
    fs.writeJsonSync(this.TaskFilePath, tasks, {
      spaces: 2,
      replacer: null
    });
  }
}
