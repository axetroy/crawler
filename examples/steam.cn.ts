import { Crawler, Provider, Response, Options } from "../src";

const domain = "https://steamcn.com";

interface Article {
  title: string;
  href: string;
}

class MyProvider implements Provider {
  name = "steamcn";
  urls = [];
  async beforeStartUrl() {
    return new Array(5).fill(0).map((_, index) => {
      return domain + "/f319-" + index;
    });
  }
  async parse($: Response) {
    const $list = $("#moderate table>tbody a.xst");

    return $list
      .map((_, $ele) => {
        return {
          title: $($ele)
            .text()
            .trim(),
          href: domain + "/" + $($ele).attr("href")
        } as Article;
      })
      .get();
  }
}

const options: Options = {
  timeout: 1000 * 5,
  retry: 3
};

new Crawler(MyProvider, options)
  .on("data", (articles: Article[]) => {
    for (const article of articles) {
      if (article.title.indexOf("领取") >= 0) {
        console.log(`${article.title} ---------- ${article.href}`);
      }
    }
  })
  .on("error", (err, task) => {
    console.log(`request fail on ${task.url}: ${err.message}`);
  })
  .start();
