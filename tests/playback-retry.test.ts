import { afterEach, expect, test, vi } from "vite-plus/test";
import { PlaybackRetry } from "../src/player/playback-retry";

afterEach(() => vi.useRealTimers());

test("连接或播放失败按退避时间重试，重复错误不增加任务且最多三次", () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const retry = new PlaybackRetry(callback);
  for (const [index, delay] of [3000, 6000, 12000].entries()) {
    expect(retry.schedule()).toEqual({ attempt: index + 1, delay });
    expect(retry.schedule()).toEqual({ attempt: index + 1, delay });
    vi.advanceTimersByTime(delay - 1);
    expect(callback).toHaveBeenCalledTimes(index);
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(index + 1);
  }
  expect(retry.schedule()).toBeUndefined();
  vi.advanceTimersByTime(60000);
  expect(callback).toHaveBeenCalledTimes(3);
});

test("短暂就绪不重置重试次数，稳定播放三十秒后恢复额度", () => {
  vi.useFakeTimers();
  const retry = new PlaybackRetry(vi.fn());
  retry.schedule();
  vi.advanceTimersByTime(3000);
  retry.ready();
  vi.advanceTimersByTime(29999);
  expect(retry.schedule()?.attempt).toBe(2);
  retry.ready();
  vi.advanceTimersByTime(30000);
  expect(retry.schedule()?.attempt).toBe(1);
  retry.dispose();
});

test("后台取消和手动刷新清除待执行任务，手动刷新重新计算次数", () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const retry = new PlaybackRetry(callback);
  retry.schedule();
  retry.cancel();
  vi.advanceTimersByTime(3000);
  expect(callback).not.toHaveBeenCalled();
  expect(retry.schedule()?.attempt).toBe(2);
  retry.reset();
  expect(retry.schedule()?.attempt).toBe(1);
  retry.dispose();
  vi.advanceTimersByTime(60000);
  expect(callback).not.toHaveBeenCalled();
  expect(retry.schedule()).toBeUndefined();
});
