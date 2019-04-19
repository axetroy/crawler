import { Crawler, Provider, Response } from "../index";

class ScrapinghubProvider implements Provider {
  name = "scrapinghub";
  urls = ["https://blog.scrapinghub.com"];
  async parse($: Response) {
    const $nextPage = $("a.next-posts-link").eq(0);

    if ($nextPage) {
      $.follow($nextPage.prop("href"));
    }

    return {
      items: $(".post-header>h2")
        .map((i, el) => {
          return {
            title: $(el).text()
          };
        })
        .get()
    };
  }
}

const spider = new Crawler(new ScrapinghubProvider());

spider.on("data", data => {
  console.log(data);
});

spider.start();
