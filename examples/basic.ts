import { Crawler, Provider, Response, Options } from "../src";

class MyProvider implements Provider {
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

const config: Options = {
  timeout: 1000 * 5,
  retry: 3
};

new Crawler(MyProvider, config)
  .on("data", (articles: string[]) => {
    for (const article of articles) {
      process.stdout.write(article + "\n");
    }
  })
  .on("error", (err, task) => {
    console.log(`request fail on ${task.url}: ${err.message}`);
  })
  .start();
