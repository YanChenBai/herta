import { onMounted, onBeforeUnmount } from "nativescript-vue";
import type { SavedWorkspace } from "../domain/workspaces";
import { observeSharedText } from "../services/share-intent";
import { resolveSharedRoom } from "../services/shared-room";
import { liveApi, shareRequest } from "../services/runtime";

export function useSharedRoom(options: {
  target: () => SavedWorkspace;
  show: (id: string, message: string) => Promise<void>;
}) {
  let stop: (() => void) | undefined;
  let queue = Promise.resolve();
  onMounted(() => {
    stop = observeSharedText((text) => {
      const target = options.target();
      queue = queue.then(async () => {
        try {
          await options.show(target.id, "正在获取分享的直播间…");
          const id = await resolveSharedRoom(text, shareRequest);
          const room = await liveApi.room(id);
          const exists = target.state.rooms.some((item) => item.id === room.id);
          if (!exists) target.state.rooms.push(room);
          await options.show(
            target.id,
            exists ? "这个直播间已经在我的直播间中" : `已添加 ${room.anchor}`,
          );
        } catch (cause) {
          await options.show(
            target.id,
            cause instanceof Error ? cause.message : "分享的直播间添加失败，请稍后重试",
          );
        }
      });
    });
  });
  onBeforeUnmount(() => stop?.());
}
