import { URL } from "url";
import { Crawler, Provider, Response, Headers, Proxy } from "../index";
import { RandomUserAgentProvider } from "../build-in";
import * as cheerio from "cheerio";

class V2EX implements Provider {
  name = "v2ex";
  urls = [
    "https://www.v2ex.com/go/chrome",
    "https://www.v2ex.com/go/safari",
    "https://www.v2ex.com/go/firefox"
  ];
  // 提取数据
  async parse(response: Response) {
    const $ = cheerio.load(response.data);
    return {
      url: response.config.url,
      // content: response.data,
      items: $(".item_title a")
        .map((i, el) => {
          return {
            title: $(el).text(),
            href: $(el).attr("href")
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
    const page = $(".page_current")
      .eq(0)
      .text()
      .trim();

    if (+page < 20) {
      url.searchParams.delete("p");
      url.searchParams.append("p", page + 1 + "");
      return url.toString();
    } else {
      return null;
    }

    // if (pageOffset < 200) {
    //   url.searchParams.delete("pn");
    //   url.searchParams.append("pn", pageOffset + 10 + "");
    //   return url.toString();
    // } else {
    //   return null;
    // }
  }
}

class MyHeaders implements Headers {
  async resolve() {
    return {
      // "X-Forwarded-For": "54.13.13.55"
    };
  }
}

class MyProxy implements Proxy {
  async resolve() {
    return {
      host: "https://27.42.173.133",
      port: 80
    };
  }
}

const spider = new Crawler({
  concurrency: 100,
  interval: 0,
  persistence: true,
  retry: 5,
  provider: new V2EX(),
  agent: new RandomUserAgentProvider(),
  headers: new MyHeaders(),
  proxy: new MyProxy(),
  logger: {
    log(msg) {
      console.log(msg);
    }
  }
});

spider.on("data", data => {
  console.log("收到数据", data);
});

spider.start();
