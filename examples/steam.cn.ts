import { Crawler, Provider, Response } from "../src/index";

const domain = "https://steamcn.com";

interface Article {
  title: string;
  href: string;
}

class ScrapinghubProvider implements Provider {
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

const spider = new Crawler(ScrapinghubProvider, {
  timeout: 1000 * 5,
  retry: 3
});

spider.on("data", (articles: Article[]) => {
  for (const article of articles) {
    if (article.title.indexOf("领取") >= 0) {
      console.log(`${article.title} ---------- ${article.href}`);
    }
  }
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  process.stdout.write("finish...\n");
});

spider.start();
