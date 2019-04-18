import { URL } from "url";
import { Crawler, Provider, Response, Headers, Proxy } from "../index";
import { RandomUserAgentProvider } from "../build-in";
import * as cheerio from "cheerio";
import * as fs from "fs-extra";
import * as path from "path";

const domain = "https://cnodejs.org/";

class CnodeProvider implements Provider {
  urls = [domain];
  async parse(response: Response) {
    const $ = cheerio.load(response.data);
    return {
      url: response.config.url,
      items: $("a.topic_title")
        .map((i, el) => {
          return {
            title: $(el)
              .text()
              .trim(),
            href: $(el).prop("href")
          };
        })
        .get()
    };
  }
  // 是否应该进行下一页的数据爬取
  async next(response: Response) {
    const url = new URL(response.config.url);
    // const page = +url.searchParams.get("p") || 1; // 当前第 n 页
    const $ = cheerio.load(response.data);
    // 当前第 n 页
    const $pagination = $(".pagination");
    if (!$pagination) {
      return null;
    }
    const currentPage = $pagination.attr("current_page");
    const nextPage = +currentPage + 1;

    // 如果还有下一页的话
    if (nextPage) {
      url.searchParams.delete("page");
      url.searchParams.delete("tab");
      url.searchParams.append("page", nextPage + "");
      url.searchParams.append("tab", "all");
      return url.toString();
    } else {
      return null;
    }
  }
}

const spider = new Crawler({
  concurrency: 100,
  interval: 0,
  persistence: false,
  retry: 5,
  provider: new CnodeProvider(),
  agent: new RandomUserAgentProvider(),
  logger: {
    log(msg) {
      console.log("[GET]: " + msg);
    }
  }
});

const outputFile = path.join(__dirname, "cnode.md");

spider.on("data", data => {
  const rows = data.items
    .map(v => {
      return `[${v.title}](${domain.replace(/\/$/, "") + v.href})`;
    })
    .join("\n\n");
  fs.appendFileSync(outputFile, rows, { encoding: "utf8" });
});

spider.start();
