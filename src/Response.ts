import { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as download from "download";
import * as fs from "fs-extra";

export interface Response extends AxiosResponse, CheerioSelector, CheerioAPI {
  download(url: string, filepath: string): Promise<void>;
  follow(url: string): void;
}

export function CreateResponse(response: AxiosResponse) {
  const $: Response = function(selector: string) {
    return cheerio.load(response.data)(selector);
  };

  $.status = response.status;
  $.statusText = response.statusText;
  $.config = response.config;
  $.headers = response.headers;
  $.data = response.data;

  $.download = (url: string, filepath: string) => {
    return new Promise((resolve, reject) => {
      download(url)
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
  $.follow = (url: string) => {};

  $.load = cheerio.load.bind(cheerio);
  $.xml = cheerio.xml.bind(cheerio);
  $.html = cheerio.html.bind(cheerio);
  $.parseHTML = cheerio.parseHTML.bind(cheerio);
  $.root = cheerio.root.bind(cheerio);
  $.contains = cheerio.contains.bind(cheerio);

  return $;
}
