import { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as download from "download";
import * as fs from "fs-extra";
import { ICrawler } from "./Crawler";
import { Url } from "./provider/Provider";
import { Scheduling, Task } from "./Scheduling";
import { sleep } from "./utils";

export interface Response extends AxiosResponse, CheerioSelector, CheerioAPI {
  download(
    url: string,
    filepath: string,
    options: download.DownloadOptions
  ): Promise<void>;
  follow(url: string): void;
}

export function CreateResponse(
  response: AxiosResponse,
  crawler: ICrawler,
  scheduling: Scheduling
): Response {
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

  const $ = Object.assign(selector, response, cheerio) as Response;

  $.download = (
    url: string,
    filepath: string,
    options: download.DownloadOptions
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      download(url, undefined, options)
        .pipe(fs.createWriteStream(filepath))
        .once("error", err => {
          reject(err);
        })
        .once("finish", () => {
          resolve();
        });
    });
  };

  const { interval } = crawler.options;

  // 跟着跳到下一个链接
  $.follow = (nextUrl: Url) => {
    if (crawler.active && nextUrl) {
      const task =
        typeof nextUrl === "string"
          ? new Task(nextUrl)
          : new Task(nextUrl.url, nextUrl.method, nextUrl.body);
      if (interval) {
        sleep(interval).then(() => scheduling.push(task));
      } else {
        scheduling.push(task);
      }
    }
  };

  return $;
}
