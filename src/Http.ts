import { Stream } from "stream";
import { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as download from "download";
import * as fs from "fs-extra";
import { ICrawler } from "./Crawler";
import { Scheduler, Task } from "./Scheduler";
import { sleep } from "./utils";

export type JSONPrimitive = string | number | boolean | null;
export type JSONObject = { [key: string]: JSONValue };
export interface JSONArray extends Array<JSONValue> {}
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type Method =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

export type Body =
  | string
  | JSONValue
  | Buffer
  | ArrayBuffer
  | ArrayBufferView
  | Uint8Array
  | URLSearchParams
  | Stream
  | null;

export interface UrlCustomer {
  url: string;
  method?: Method;
  body?: Body;
}

export type Url = string | UrlCustomer;

export interface Response extends AxiosResponse, CheerioSelector, CheerioAPI {
  download(
    url: string,
    filepath: string,
    options?: download.DownloadOptions
  ): Promise<void>;
  follow(url: string): void;
}

export function createResponse(
  response: AxiosResponse,
  crawler: ICrawler,
  scheduler: Scheduler
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

  // @ts-ignore
  const $ = Object.assign(selector, response, cheerio) as Response;

  $.download = (
    url: string,
    filepath: string,
    options?: download.DownloadOptions
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
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
        sleep(interval).then(() => scheduler.push(task));
      } else {
        scheduler.push(task);
      }
    }
  };

  return $;
}
