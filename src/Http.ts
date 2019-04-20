import { Stream } from "stream";
import { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as download from "download";
import * as fs from "fs-extra";
import { ICrawler } from "./Crawler";
import { Scheduler, Task } from "./Scheduler";

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
  /**
   * How many times(ms) it takes.
   */
  times: number;
  /**
   * Download the resource
   * @param url The resource url
   * @param filepath The filepath which is the resource downloaded
   * @param options
   */
  download(
    url: string,
    filepath: string,
    options?: download.DownloadOptions
  ): Promise<void>;
  /**
   * Go to the next url
   * @param Url
   */
  follow(url: Url): void;
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
      const _proxy = response.config.proxy;
      const proxy = _proxy ? _proxy.host + ":" + _proxy.port : undefined;
      const _options: download.DownloadOptions = {
        headers: response.config.headers,
        proxy,
        ...(options || {})
      };
      // @ts-ignore
      download(url, undefined, _options)
        .pipe(fs.createWriteStream(filepath))
        .once("error", err => {
          reject(err);
        })
        .once("finish", () => {
          resolve();
        });
    });
  };

  // 跟着跳到下一个链接
  $.follow = (nextUrl: Url) => {
    if (crawler.active && nextUrl) {
      const task =
        typeof nextUrl === "string"
          ? new Task(nextUrl)
          : new Task(nextUrl.url, nextUrl.method, nextUrl.body);
      scheduler.push(task);
    }
  };

  return $;
}
