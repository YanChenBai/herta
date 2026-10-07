import { createCipheriv, createHash } from "node:crypto";
import { expect, test, vi } from "vite-plus/test";
import { fetchCookie, parseConnection } from "../src/services/cookie-sync";

function encryptedCookie(secret = "password") {
  const iv = Buffer.alloc(12, 7);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  const body = Buffer.concat([cipher.update("SESSDATA=test; buvid3=test", "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${body.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}
test("解密现有同步服务格式，仅发送一次 GET 的 Bearer 认证", async () => {
  const transport = vi
    .fn()
    .mockResolvedValue({ status: 200, text: JSON.stringify({ value: encryptedCookie() }) });
  expect(await fetchCookie("https://name:token@example.com/prefix", "password", transport)).toBe(
    "SESSDATA=test; buvid3=test",
  );
  expect(transport).toHaveBeenCalledExactlyOnceWith(
    "https://example.com/prefix/api/name",
    "Bearer token",
  );
});
test("拒绝错误密码、空记录和服务端错误", async () => {
  await expect(
    fetchCookie("https://name:token@example.com", "wrong", async () => ({
      status: 200,
      text: encryptedCookie(),
    })),
  ).rejects.toThrow("解密失败");
  await expect(
    fetchCookie("https://name:token@example.com", "password", async () => ({
      status: 200,
      text: "null",
    })),
  ).rejects.toThrow("暂时没有");
  await expect(
    fetchCookie("https://name:token@example.com", "password", async () => ({
      status: 401,
      text: "",
    })),
  ).rejects.toThrow("401");
  expect(() => parseConnection("https://example.com")).toThrow();
});
