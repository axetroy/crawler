import { URL } from "url";
import { Crawler, Provider, Response } from "../index";
import { RandomUserAgentProvider } from "../build-in";
import * as fs from "fs-extra";
import * as path from "path";

const domain = "https://cnodejs.org/";

class CNode implements Provider {
  name = "CNode";
  urls = [domain];
  async parse($: Response) {
    return {
      url: $.config.url,
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
  async next($: Response) {
    const url = new URL($.config.url);
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
  provider: new CNode(),
  agent: new RandomUserAgentProvider(),
  logger: {
    log(msg) {
      console.log("[GET]: " + msg);
    }
  }
});

const outputFile = path.join(__dirname, "data", "cnode.md");

spider.on("data", data => {
  const rows = data.items
    .map(v => {
      return `[${v.title}](${domain.replace(/\/$/, "") + v.href})`;
    })
    .join("\n\n");
  fs.appendFileSync(outputFile, rows, { encoding: "utf8" });
});

spider.start();
