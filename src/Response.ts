import { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

export interface Response extends AxiosResponse, CheerioSelector {
  download(url: string, filepath: string): Promise<void>;
}

export function CreateResponse(response: AxiosResponse) {
  const _$ = cheerio.load(response.data);

  const $: Response = function(selector: string) {
    return _$(selector);
  };

  $.status = response.status;
  $.statusText = response.statusText;
  $.config = response.config;
  $.headers = response.headers;
  $.data = response.data;

  $.download = async (url: string, filepath: string) => {
    throw new Error("Not implement download resource.");
  };

  return $;
}
