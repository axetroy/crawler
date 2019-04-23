import * as URL from "url";
import * as path from "path";
import { Crawler, Provider, Response, buildIn } from "../src/index";

const domain = "http://sc.chinaz.com";

class ChinaZProvider implements Provider {
  name = "china-z";
  urls = [
    "/tupian/rentiyishu.html",
    "/tupian/renwutupian.html",
    "/tupian/huadetupian.html"
  ].map(path => domain + path);
  async parse($: Response) {
    const nextPageUrl = $("a.nextpage")
      .eq(0)
      .prop("href");

    if (nextPageUrl) {
      $.follow(domain + "/tupian/" + nextPageUrl);
    }

    const imagesUrls = $(".picblock img")
      .map((i, el) => $(el).attr("src2"))
      .get();

    // download images
    (async () => {
      for (const imageUrl of imagesUrls) {
        const url = URL.parse(imageUrl);
        const filePath = path.join(__dirname, "images", url.pathname);
        $.downloadInQueue(imageUrl, filePath);
      }
    })().catch(err => {
      console.error("Download fail: " + err.message);
    });

    return imagesUrls;
  }
}

const spider = new Crawler(ChinaZProvider, {
  concurrency: 20,
  timeout: 1000 * 5,
  retry: 3,
  interval: 1000,
  UserAgent: buildIn.provider.RandomUserAgent,
  persistence: true
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  console.log("finish...");
});

spider.start();
