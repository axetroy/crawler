import { Application, Provider, Response, Options } from "../src";

class MyProvider implements Provider {
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

const config: Options = {
  timeout: 1000 * 5,
  retry: 3
};

new Application(new MyProvider(), config)
  .on("data", d => {
    console.log("data", d);
  })
  .start();
