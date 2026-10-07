import { ref, shallowRef, type Ref } from "nativescript-vue";
import type { TouchGestureEventData, View } from "@nativescript/core";
import type { Room } from "../domain/workspace";

export function useRoomDrag(options: {
  count: () => number;
  selected: Ref<number>;
  drop: (room: Room, index: number) => void;
  wake: () => void;
}) {
  const root = shallowRef<View>();
  const tileViews = new Map<number, View>();
  const dragging = ref<Room | null>(null);
  const dragX = ref(0);
  const dragY = ref(0);
  let origin: { x: number; y: number; localX: number; localY: number } | undefined;
  let source: View | undefined;

  function touchRoom(room: Room, event: TouchGestureEventData) {
    if (event.action === "down") {
      source = event.object as View;
      const position = source.getLocationOnScreen();
      origin = {
        x: position.x + event.getX(),
        y: position.y + event.getY(),
        localX: event.getX(),
        localY: event.getY(),
      };
      // 手柄负责拖拽，列表其余区域仍可以滚动。
      if (__ANDROID__) source.android?.getParent()?.requestDisallowInterceptTouchEvent(true);
      return;
    }
    if (!origin) return;
    if (event.action === "cancel") {
      finish();
      return;
    }
    const deltaX = event.getX() - origin.localX;
    const deltaY = event.getY() - origin.localY;
    if (event.action === "move" && !dragging.value && Math.hypot(deltaX, deltaY) >= 8) {
      dragging.value = room;
      options.wake();
    }
    if (!dragging.value) {
      if (event.action === "up") finish();
      return;
    }
    const point = { x: origin.x + deltaX, y: origin.y + deltaY };
    const location = root.value?.getLocationOnScreen() ?? { x: 0, y: 0 };
    dragX.value = point.x - location.x - 80;
    dragY.value = point.y - location.y - 22;
    for (const [index, view] of tileViews) {
      if (index >= options.count()) continue;
      const position = view.getLocationOnScreen();
      const size = view.getActualSize();
      if (
        point.x < position.x ||
        point.x > position.x + size.width ||
        point.y < position.y ||
        point.y > position.y + size.height
      )
        continue;
      options.selected.value = index;
      if (event.action === "up") options.drop(room, index);
      break;
    }
    if (event.action === "up") finish();
  }
  function finish() {
    if (__ANDROID__) source?.android?.getParent()?.requestDisallowInterceptTouchEvent(false);
    dragging.value = null;
    origin = undefined;
    source = undefined;
    options.wake();
  }
  return { root, tileViews, dragging, dragX, dragY, touchRoom };
}
