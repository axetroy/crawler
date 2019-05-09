import * as URL from "url";
import * as path from "path";
import { Crawler, Provider, Response, buildIn } from "../src/index";

const domain = "https://www.mzitu.com";

class MeiZiProvider implements Provider {
  name = "meizhi";
  urls = [domain];
  async parse($: Response) {
    const nextPageUrl = $("a.next")
      .eq(0)
      .prop("href");

    if (nextPageUrl) {
      $.follow(nextPageUrl);
    }

    const imagesUrls = $(".postlist ul li img")
      .map((i, el) => $(el).attr("data-original"))
      .get() as string[];

    // download images
    for (const imageUrl of imagesUrls) {
      const url = URL.parse(imageUrl);
      const filePath = path.join(__dirname, "images", url.pathname);
      $.downloadInQueue(imageUrl, filePath);
    }

    return imagesUrls;
  }
}

const spider = new Crawler(MeiZiProvider, {
  concurrency: 2,
  timeout: 1000 * 5,
  retry: 3,
  interval: 5000,
  UserAgent: buildIn.provider.RandomUserAgent
  // persistence: true
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  console.log("finish...");
});

spider.start();
