import { expect, test, vi } from "vite-plus/test";
import type { Ref } from "nativescript-vue";
import type { TouchGestureEventData, View } from "@nativescript/core";
import { useRoomDrag } from "../src/composables/useRoomDrag";

vi.mock("nativescript-vue", () => ({
  ref: (value: unknown) => ({ value }),
  shallowRef: (value: unknown) => ({ value }),
}));
vi.stubGlobal("__ANDROID__", false);

function setup() {
  const drop = vi.fn();
  const room = { id: 6, anchor: "主播", title: "直播", cover: "", live: true };
  const selected = { value: 1 } as Ref<number>;
  const drag = useRoomDrag({ count: () => 2, selected, drop, wake: vi.fn() });
  const source = { getLocationOnScreen: () => ({ x: 20, y: 300 }) } as View;
  for (let index = 0; index < 2; index++)
    drag.tileViews.set(index, {
      getLocationOnScreen: () => ({ x: 0, y: index * 200 }),
      getActualSize: () => ({ width: 400, height: 200 }),
    } as View);
  function touch(action: string, x = 30, y = -140) {
    drag.touchRoom(room, {
      action,
      object: source,
      getX: () => x,
      getY: () => y,
    } as unknown as TouchGestureEventData);
  }
  touch("down", 10, 10);
  return { drag, selected, drop, room, touch };
}

test("拖拽经过区域只更新选择，松手才分配播放", () => {
  const { drag, selected, drop, room, touch } = setup();
  touch("move");
  expect(selected.value).toBe(0);
  expect(drag.dragging.value).toEqual(room);
  expect(drop).not.toHaveBeenCalled();
  touch("up");
  expect(drop).toHaveBeenCalledExactlyOnceWith(room, 0);
  expect(drag.dragging.value).toBeNull();
});

test("系统取消触摸不会当作松手播放", () => {
  const { drag, drop, touch } = setup();
  touch("move");
  touch("cancel");
  touch("up");
  expect(drop).not.toHaveBeenCalled();
  expect(drag.dragging.value).toBeNull();
});

test("点击手柄或在播放区域外松手不会播放", () => {
  const click = setup();
  click.touch("up", 10, 10);
  expect(click.drop).not.toHaveBeenCalled();
  const outside = setup();
  outside.touch("move", 500, -140);
  outside.touch("up", 500, -140);
  expect(outside.drop).not.toHaveBeenCalled();
});
