import { Crawler, Provider, Response } from "../src/index";

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
  timeout: 1000 * 5,
  retry: 3
});

spider.on("data", (articles: string[]) => {
  for (const article of articles) {
    process.stdout.write(article + "\n");
  }
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  process.stdout.write("finish...\n");
});

spider.start();
