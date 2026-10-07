import { Http } from "@nativescript/core";
import { createBilibili } from "./bilibili";
import type { CookieTransport } from "./cookie-sync";
import type { ShareRequest } from "./shared-room";

export const shareRequest: ShareRequest = async (url) => {
  const response = await Http.request({
    url,
    method: "GET",
    dontFollowRedirects: true,
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const header = Object.entries(response.headers).find(([key]) => key.toLowerCase() === "location");
  const location = header?.[1];
  return {
    status: response.statusCode,
    location: Array.isArray(location) ? location[0] : location,
  };
};

export const syncTransport: CookieTransport = async (url, authorization) => {
  const response = await Http.request({
    url,
    method: "GET",
    headers: { Authorization: authorization },
    timeout: 15000,
  });
  return { status: response.statusCode, text: response.content?.toString() ?? "" };
};

// 登录信息只在内存中使用，不随房间列表写入普通偏好存储。
let cookie = "";
export const getCookie = () => cookie;
export const setCookie = (value: string) => {
  cookie = value;
};
export const liveApi = createBilibili(async <T>(url: string, cookieValue: string): Promise<T> => {
  const response = await Http.request({
    url,
    method: "GET",
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://live.bilibili.com/",
      Cookie: cookieValue,
    },
  });
  if (response.statusCode !== 200) throw new Error(`网络请求失败 (${response.statusCode})`);
  return response.content!.toJSON() as T;
}, getCookie);
