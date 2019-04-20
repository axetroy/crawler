import {
  Crawler,
  Provider,
  Response,
  RandomUserAgentProvider
} from "../src/index";

const domain = "https://www.baidu.com";

class BaiDuProvider implements Provider {
  name = "baidu";
  urls = ["chrome", "firefox", "safari"].map(
    keyword => domain + "/s?wd=" + keyword
  );
  async parse($: Response) {
    const nextPageUrl = $("a.n")
      .eq(0)
      .prop("href");
    if (nextPageUrl) {
      $.follow(domain + nextPageUrl);
    }

    return $(".result h3 a")
      .map((i, el) => $(el).text())
      .get();
  }
}

const spider = new Crawler(BaiDuProvider, {
  timeout: 1000 * 1,
  retry: 3,
  UserAgent: RandomUserAgentProvider
});

spider.on("data", (resultList: string[]) => {
  for (const result of resultList) {
    console.log(result);
  }
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  console.log("finish...");
});

spider.start();
