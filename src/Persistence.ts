import * as path from "path";
import * as fs from "fs-extra";
import { Task, Scheduler } from "./Scheduler";

export interface TasksJsonFile {
  running: Task[];
  pendding: Task[];
}

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
      const { running, pendding } = fs.readJsonSync(
        this.TaskFilePath
      ) as TasksJsonFile;

      if (!running || !pendding) {
        return false;
      }

      if (!running.length && !pendding.length) {
        return false;
      }

      if (running && running.length) {
        for (const task of running) {
          this.scheduler.push(task);
        }
      }
      if (pendding && pendding.length) {
        for (const task of pendding) {
          this.scheduler.push(task);
        }
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
  public sync(runningTasks: Task[], penddingTasks: Task[]) {
    const json: TasksJsonFile = {
      running: runningTasks,
      pendding: penddingTasks
    };
    fs.writeJsonSync(this.TaskFilePath, json, {
      spaces: 2,
      replacer: null
    });
  }
}
