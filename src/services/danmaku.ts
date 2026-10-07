import { WebSocket } from "@valor/nativescript-websockets/websocket";
import { decodePackets, packet } from "./danmaku-protocol";
import { parseDanmaku } from "./danmaku-message";

export function connectDanmaku(options: {
  roomId: number;
  token: string;
  host: string;
  port: number;
  cookie: string;
  onMessage: (text: string) => void;
  onStatus: (text: string) => void;
}) {
  const socket = new WebSocket(`wss://${options.host}:${options.port}/sub`, [], {
    headers: { Origin: "https://live.bilibili.com", Cookie: options.cookie },
    nativescript: { handleThreading: true },
  });
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stopHeartbeat = () => {
    if (heartbeat) clearInterval(heartbeat);
  };
  socket.binaryType = "arraybuffer";
  socket.onopen = () => {
    const uid = Number(options.cookie.match(/(?:^|;\s*)DedeUserID=(\d+)/)?.[1] ?? 0);
    const buvid = options.cookie.match(/(?:^|;\s*)buvid3=([^;]+)/)?.[1] ?? "";
    socket.send(
      packet(
        7,
        JSON.stringify({
          uid,
          roomid: options.roomId,
          protover: 2,
          platform: "web",
          type: 2,
          key: options.token,
          buvid,
        }),
      ),
    );
    socket.send(packet(2));
    heartbeat = setInterval(() => {
      if (socket.readyState === socket.OPEN) socket.send(packet(2));
    }, 30000);
  };
  socket.onmessage = (event: { data: ArrayBuffer }) => {
    try {
      for (const item of decodePackets(new Uint8Array(event.data))) {
        const data = item.data as { cmd?: string; info?: unknown[]; code?: number };
        if (item.operation === 8) {
          options.onStatus(data.code === 0 ? "弹幕已连接" : "弹幕认证失败");
          if (data.code !== 0) socket.close();
        }
        const message = parseDanmaku(item.data);
        if (message) options.onMessage(message.text);
      }
    } catch {
      options.onStatus("弹幕解析失败");
    }
  };
  socket.onerror = () => {
    stopHeartbeat();
    options.onStatus("弹幕连接失败，点击重试");
  };
  socket.onclose = () => {
    stopHeartbeat();
    options.onStatus("弹幕已断开");
  };
  return () => {
    stopHeartbeat();
    socket.onclose = undefined;
    socket.onmessage = undefined;
    socket.onopen = undefined;
    socket.onerror = undefined;
    socket.close();
  };
}
