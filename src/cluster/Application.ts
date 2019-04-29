import { EventEmitter } from "events";
import * as cluster from "cluster";
import * as os from "os";

import { Provider } from "../Provider";
import { Options } from "../Option";
import { Task } from "../Scheduler";
import { Message } from "./types";

const numCPUs = os.cpus().length;

interface Workspace {
  id: number;
  taskNumber: number;
  workder: cluster.Worker;
}

function sum(array: number[]) {
  return [].slice.call(arguments).reduce(function(accumulator, currentValue) {
    return accumulator + currentValue;
  }, 0);
}

export class Application extends EventEmitter {
  constructor(private provider: Provider, private options: Options) {
    super();
  }
  private pendding: Task[] = [];
  private workspace: Workspace[] = [];
  private allot() {
    if (!this.pendding.length) {
      return;
    }

    let task: Task;

    while ((task = this.pendding.shift() && task)) {
      const workspace = this.idleWorkspace;

      const msg: Message = {
        type: "task",
        payload: task
      };
      workspace.taskNumber++;
      workspace.workder.send(msg);
    }
  }
  private get idleWorkspace() {
    const currentRunningNum = sum(this.workspace.map(v => v.taskNumber));

    const w = this.workspace.sort((a, b) => a.taskNumber - b.taskNumber);
    return w[0];
  }
  private master() {
    console.log(`主进程 ${process.pid} 正在运行`);

    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork();
      worker.on("message", (msg: Message) => {
        switch (msg.type) {
          case "task:create":
            this.pendding.push(msg.payload as Task);
            this.allot();
            break;
          case "task:done":
            const task = msg.payload as Task;
            console.log("任务完成:", task.url);
            const workspace = this.workspace.find(v => v.id === worker.id);
            workspace.taskNumber--;
            this.allot();
            break;
          case "data":
            this.emit("data", msg.payload);
            break;
          default:
            throw new Error("unknown message: " + msg + "");
        }
      });
      this.workspace.push({
        id: worker.id,
        taskNumber: 0,
        workder: worker
      });
    }

    for (const url of this.provider.urls) {
      const task =
        typeof url === "string"
          ? new Task("request", "GET", url)
          : new Task("request", url.method, url.url, url.body);
      this.pendding.push(task);
    }

    this.allot();

    cluster.on("exit", (worker, code, signal) => {
      console.log(`工作进程 ${worker.process.pid} 已退出`);
    });
  }
  start() {
    if (cluster.isMaster) {
      this.master();
    } else {
      const worker = require("./Worker").default;
      worker(this.provider, this.options);
    }
  }
}
