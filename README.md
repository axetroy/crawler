[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

### crawler framework for nodejs

### Featrue

- [x] Access frequency limit
- [x] Breakpoint continued crawl
- [x] IP address proxy
- [ ] Headless mode

### Usage

```typescript
import { Crawler, Provider, Response } from "@axetroy/crawler";

class MyProvider implements Provider {
  // defined started url
  urls = ["https://example/cate/1?page=1"];
  // defined how to parse data
  async parse(respone: Response) {
    const $ = cheerio.load(response.data);
    return {
      url: response.config.url,
      items: $(".item_title a")
        .map((i, el) => {
          return {
            title: $(el).text(),
            href: $(el).attr("href")
          };
        })
        .get()
    };
  }
  // should crawler get data from next page?
  async next(response: Response) {
    const url = new URL(response.config.url);
    const $ = cheerio.load(response.data);
    // get current page
    const page = $(".page_current")
      .eq(0)
      .text()
      .trim();

    // get 20 pages data
    if (+page < 20) {
      url.searchParams.delete("page");
      url.searchParams.append("page", page + 1 + "");
      return url.toString(); // return url to go next page
    } else {
      return null;
    }
  }
}

const spider = new Crawler({
  provider: MyProvider
});

spider.on("data", data => {
  // here is the data you got.
  console.log(data);
});

// start
spider.start();
```

### example

here is the example [here](https://github.com/axetroy/crawler/tree/master/src/example)

### 捐赠我

如果你觉得这个项目能帮助到你，可以考虑 **支付宝扫码(或搜索 511118132)领红包** 支持我

甚至可以请我喝一杯 ☕️

| 微信                                                                                                     | 支付宝                                                                                                   | 支付宝红包                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| <img src="https://github.com/axetroy/blog/raw/master/public/donate/wechat.png" width="200" height="200"> | <img src="https://github.com/axetroy/blog/raw/master/public/donate/alipay.png" width="200" height="200"> | <img src="https://github.com/axetroy/blog/raw/master/public/donate/alipay-red.png" width="200" height="200"> |

## License

The [Anti 996 License](https://github.com/axetroy/vscode-npm-import-package-version/blob/master/LICENSE)