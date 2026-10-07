import { computed, onBeforeUnmount, ref, watch } from "nativescript-vue";
import { Application, isAndroid, type EventData } from "@nativescript/core";
import type { Video } from "nativescript-videoplayer";
import type { PlayerSlot, Room } from "../domain/workspace";
import { liveApi, getCookie } from "../services/runtime";
import { connectDanmaku } from "../services/danmaku";
import { RoomOfflineError } from "../services/bilibili";
import { PlaybackRetry } from "../player/playback-retry";

export interface LivePlayerProps {
  room?: Room;
  slot: PlayerSlot;
  refreshVersion?: number;
}
export function useLivePlayer(props: Readonly<LivePlayerProps>) {
  const stream = ref("");
  const status = ref("");
  const loading = ref(false);
  const danmakuStatus = ref("");
  const messages = ref<{ id: number; text: string }[]>([]);
  let player: Video | undefined;
  let playerReady = false;
  let danmakuGeneration = 0;
  let disconnect: (() => void) | undefined;
  let generation = 0;
  let messageId = 0;
  let disposed = false;
  let suspended = false;
  const retry = new PlaybackRetry(() => void load());
  let bufferTimer: ReturnType<typeof setTimeout> | undefined;
  function clearBufferTimer() {
    clearTimeout(bufferTimer);
    bufferTimer = undefined;
  }
  function watchBuffer() {
    if (bufferTimer || suspended) return;
    bufferTimer = setTimeout(() => {
      bufferTimer = undefined;
      playbackFailed("直播缓冲超时");
    }, 30000);
  }
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const headers = computed(
    () =>
      new Map([
        ["Referer", "https://live.bilibili.com/"],
        ["User-Agent", "Mozilla/5.0"],
        ["Cookie", getCookie()],
      ]),
  );
  const volume = () => {
    if (player && (playerReady || isAndroid))
      player.setVolume(props.slot.muted ? 0 : props.slot.volume / 100);
  };

  function stopDanmaku() {
    danmakuGeneration++;
    disconnect?.();
    disconnect = undefined;
    timers.forEach(clearTimeout);
    timers.clear();
    messages.value = [];
  }
  async function startDanmaku(id: number, version: number) {
    stopDanmaku();
    const attempt = danmakuGeneration;
    if (!props.slot.danmaku || suspended) return;
    danmakuStatus.value = "连接弹幕…";
    try {
      const info = await liveApi.danmakuInfo(id);
      if (
        version !== generation ||
        attempt !== danmakuGeneration ||
        disposed ||
        suspended ||
        !props.slot.danmaku
      )
        return;
      const host = info.host_list[0];
      if (!host) throw new Error("没有可用弹幕服务器");
      disconnect = connectDanmaku({
        roomId: id,
        token: info.token,
        host: host.host,
        port: host.wss_port,
        cookie: getCookie(),
        onStatus: (text) => {
          danmakuStatus.value = text;
        },
        onMessage: (text) => {
          const id = ++messageId;
          messages.value = [...messages.value.slice(-4), { id, text }];
          const timer = setTimeout(() => {
            messages.value = messages.value.filter((message) => message.id !== id);
            timers.delete(timer);
          }, 6500);
          timers.add(timer);
        },
      });
    } catch (error) {
      if (version === generation && attempt === danmakuGeneration)
        danmakuStatus.value = error instanceof Error ? error.message : "弹幕连接失败";
    }
  }
  async function load() {
    retry.cancel();
    clearBufferTimer();
    const version = ++generation;
    stopDanmaku();
    releaseVideo();
    stream.value = "";
    danmakuStatus.value = "";
    loading.value = !!props.room;
    if (!props.room) {
      status.value = "";
      return;
    }
    status.value = "正在连接直播…";
    try {
      const url = await liveApi.stream(props.room.id);
      if (version !== generation || disposed) return;
      stream.value = url;
      status.value = "正在缓冲画面…";
      watchBuffer();
      void startDanmaku(props.room.id, version);
    } catch (error) {
      if (version !== generation || disposed) return;
      const message = error instanceof Error ? error.message : "播放失败";
      if (error instanceof RoomOfflineError) {
        loading.value = false;
        status.value = message;
      } else playbackFailed(message);
    }
  }
  function videoLoaded(event: EventData) {
    if (player && player !== event.object) releaseVideo();
    player = event.object as Video;
  }
  function playbackReady(event: EventData) {
    if (disposed) return;
    player = event.object as Video;
    playerReady = true;
    loading.value = false;
    status.value = "";
    clearBufferTimer();
    retry.ready();
    volume();
    if (disposed || isAndroid) return;
    player.play();
  }
  function releaseVideo() {
    const previous = player;
    player = undefined;
    playerReady = false;
    previous?.destroy();
  }
  function bufferingChanged(event: EventData & { value?: boolean }) {
    if (disposed || !props.room) return;
    if (event.value) {
      loading.value = true;
      status.value = playerReady ? "直播正在缓冲…" : "正在缓冲画面…";
      retry.cancel();
      watchBuffer();
    } else if (playerReady) {
      loading.value = false;
      status.value = "";
      clearBufferTimer();
      retry.ready();
    }
  }
  function suspend() {
    suspended = true;
    retry.cancel();
    clearBufferTimer();
    stopDanmaku();
  }
  function resume() {
    suspended = false;
    if (loading.value && stream.value) watchBuffer();
    if (props.room && stream.value) void startDanmaku(props.room.id, generation);
    else if (props.room) void load();
  }
  function refresh() {
    retry.reset();
    void load();
  }
  function playbackFailed(message = "视频播放失败") {
    if (disposed) return;
    loading.value = false;
    clearBufferTimer();
    if (suspended || !props.room) {
      status.value = message;
      return;
    }
    const plan = retry.schedule();
    status.value = plan
      ? `${message}（${plan.delay / 1000} 秒后重试 ${plan.attempt}/3）`
      : `${message}（已停止自动重试，可手动刷新）`;
  }
  watch(() => props.room?.id, refresh, { immediate: true });
  watch(() => props.refreshVersion, refresh);
  watch(() => [props.slot.volume, props.slot.muted], volume);
  watch(
    () => props.slot.danmaku,
    (enabled) => {
      if (enabled && props.room && stream.value) void startDanmaku(props.room.id, generation);
      else stopDanmaku();
    },
  );
  Application.on(Application.suspendEvent, suspend);
  Application.on(Application.resumeEvent, resume);
  onBeforeUnmount(() => {
    disposed = true;
    generation++;
    retry.dispose();
    clearBufferTimer();
    stopDanmaku();
    releaseVideo();
    Application.off(Application.suspendEvent, suspend);
    Application.off(Application.resumeEvent, resume);
  });

  function retryDanmaku() {
    if (props.room) void startDanmaku(props.room.id, generation);
  }
  return {
    stream,
    status,
    loading,
    danmakuStatus,
    messages,
    headers,
    refresh,
    playbackFailed,
    videoLoaded,
    playbackReady,
    bufferingChanged,
    releaseVideo,
    retryDanmaku,
  };
}
