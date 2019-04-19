[![Build Status](https://travis-ci.com/axetroy/crawler.svg?branch=master)](https://travis-ci.com/axetroy/crawler)
[![npm version](https://badge.fury.io/js/%40axetroy%2Fcrawler.svg)](https://badge.fury.io/js/%40axetroy%2Fcrawler)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

### Nodejs 的爬虫框架

为了实现快速开发爬虫而写的框架。

> WARNING: 当前仍处于开发阶段，任何存在的特性都可能会更改或者移除

### 特性

- [x] 访问频率限制
- [ ] 暂停和恢复爬取
- [ ] 连接上一次记录续爬
- [x] 内置的 jQuery 选择器
- [x] 内置的资源下载工具
- [x] IP 代理设置
- [ ] 数据统计
- [x] 自定义 HTTP 方法、请求体
- [x] 错误重试

### Usage

```bash
npm install @axetroy/crawler
```

```typescript
import { Crawler, Provider, Response } from "@axetroy/crawler";

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

const spider = new Crawler(ScrapinghubProvider, {
  timeout: 1000 * 1,
  retry: 3
});

let articles: string[] = [];

spider.on("data", data => {
  articles = articles.concat(data);
  console.log(`Got '${data.length}' articles.`);
});

spider.on("error", (err, task) => {
  console.log(`request fail on ${task.url}: ${err.message}`);
});

spider.on("finish", () => {
  console.log(articles);
});

spider.start();
```

### API Reference

[API Reference](http://axetroy.github.io/crawler)

### Example

[here](https://github.com/axetroy/crawler/tree/master/src/example) is the examples.

### 捐赠我

如果你觉得这个项目能帮助到你，可以考虑 **支付宝扫码(或搜索 511118132)领红包** 支持我

甚至可以请我喝一杯 ☕️

| 微信                                                                                                     | 支付宝                                                                                                   | 支付宝红包                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| <img src="https://github.com/axetroy/blog/raw/master/public/donate/wechat.png" width="200" height="200"> | <img src="https://github.com/axetroy/blog/raw/master/public/donate/alipay.png" width="200" height="200"> | <img src="https://github.com/axetroy/blog/raw/master/public/donate/alipay-red.png" width="200" height="200"> |

## License

The [Anti 996 License](https://github.com/axetroy/vscode-npm-import-package-version/blob/master/LICENSE)