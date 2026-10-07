import { expect, test } from "vite-plus/test";
import { createBilibili, type JsonRequest } from "../src/services/bilibili";

test("短号解析成真实房间号，并选择 AVC HLS 视频流", async () => {
  const responses = [
    {
      code: 0,
      data: {
        room_id: 600,
        short_id: 6,
        uid: 12345,
        title: "直播标题",
        user_cover: "",
        live_status: 1,
      },
    },
    { code: 0, data: { "12345": { uname: "主播" } } },
    {
      code: 0,
      data: {
        live_status: 1,
        playurl_info: {
          playurl: {
            stream: [
              {
                protocol_name: "http_hls",
                format: [
                  {
                    format_name: "ts",
                    codec: [
                      {
                        codec_name: "avc",
                        base_url: "/live.m3u8",
                        url_info: [{ host: "https://cdn.example.com", extra: "?token=example" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    },
  ];
  const urls: string[] = [];
  const request: JsonRequest = async <T>(url: string) => {
    urls.push(url);
    return responses.shift() as T;
  };
  const api = createBilibili(request, () => "SESSDATA=test");
  expect(await api.room(6)).toMatchObject({ id: 600, shortId: 6, anchor: "主播", live: true });
  expect(urls[0]).toContain("/room/v1/Room/get_info?room_id=6");
  expect(urls[1]).toContain("get_status_info_by_uids?uids%5B%5D=12345");
  expect(await api.stream(600)).toBe("https://cdn.example.com/live.m3u8?token=example");
});
test("主播补充信息受限时仍能添加存在的直播间", async () => {
  let calls = 0;
  const request: JsonRequest = async <T>() =>
    (++calls === 1
      ? { code: 0, data: { room_id: 600, short_id: 6, uid: 1, title: "直播", live_status: 0 } }
      : { code: -352, message: "-352" }) as T;
  expect(await createBilibili(request, () => "").room(6)).toMatchObject({
    id: 600,
    shortId: 6,
    anchor: "直播间 600",
    live: false,
  });
});
test("区分未开播与 B站风控响应", async () => {
  const offline: JsonRequest = async <T>() => ({ code: 0, data: { live_status: 0 } }) as T;
  await expect(createBilibili(offline, () => "").stream(6)).rejects.toThrow("没有开播");
  const denied: JsonRequest = async <T>() => ({ code: -352, message: "访问受限" }) as T;
  await expect(createBilibili(denied, () => "").room(6)).rejects.toThrow("访问受限");
});
