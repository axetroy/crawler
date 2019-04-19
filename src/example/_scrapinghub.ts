import { Crawler, Provider, Response } from "../index";

class ScrapinghubProvider implements Provider {
  name = "scrapinghub";
  urls = ["https://blog.scrapinghub.com"];
  async parse($: Response) {
    const $nextPage = $("a.next-posts-link").eq(0);

    if ($nextPage) {
      $.follow($nextPage.prop("href"));
    }

    return $(".post-header>h2")
      .map((_, el) => $(el).text())
      .get();
  }
}

const spider = new Crawler(ScrapinghubProvider, {
  timeout: 1000 * 1,
  retry: 3
});

let articles: string[] = [];

spider.on("data", data => {
  articles = articles.concat(data);
  console.log(`Got '${data.length}' articles.`);
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  console.log(articles);
});

spider.start();
