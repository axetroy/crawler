import * as URL from "url";
import * as fs from "fs-extra";
import * as path from "path";
import { Crawler, Provider, Response, buildIn } from "../src/index";

const domain = "http://sc.chinaz.com";

class ChinaZProvider implements Provider {
  name = "china-z";
  urls = ["/tupian/rentiyishu.html", "/tupian/renwutupian.html"].map(
    path => domain + path
  );
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

    for (const imageUrl of imagesUrls) {
      const url = URL.parse(imageUrl);
      const filePath = path.join(__dirname, "images", url.pathname);
      await fs.ensureDir(path.dirname(filePath));
      $.download(imageUrl, filePath).catch(err => {
        console.error(err.toString());
      });
    }

    return imagesUrls;
  }
}

const spider = new Crawler(ChinaZProvider, {
  timeout: 1000 * 1,
  retry: 3,
  UserAgent: buildIn.provider.RandomUserAgent
});

spider.on("data", (resultList: string[]) => {
  for (const result of resultList) {
    console.log("downloading...", result);
  }
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  console.log("finish...");
});

spider.start();
