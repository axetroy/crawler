import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { Task } from "../scheduler";
import { Message } from "./types";
import { Provider } from "../provider";
import { Options } from "../option";
import { Url, Method, Response } from "../http";

console.log(`工作进程 ${process.pid} 已启动`);

async function request(task: Task) {
  const response = await axios.request({
    method: task.method,
    url: task.url,
    data: task.body
  });
  return createResponse(response);
}

function createResponse(response: AxiosResponse) {
  /**
   * jQuery selector
   * @param selector selector string
   */
  let select: CheerioStatic;
  function selector(selector: string) {
    if (select) {
      return select(selector);
    }
    select = cheerio.load(response.data);
    return select(selector);
  }

  // @ts-ignore
  const $ = Object.assign(selector, response, cheerio) as Response;

  // follow the url and crawl next url
  $.follow = (nextUrl: Url): void => {
    if (!nextUrl) {
      throw new Error(`Can not follow the url ${nextUrl}`);
    }
    const task =
      typeof nextUrl === "string"
        ? new Task("request", "GET", nextUrl)
        : new Task("request", nextUrl.method, nextUrl.url, nextUrl.body);
    const msg: Message = {
      type: "task:create",
      payload: task
    };
    process.send(msg);
  };

  // retry this request
  $.retry = () => {
    const method = (response.config.method as Method) || "GET";
    const task = new Task(
      "request",
      method,
      response.config.url,
      response.config.data
    );
    const msg: Message = {
      type: "task:create",
      payload: task
    };
    process.send(msg);
  };

  return $;
}

export default function(provider: Provider, options: Options) {
  process.on("message", (message: Message) => {
    (async () => {
      switch (message.type) {
        case "task":
          const task = message.payload as Task;
          const res = await request(task);

          const doneMsg: Message = {
            type: "task:done",
            payload: task
          };

          const data = await provider.parse(res);

          const dataMsg: Message = {
            type: "data",
            payload: data
          };

          await new Promise((resolve, reject) => {
            process.send(doneMsg, (err: Error) => {
              err ? reject(err) : resolve();
            });
          });
          await new Promise((resolve, reject) => {
            process.send(dataMsg, (err: Error) => {
              err ? reject(err) : resolve();
            });
          });
      }
    })().catch(err => {
      console.error(err);
    });
  });
}
