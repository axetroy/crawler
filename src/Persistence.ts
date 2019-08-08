import * as path from "path";
import * as fs from "fs-extra";
import { Task, Scheduler } from "./Scheduler";

export interface TasksJsonFile {
  running: Task[];
  pending: Task[];
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
      const { running, pending } = fs.readJsonSync(
        this.TaskFilePath
      ) as TasksJsonFile;

      if (!running || !pending) {
        return false;
      }

      if (!running.length && !pending.length) {
        return false;
      }

      if (running && running.length) {
        for (const task of running) {
          this.scheduler.push(task);
        }
      }
      if (pending && pending.length) {
        for (const task of pending) {
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
  public sync(runningTasks: Task[], pendingTasks: Task[]) {
    const json: TasksJsonFile = {
      running: runningTasks,
      pending: pendingTasks
    };
    fs.writeJsonSync(this.TaskFilePath, json, {
      spaces: 2,
      replacer: null
    });
  }
}
