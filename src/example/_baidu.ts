import { URL } from "url";
import { Crawler, Provider, Response } from "../index";
import { RandomUserAgentProvider } from "../build-in";

class Baidu implements Provider {
  name = "baidu";
  urls = [
    "https://www.baidu.com/s?wd=chrome",
    "https://www.baidu.com/s?wd=firefox",
    "https://www.baidu.com/s?wd=safari",
    "https://www.baidu.com/s?wd=ios",
    "https://www.baidu.com/s?wd=iphone",
    "https://www.baidu.com/s?wd=macbook",
    "https://www.baidu.com/s?wd=google",
    "https://www.baidu.com/s?wd=android",
    "https://www.baidu.com/s?wd=soon"
  ];
  // 提取数据
  async parse($: Response) {
    const url = new URL($.config.url);
    const pageOffset = +url.searchParams.get("pn") || 0;
    if (pageOffset < 200) {
      url.searchParams.delete("pn");
      url.searchParams.append("pn", pageOffset + 10 + "");
      $.follow(url.toString());
    }

    return {
      url: $.config.url,
      items: $(".result h3 a")
        .map((i, el) => {
          return {
            title: $(el).text(),
            href: $(el).attr("href")
          };
        })
        .get()
    };
  }
}

const spider = new Crawler(new Baidu(), {
  concurrency: 100,
  interval: 0,
  persistence: true,
  retry: 5,
  agent: new RandomUserAgentProvider()
});

spider.on("data", data => {
  console.log("收到数据", data);
});

spider.start();
