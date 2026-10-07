import type { Room } from "../domain/workspace";
import { signWbi } from "./wbi";

export type JsonRequest = <T>(url: string, cookie: string) => Promise<T>;
export class RoomOfflineError extends Error {
  constructor() {
    super("这个直播间还没有开播");
    this.name = "RoomOfflineError";
  }
}
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
export class BilibiliApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(
      code === -352
        ? `B站暂时限制了这次请求（-352）。${message && message !== "-352" ? message + "。" : ""}可以获取 Cookie 后重试，或稍后再试。`
        : message || `B站请求失败 (${code})`,
    );
    this.name = "BilibiliApiError";
  }
}
interface PlayInfo {
  live_status: number;
  playurl_info?: {
    playurl: {
      stream: {
        protocol_name: string;
        format: {
          format_name: string;
          codec: {
            codec_name: string;
            base_url: string;
            url_info: { host: string; extra: string }[];
          }[];
        }[];
      }[];
    };
  };
}
export function createBilibili(request: JsonRequest, getCookie: () => string) {
  async function api<T>(path: string): Promise<T> {
    const response = await request<ApiResponse<T>>(
      `https://api.live.bilibili.com${path}`,
      getCookie(),
    );
    if (response.code !== 0) throw new BilibiliApiError(response.code, response.message);
    return response.data;
  }
  return {
    async room(id: number): Promise<Room> {
      const data = await api<{
        room_id: number;
        short_id?: number;
        uid: number;
        title: string;
        user_cover?: string;
        keyframe?: string;
        live_status: number;
      }>(`/room/v1/Room/get_info?room_id=${id}`);
      let anchor = `直播间 ${data.room_id}`;
      let avatar = "";
      // 主播昵称是补充信息，失败不阻止收藏已确认存在的房间。
      try {
        const users = await api<Record<string, { uname: string; face?: string }>>(
          `/room/v1/Room/get_status_info_by_uids?uids%5B%5D=${data.uid}`,
        );
        anchor = users[String(data.uid)]?.uname || anchor;
        avatar = users[String(data.uid)]?.face || "";
      } catch {
        /* 保留房间号作为显示名称。 */
      }
      return {
        id: data.room_id,
        shortId: data.short_id && data.short_id > 0 ? data.short_id : undefined,
        title: data.title,
        cover: data.user_cover || data.keyframe || "",
        live: data.live_status === 1,
        anchor,
        avatar,
      };
    },
    async stream(id: number): Promise<string> {
      const data = await api<PlayInfo>(
        `/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${id}&protocol=1&format=1&codec=0&qn=150&platform=web&ptype=8`,
      );
      if (data.live_status !== 1) throw new RoomOfflineError();
      for (const stream of data.playurl_info?.playurl.stream ?? []) {
        if (stream.protocol_name !== "http_hls") continue;
        for (const format of stream.format) {
          for (const codec of format.codec) {
            if (codec.codec_name !== "avc") continue;
            const source = codec.url_info[0];
            if (source) return source.host + codec.base_url + source.extra;
          }
        }
      }
      throw new Error("没有可播放的 HLS 视频流，请稍后重试");
    },
    async danmakuInfo(id: number) {
      const nav = await request<ApiResponse<{ wbi_img: { img_url: string; sub_url: string } }>>(
        "https://api.bilibili.com/x/web-interface/nav",
        getCookie(),
      );
      if (!nav.data?.wbi_img) throw new Error("无法获取弹幕认证信息");
      const query = signWbi({ id, type: 0 }, nav.data.wbi_img);
      return api<{ token: string; host_list: { host: string; wss_port: number }[] }>(
        `/xlive/web-room/v1/index/getDanmuInfo?${query}`,
      );
    },
  };
}
