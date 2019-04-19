import { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as download from "download";
import * as fs from "fs-extra";
import { ICrawler } from "./Crawler";
import { Scheduling } from "./_Scheduling";

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
) {
  const $: Response = function(selector: string) {
    return cheerio.load(response.data)(selector);
  };

  $.status = response.status;
  $.statusText = response.statusText;
  $.config = response.config;
  $.headers = response.headers;
  $.data = response.data;
  $.request = response.request;

  $.download = (
    url: string,
    filepath: string,
    options: download.DownloadOptions
  ) => {
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
      scheduling.push({ name: nextUrl, data: nextUrl });
    }
  };

  $.load = cheerio.load.bind(cheerio);
  $.xml = cheerio.xml.bind(cheerio);
  $.html = cheerio.html.bind(cheerio);
  $.parseHTML = cheerio.parseHTML.bind(cheerio);
  $.root = cheerio.root.bind(cheerio);
  $.contains = cheerio.contains.bind(cheerio);

  return $;
}
