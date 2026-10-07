import { describe, expect, it, vi } from "vite-plus/test";
import { resolveSharedRoom } from "../src/services/shared-room";

describe("shared live rooms", () => {
  it("extracts direct and mobile room links from B站 share text", async () => {
    const request = vi.fn();
    expect(
      await resolveSharedRoom(
        "主播正在直播 https://live.bilibili.com/6?share_source=copy。",
        request,
      ),
    ).toBe(6);
    expect(await resolveSharedRoom("来看看 https://live.bilibili.com/h5/7734200", request)).toBe(
      7734200,
    );
    expect(request).not.toHaveBeenCalled();
  });
  it("resolves short links and relative redirects before returning the room", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ status: 302, location: "/second" })
      .mockResolvedValueOnce({ status: 302, location: "https://live.bilibili.com/6?from=share" });
    expect(await resolveSharedRoom("【直播】 https://b23.tv/first", request)).toBe(6);
    expect(request.mock.calls).toEqual([["https://b23.tv/first"], ["https://b23.tv/second"]]);
  });
  it("rejects video links, invalid room numbers and foreign redirects", async () => {
    const request = vi.fn().mockResolvedValue({ status: 302, location: "https://example.com/6" });
    await expect(
      resolveSharedRoom("https://www.bilibili.com/video/BV123", request),
    ).rejects.toThrow("没有找到");
    await expect(resolveSharedRoom("https://live.bilibili.com/0", request)).rejects.toThrow("有效");
    await expect(resolveSharedRoom("https://b23.tv/test", request)).rejects.toThrow("不是 B站");
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("stops redirect loops, excess hops and non-redirect responses", async () => {
    await expect(
      resolveSharedRoom("https://b23.tv/a", async () => ({ status: 302, location: "/a" })),
    ).rejects.toThrow("循环");
    let next = 0;
    const request = vi.fn(async () => ({ status: 302, location: `/link${++next}` }));
    await expect(resolveSharedRoom("https://b23.tv/a", request)).rejects.toThrow("过多");
    expect(request).toHaveBeenCalledTimes(5);
    await expect(
      resolveSharedRoom("https://b23.tv/a", async () => ({ status: 200 })),
    ).rejects.toThrow("无法解析");
  });
});
