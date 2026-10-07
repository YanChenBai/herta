import { decryptCookie } from "./cookie-crypto";

export type CookieTransport = (
  url: string,
  authorization: string,
) => Promise<{ status: number; text: string }>;
export function parseConnection(input: string) {
  const match = input.match(/^(https?):\/\/([^:@/?#]+):([^@/?#]+)@([\w.\-[\]:]+)(\/[^?#]*)?$/);
  if (!match) throw new Error("连接地址格式应为 https://名称:令牌@服务器");
  const [, protocol, name, token, host, path = "/"] = match;
  const prefix = path.endsWith("/") ? path : `${path}/`;
  return {
    endpoint: `${protocol}://${host}${prefix}api/${encodeURIComponent(decodeURIComponent(name))}`,
    token: decodeURIComponent(token),
  };
}

// 只读取 Cookie，兼容 cookie-sync-client 的 api/:name 和 v1 AES-GCM 协议。
export async function fetchCookie(
  connection: string,
  password: string,
  transport: CookieTransport,
): Promise<string> {
  const { endpoint, token } = parseConnection(connection);

  const response = await transport(endpoint, `Bearer ${token}`);
  if (response.status < 200 || response.status >= 300)
    throw new Error(`Cookie 获取失败 (${response.status})`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    parsed = response.text;
  }
  const value =
    typeof parsed === "string"
      ? parsed
      : parsed && typeof parsed === "object" && "value" in parsed
        ? parsed.value
        : null;
  if (!value) throw new Error("服务器暂时没有 Cookie");
  if (typeof value !== "string") throw new Error("服务器返回了不支持的格式");
  return decryptCookie(value, password);
}
