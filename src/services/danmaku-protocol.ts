import { unzlibSync, strToU8, strFromU8 } from "fflate";

export function packet(operation: number, body = ""): Uint8Array {
  const content = strToU8(body);
  const bytes = new Uint8Array(16 + content.length);
  const header = new DataView(bytes.buffer);
  header.setUint32(0, bytes.length);
  header.setUint16(4, 16);
  header.setUint16(6, 1);
  header.setUint32(8, operation);
  header.setUint32(12, 1);
  bytes.set(content, 16);
  return bytes;
}
export interface DanmakuPacket {
  operation: number;
  data: unknown;
}
export function decodePackets(bytes: Uint8Array, depth = 0): DanmakuPacket[] {
  if (depth > 3 || bytes.length > 2_000_000) throw new Error("弹幕数据超出限制");
  const packets: DanmakuPacket[] = [];
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 0; offset + 16 <= bytes.length;) {
    const length = header.getUint32(offset);
    const headerLength = header.getUint16(offset + 4);
    if (headerLength < 16 || length < headerLength || offset + length > bytes.length)
      throw new Error("弹幕数据包不完整");
    const version = header.getUint16(offset + 6);
    const operation = header.getUint32(offset + 8);
    const body = bytes.subarray(offset + headerLength, offset + length);
    if (version === 2) packets.push(...decodePackets(unzlibSync(body), depth + 1));
    else if (version === 3) throw new Error("服务器返回了未协商的 Brotli 弹幕");
    else if (operation === 5 || operation === 8) {
      try {
        packets.push({ operation, data: JSON.parse(strFromU8(body)) });
      } catch {
        /* 忽略非 JSON 事件。 */
      }
    }
    offset += length;
  }
  return packets;
}
