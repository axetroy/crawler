import { Application, Provider, Response } from "../src/index";

class ScrapinghubProvider implements Provider {
  name = "scrapinghub";
  urls = ["https://blog.scrapinghub.com"];
  async parse($: Response) {
    const $nextPage = $("a.next-posts-link").eq(0);

    if ($nextPage && $nextPage.prop("href")) {
      $.follow($nextPage.prop("href"));
    }

    return $(".post-header>h2")
      .map((_, el) => $(el).text())
      .get();
  }
}

const spider = new Application(new ScrapinghubProvider(), {
  timeout: 1000 * 5,
  retry: 3
});

spider.on("data", d => {
  console.log("data", d);
});

spider.start();
