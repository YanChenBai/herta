export interface ShareRedirect {
  status: number;
  location?: string;
}
export type ShareRequest = (url: string) => Promise<ShareRedirect>;

function trustedLink(url: string): { url: string; host: string; path: string } {
  const match = /^https?:\/\/(live\.bilibili\.com|b23\.tv)(\/[^\s]*)?$/i.exec(url);
  if (!match) throw new Error("分享链接不是 B站直播间或 b23.tv 短链接");
  const host = match[1].toLowerCase();
  const path = match[2] || "/";
  return { url: `https://${host}${path}`, host, path };
}

export function sharedLink(text: string): string {
  const links = text.match(/https?:\/\/[^\s<>"，。；！？）】]+/gi) ?? [];
  for (const link of links) {
    const trimmed = link.replace(/[),.;!]+$/, "");
    if (/^https?:\/\/(live\.bilibili\.com|b23\.tv)\//i.test(trimmed)) return trimmed;
  }
  throw new Error("分享内容里没有找到 B站直播间链接");
}

export async function resolveSharedRoom(text: string, request: ShareRequest): Promise<number> {
  let link = sharedLink(text);
  const visited = new Set<string>();
  for (let hop = 0; hop < 5; hop++) {
    const { url, host, path } = trustedLink(link);
    if (host === "live.bilibili.com") {
      const match = /^\/(?:h5\/)?(\d+)(?:[/?#]|$)/.exec(path);
      const id = Number(match?.[1]);
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error("分享链接没有有效的直播间号");
      return id;
    }
    if (visited.has(url)) throw new Error("B站短链接发生循环跳转");
    visited.add(url);
    const response = await request(url);
    if (response.status < 300 || response.status >= 400 || !response.location)
      throw new Error("无法解析 B站短链接，请分享完整直播间链接重试");
    const location = response.location.trim();
    link = location.startsWith("//")
      ? `https:${location}`
      : location.startsWith("/")
        ? `https://${host}${location}`
        : location;
  }
  throw new Error("B站短链接跳转次数过多");
}
