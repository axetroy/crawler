[![Build Status](https://travis-ci.com/axetroy/crawler.svg?branch=master)](https://travis-ci.com/axetroy/crawler)
[![DeepScan grade](https://deepscan.io/api/teams/5773/projects/7590/branches/79790/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5773&pid=7590&bid=79790)
[![npm version](https://badge.fury.io/js/%40axetroy%2Fcrawler.svg)](https://badge.fury.io/js/%40axetroy%2Fcrawler)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

### Nodejs 的爬虫框架

一个快速，简单，易用的 nodejs 爬虫框架.

> WARNING: 当前仍处于开发阶段，任何存在的特性都可能会更改或者移除

### 特性

- [x] 访问频率限制
- [x] 暂停和恢复爬取
- [x] 连接上一次记录续爬
- [x] 内置的 jQuery 选择器
- [x] 内置的资源下载工具
- [x] IP 代理设置
- [ ] 数据统计
- [x] 自定义 HTTP 方法、请求体
- [x] 错误重试

### 快速开始

```bash
npm install @axetroy/crawler
```

```typescript
import { Crawler, Provider, Response } from "@axetroy/crawler";

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
```

### API Reference

[API Reference](http://axetroy.github.io/crawler)

### Example

如何运行 demo ?

```bash
> npx ts-node examples/basic.ts
```

[这里](https://github.com/axetroy/crawler/tree/master/examples)有相关的例子

- [基本的爬虫](https://github.com/axetroy/crawler/tree/master/examples/basic.ts)
- [多个目标地址爬虫](https://github.com/axetroy/crawler/tree/master/examples/multiple-urls.ts)
- [爬取资源图片](https://github.com/axetroy/crawler/tree/master/examples/resource-download.ts)

## License

The [Anti 996 License](https://github.com/axetroy/vscode-npm-import-package-version/blob/master/LICENSE)
