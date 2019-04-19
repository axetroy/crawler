import { URL } from "url";
import {
  Crawler,
  Provider,
  Response,
  RandomUserAgentProvider
} from "../src/index";

const domain = "https://cnodejs.org/";

class CNode implements Provider {
  name = "CNode";
  urls = [domain];
  async parse($: Response) {
    const $pagination = $(".pagination");
    if (!$pagination) {
      return null;
    }
    const currentPage = $pagination.attr("current_page");
    const nextPage = +currentPage + 1;

    // 如果还有下一页的话
    if (nextPage) {
      const url = new URL($.config.url);
      url.searchParams.delete("page");
      url.searchParams.delete("tab");
      url.searchParams.append("page", nextPage + "");
      url.searchParams.append("tab", "all");
      $.follow(url.toString());
    }

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
}

const spider = new Crawler(CNode, {
  concurrency: 100,
  interval: 0,
  persistence: false,
  retry: 5,
  agent: RandomUserAgentProvider
});

spider.on("data", data => {
  const rows = data.items
    .map((v: { title: any; href: string }) => {
      return `[${v.title}](${domain.replace(/\/$/, "") + v.href})`;
    })
    .join("\n\n");
  console.log(rows);
});

spider.start();
