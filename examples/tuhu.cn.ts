import { URL } from "url";
import * as path from "path";
import { Crawler, Provider, Response, Options } from "../src";

const domain = "https://www.tuhu.cn";

interface Article {
  title: string; // 文章标题
  href: string; // 文章的 URL
  intro: string; // 文章简介
  content: string; // 文章内容
  date: Date; // 日期
}

class MyProvider implements Provider {
  name = "途虎网";
  urls = [];
  async beforeStartUrl() {
    return ["https://www.tuhu.cn/Community/Discovery.aspx?tagId=1344"];
  }
  async parse($: Response) {
    if ($.status !== 200) {
      return [];
    }

    const url = $.config.url;

    const u = new URL(url);

    // 文章详情页
    if (u.pathname.startsWith("/Community/detail")) {
      console.log("详情页", url);
      const date = $(".date").eq(0);

      const article: Article = {
        title: $("h1")
          .eq(0)
          .text(),
        href: url,
        intro: $(".intro")
          .eq(0)
          .text(),
        content: $(".desc")
          .eq(0)
          .html(),
        // @ts-ignore
        date: new Date(date)
      };

      return [article];
    } else {
      console.log("下一页", url);
      const currentPageIndex = u.searchParams.get("pageIndex") || 1;

      const totalPageCount = +$("#hdTotalPageCount").val();

      if (currentPageIndex > totalPageCount) {
        return [];
      }

      if (currentPageIndex) {
        u.searchParams.delete("pageIndex");
        u.searchParams.append("pageIndex", +currentPageIndex + 1 + "");
      } else {
        u.searchParams.append("pageIndex", "1");
      }

      $.follow(u.href);

      const elements = $(".title a").get();

      for (const ele of elements) {
        const detailPageUrl = $(ele).prop("href");

        $.follow(domain + detailPageUrl);
      }

      return [];
    }
  }
}

const options: Options = {
  timeout: 1000 * 5,
  retry: 3
};

new Crawler(MyProvider, options)
  .on("data", (articles: Article[]) => {
    for (const article of articles) {
      const filename = path.join(__dirname, "dist", article.title);

      // fs.writeFile(filename, article.content);
      console.log(`${article.title}: ${article.href}`);
    }
  })
  .on("error", (err, task) => {
    console.log(`request fail on ${task.url}: ${err.message}`);
  })
  .start();
