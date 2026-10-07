export interface DanmakuMessage {
  text: string;
  user: string;
  color: number;
}

// 参考 bevent-relay 的 DANMU_MSG：info[1] 为内容，info[2][1] 为用户名。
export function parseDanmaku(value: unknown): DanmakuMessage | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("cmd" in value) ||
    typeof value.cmd !== "string" ||
    value.cmd.split(":")[0] !== "DANMU_MSG"
  )
    return null;
  if (!("info" in value) || !Array.isArray(value.info)) return null;
  const [meta, text, user] = value.info;
  if (typeof text !== "string" || !text.trim()) return null;
  return {
    text: text.slice(0, 300),
    user: Array.isArray(user) && typeof user[1] === "string" ? user[1] : "",
    color: Array.isArray(meta) && typeof meta[3] === "number" ? meta[3] : 0xffffff,
  };
}
