import * as path from "path";
import { Stream } from "stream";
import { IncomingHttpHeaders } from "http";
import { performance } from "perf_hooks";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as download from "download";
import pRetry from "p-retry";
import pTimeout from "p-timeout";
import * as fs from "fs-extra";
import { Crawler } from "./Crawler";
import { Task } from "./Scheduler";
import { logger } from "./Logger";

export type JSONPrimitive = string | number | boolean | null;
export type JSONObject = { [key: string]: JSONValue };
export interface JSONArray extends Array<JSONValue> {}
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type Method =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

export type Body =
  | string
  | JSONValue
  | Buffer
  | ArrayBuffer
  | ArrayBufferView
  | Uint8Array
  | URLSearchParams
  | Stream
  | null;

export type Headers = IncomingHttpHeaders;

export interface UrlCustomer {
  url: string;
  method?: Method;
  body?: Body;
  headers?: Headers;
}

export type Url = string | UrlCustomer;

export interface Response extends AxiosResponse, CheerioSelector, CheerioAPI {
  /**
   * The crawler instance.
   */
  crawler: Crawler;
  /**
   * How many times(ms) it takes.
   */
  times: number;
  /**
   * Download the resource
   * @param url The resource url
   * @param filepath The filepath which is the resource downloaded
   * @param options
   */
  download(
    url: string,
    filepath: string,
    options?: download.DownloadOptions
  ): Promise<void>;
  /**
   * Download the resource in queue
   * @param url The resource url
   * @param filepath The filepath which is the resource downloaded
   * @param options
   */
  downloadInQueue(
    url: string,
    filepath: string,
    options?: download.DownloadOptions
  ): void;
  /**
   * Go to the next url
   * @param Url
   */
  follow(url: Url): void;
  /**
   * retry again. There may be duplicate data.
   */
  retry(): void;
}

export class Http {
  private source = axios.CancelToken.source();
  constructor(private crawler: Crawler) {}
  /**
   * Send request
   * @param url
   * @param method
   * @param body
   * @param httpHeaders
   */
  public async request(
    url: string,
    method: Method = "GET",
    body?: Body,
    httpHeaders?: Headers
  ): Promise<Response> {
    const defaultHeaders = { Reference: url };
    const { options, proxy, userAgent, headers, auth, provider } = this.crawler;
    const { retry, timeout } = options;

    // resolve all agent.
    const [_proxy, _userAgent, _headers, _auth] = await Promise.all([
      proxy ? await proxy.resolve(url, method, body) : undefined,
      userAgent ? await userAgent.resolve(url, method, body) : undefined,
      headers ? await headers.resolve(url, method, body) : {},
      auth ? await auth.resolve(url, method, body) : undefined
    ]);

    const config = {
      url,
      method,
      proxy: _proxy,
      timeout,
      data: body,
      auth: _auth,
      headers: {
        ...defaultHeaders,
        ...(provider.defaultHeaders || {}),
        ...(httpHeaders || {}),
        ..._headers,
        ...(_userAgent ? { "User-Agent": _userAgent } : {})
      },
      cancelToken: this.source.token
    };

    if (provider.beforeRequest) {
      await provider.beforeRequest(config);
    }

    const run = async () => {
      const t1 = performance.now();
      const res = await pTimeout(axios.request(config), config.timeout);
      const t2 = performance.now();

      const response = this.createResponse(res);
      response.times = t2 - t1;

      return response;
    };
    return pRetry(run, {
      retries: retry,
      onFailedAttempt: error => {
        logger.error(
          `Attempt [${config.method}]: '${config.url}' ${
            error.attemptNumber
          } failed. There are ${error.retriesLeft} retries left.`
        );
      }
    });
  }
  /**
   * Append download task to the pool
   * @param url
   * @param filepath
   * @param options
   */
  public download(
    url: string,
    filepath: string,
    options?: download.DownloadOptions
  ): void {
    // @ts-ignore
    const task = new Task("download", "GET", url, { filepath, options });
    this.crawler.scheduler.push(task);
  }
  /**
   * Download resource
   * @param url
   * @param filepath
   * @param options
   */
  public async downloadResource(
    url: string,
    filepath: string,
    options?: download.DownloadOptions
  ): Promise<void> {
    const { retry, timeout } = this.crawler.options;
    await fs.ensureDir(path.dirname(filepath));

    function run() {
      const p = new Promise((resolve, reject) => {
        // @ts-ignore
        const stream = download(url, undefined, options);

        stream.catch(err => {
          reject(err);
        });

        stream
          .pipe(fs.createWriteStream(filepath))
          .once("error", (err: Error) => {
            reject(err);
          })
          .once("finish", () => {
            resolve();
          });
      }) as Promise<void>;

      return pTimeout(p, timeout);
    }

    return pRetry(run, {
      retries: retry,
      onFailedAttempt: error => {
        logger.error(
          `Attempt [download]: '${url}' ${
            error.attemptNumber
          } failed. There are ${error.retriesLeft} retries left.`
        );
      }
    });
  }
  /**
   * Cancel all request
   */
  public cancel() {
    this.source.cancel("Operation canceled by the user.");
  }
  private createResponse(response: AxiosResponse): Response {
    /**
     * jQuery selector
     * @param selector selector string
     */
    let select: CheerioStatic;
    function selector(selector: string) {
      if (select) {
        return select(selector);
      }
      select = cheerio.load(response.data);
      return select(selector);
    }

    // @ts-ignore
    const $ = Object.assign(selector, response, cheerio) as Response;

    $.crawler = this.crawler;

    // download resource
    $.downloadInQueue = (
      url: string,
      filepath: string,
      options?: download.DownloadOptions
    ): void => {
      const _proxy = response.config.proxy;
      const proxy = _proxy ? _proxy.host + ":" + _proxy.port : undefined;
      const _options: download.DownloadOptions = {
        headers: response.config.headers,
        proxy,
        ...(options || {})
      };
      this.download(url, filepath, _options);
    };

    // download resource
    $.download = async (
      url: string,
      filepath: string,
      options?: download.DownloadOptions
    ): Promise<void> => {
      const _proxy = response.config.proxy;
      const proxy = _proxy ? _proxy.host + ":" + _proxy.port : undefined;
      const _options: download.DownloadOptions = {
        headers: response.config.headers,
        proxy,
        ...(options || {})
      };
      await this.downloadResource(url, filepath, _options);
    };

    // follow the url and crawl next url
    $.follow = (nextUrl: Url): void => {
      if (this.crawler.active && nextUrl) {
        // set default reference when follow the next page
        const headers = {
          Reference: response.config.url
        };
        const task =
          typeof nextUrl === "string"
            ? new Task("request", "GET", nextUrl, undefined, headers)
            : new Task("request", nextUrl.method, nextUrl.url, nextUrl.body, {
                ...headers,
                ...(nextUrl.headers || {})
              });
        this.crawler.scheduler.push(task);
      }
    };

    // retry this request
    $.retry = () => {
      const method = (response.config.method as Method) || "GET";
      const task = new Task(
        "request",
        method,
        response.config.url,
        response.config.data
      );
      this.crawler.scheduler.push(task);
    };

    return $;
  }
}
