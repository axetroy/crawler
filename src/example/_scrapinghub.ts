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
      .map((i, el) => $(el).text())
      .get();
  }
}

const spider = new Crawler(ScrapinghubProvider);

let articles: string[] = [];

spider.on("data", data => {
  articles = articles.concat(data);
  console.log(`Got '${data.length}' articles.`);
});

spider.on("finish", () => {
  console.log(articles);
});

spider.start();
