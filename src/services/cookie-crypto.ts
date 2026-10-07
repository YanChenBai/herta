import { gcm } from "@noble/ciphers/aes.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { toByteArray } from "base64-js";
import { strToU8, strFromU8 } from "fflate";

export function decryptCookie(payload: string, secret: string) {
  if (!secret) throw new Error("请输入解密密码");
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("不支持的 Cookie 加密格式");
  const decode = (value: string) => {
    if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error("Cookie 加密格式无效");
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    return toByteArray(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  };
  const [, nonce, ciphertext, tag] = parts;
  const iv = decode(nonce);
  const body = decode(ciphertext);
  const authTag = decode(tag);
  if (iv.length !== 12 || authTag.length !== 16) throw new Error("Cookie 校验失败");
  const encrypted = new Uint8Array(body.length + authTag.length);
  encrypted.set(body);
  encrypted.set(authTag, body.length);
  const key = sha256(strToU8(secret));
  try {
    return strFromU8(gcm(key, iv).decrypt(encrypted));
  } catch {
    throw new Error("解密失败，请检查密码");
  } finally {
    key.fill(0);
  }
}
