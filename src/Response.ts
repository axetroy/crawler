import { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as download from "download";
import * as fs from "fs-extra";
import { ICrawler } from "./Crawler";
import { Scheduling, Task } from "./_Scheduling";
import { sleep } from "./_utils";

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
  function selector(selector: string) {
    return cheerio.load(response.data)(selector);
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

  const { interval } = crawler.config;

  // 跟着跳到下一个链接
  $.follow = (nextUrl: string) => {
    if (crawler.active && nextUrl) {
      const task = new Task(nextUrl, nextUrl);
      if (interval) {
        sleep(interval).then(() => scheduling.push(task));
      } else {
        scheduling.push(task);
      }
    }
  };

  return $;
}
