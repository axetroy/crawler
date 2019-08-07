import * as URL from "url";
import * as path from "path";
import { Crawler, Provider, Response, Options } from "../src/index";
import * as buildIn from "../src/build-in";

const domain = "http://sc.chinaz.com";

class MyProvider implements Provider {
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

const config: Options = {
  concurrency: 20,
  timeout: 1000 * 5,
  retry: 3,
  interval: 1000,
  UserAgent: buildIn.provider.RandomUserAgent,
  persistence: true
};

new Crawler(MyProvider, config)
  .on("error", (err, task) => {
    console.log(`request fail on ${task.url}: ${err.message}`);
  })
  .on("finish", () => {
    console.log("finish...");
  })
  .start();
