import { afterEach, expect, test, vi } from "vite-plus/test";
import { effectScope, nextTick } from "@vue/runtime-core";
import type { EventData } from "@nativescript/core";
import { RoomOfflineError } from "../src/services/bilibili";
import { createWorkspace } from "../src/domain/workspace";
import { useLivePlayer } from "../src/composables/useLivePlayer";

const mocks = vi.hoisted(() => ({ stream: vi.fn(), cleanup: [] as (() => void)[] }));
vi.mock("nativescript-vue", async () => ({
  ...(await import("@vue/runtime-core")),
  onBeforeUnmount: (callback: () => void) => mocks.cleanup.push(callback),
}));
vi.mock("@nativescript/core", () => ({
  isAndroid: true,
  Application: { on: vi.fn(), off: vi.fn(), suspendEvent: "suspend", resumeEvent: "resume" },
}));
vi.mock("../src/services/runtime", () => ({
  getCookie: () => "",
  liveApi: { stream: mocks.stream },
}));
vi.mock("../src/services/danmaku", () => ({ connectDanmaku: vi.fn() }));

let scope = effectScope();
function player() {
  const slot = createWorkspace().slots[0];
  slot.danmaku = false;
  return scope.run(() =>
    useLivePlayer({
      slot,
      room: { id: 6, title: "直播", anchor: "主播", cover: "", live: true },
    }),
  )!;
}
afterEach(() => {
  mocks.cleanup.splice(0).forEach((cleanup) => cleanup());
  scope.stop();
  scope = effectScope();
  mocks.stream.mockReset();
  vi.useRealTimers();
});

test("取得播放地址后仍显示加载反馈，播放器就绪后才隐藏，重新缓冲再次显示", async () => {
  vi.useFakeTimers();
  mocks.stream.mockResolvedValue("https://cdn.example/live.m3u8");
  const live = player();
  expect(live.loading.value).toBe(true);
  expect(live.status.value).toContain("正在连接");
  await nextTick();
  expect(live.stream.value).toContain("m3u8");
  expect(live.loading.value).toBe(true);
  expect(live.status.value).toContain("缓冲");
  const object = { setVolume: vi.fn(), destroy: vi.fn() };
  const event = { eventName: "playbackReady", object } as unknown as EventData;
  live.playbackReady(event);
  expect(live.loading.value).toBe(false);
  expect(live.status.value).toBe("");
  live.bufferingChanged({ ...event, value: true });
  expect(live.loading.value).toBe(true);
  live.bufferingChanged({ ...event, value: false });
  expect(live.loading.value).toBe(false);
});

test("缓冲超时进入重试，释放播放器取消待执行的重试", async () => {
  vi.useFakeTimers();
  mocks.stream.mockResolvedValue("https://cdn.example/live.m3u8");
  const live = player();
  await nextTick();
  vi.advanceTimersByTime(30000);
  expect(live.loading.value).toBe(false);
  expect(live.status.value).toContain("缓冲超时");
  expect(live.status.value).toContain("1/3");
  mocks.cleanup.splice(0).forEach((cleanup) => cleanup());
  vi.advanceTimersByTime(3000);
  expect(mocks.stream).toHaveBeenCalledTimes(1);
});

test("未开播停止加载且不自动刷新，手动刷新可再次检查", async () => {
  vi.useFakeTimers();
  mocks.stream.mockRejectedValue(new RoomOfflineError());
  const live = player();
  await nextTick();
  expect(live.loading.value).toBe(false);
  expect(live.status.value).toContain("没有开播");
  vi.advanceTimersByTime(60000);
  expect(mocks.stream).toHaveBeenCalledTimes(1);
  live.refresh();
  await nextTick();
  expect(mocks.stream).toHaveBeenCalledTimes(2);
});
