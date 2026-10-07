import { expect, test } from "vite-plus/test";
import { zlibSync } from "fflate";
import { packet, decodePackets } from "../src/services/danmaku-protocol";
import { parseDanmaku } from "../src/services/danmaku-message";
import { signWbi } from "../src/services/wbi";

test("解析命令后缀、正文和用户名，忽略礼物及无效结构", () => {
  expect(
    parseDanmaku({
      cmd: "DANMU_MSG:4:0:2:2:2:0",
      info: [[0, 0, 0, 0xffffff], "你好", [1, "黑塔"]],
    }),
  ).toEqual({ text: "你好", user: "黑塔", color: 0xffffff });
  expect(parseDanmaku({ cmd: "SEND_GIFT", info: [] })).toBeNull();
  expect(parseDanmaku({ cmd: "DANMU_MSG", info: [[], null] })).toBeNull();
});
test("解析多包及 zlib 消息，拒绝错误长度", () => {
  const body = { cmd: "DANMU_MSG", info: [[], "你好"] };
  const single = packet(5, JSON.stringify(body));
  expect(decodePackets(new Uint8Array([...single, ...single]))).toHaveLength(2);
  const compressed = zlibSync(single);
  const outer = new Uint8Array(16 + compressed.length);
  outer.set(packet(5).subarray(0, 16));
  outer.set(compressed, 16);
  const header = new DataView(outer.buffer);
  header.setUint32(0, outer.length);
  header.setUint16(6, 2);
  expect(decodePackets(outer)[0].data).toEqual(body);
  new DataView(single.buffer).setUint32(0, 0);
  expect(() => decodePackets(single)).toThrow("不完整");
});
test("WBI 签名与公开固定向量一致", () => {
  const images = {
    img_url: "https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png",
    sub_url: "https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png",
  };
  expect(signWbi({ foo: "114", bar: "514", zab: 1919810 }, images, 1702204169)).toBe(
    "bar=514&foo=114&wts=1702204169&zab=1919810&w_rid=8f6f2b5b3d485fe1886cec6a0be8c5d4",
  );
});
