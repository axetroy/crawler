import { Crawler, Provider, Response, Options } from "../src";
import * as buildIn from "../src/build-in";

const domain = "https://www.baidu.com";

class MyProvider implements Provider {
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

const config: Options = {
  timeout: 1000 * 1,
  retry: 3,
  UserAgent: buildIn.provider.RandomUserAgent
};

new Crawler(MyProvider, config)
  .on("data", (resultList: string[]) => {
    for (const result of resultList) {
      console.log(result);
    }
  })
  .on("error", (err, task) => {
    console.log(`request fail on ${task.url}: ${err.message}`);
  })
  .on("finish", () => {
    console.log("finish...");
  })
  .start();
