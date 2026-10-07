import { expect, test } from "vite-plus/test";
import {
  assignRoom,
  createWorkspace,
  parseRoomId,
  restoreWorkspace,
  soloSlot,
} from "../src/domain/workspace";

test("接受房间号和直播链接，拒绝其他网址和无效编号", () => {
  expect(parseRoomId("https://live.bilibili.com/123?from=search")).toBe(123);
  expect(parseRoomId(" 456 ")).toBe(456);
  for (const input of ["0", "-2", "123abc", "https://evil.com/123", "9007199254740992"])
    expect(() => parseRoomId(input)).toThrow();
});

test("同一房间不能同时放入多个区域，包括隐藏区域", () => {
  const workspace = createWorkspace();
  expect(assignRoom(workspace, 7734200, 3)).toBe(true);
  expect(assignRoom(workspace, 7734200, 0)).toBe(false);
  expect(workspace.slots[0].roomId).toBeNull();
  expect(assignRoom(workspace, 7734200, 3)).toBe(true);
  workspace.slots[3].roomId = null;
  expect(assignRoom(workspace, 7734200, 0)).toBe(true);
});

test("旧存档中重复播放同一房间的关联只保留第一处", () => {
  const room = { id: 1, title: "直播", anchor: "主播", cover: "", live: true };
  const workspace = restoreWorkspace(
    JSON.stringify({ rooms: [room], slots: [{ roomId: 1 }, { roomId: 1 }, { roomId: 1 }] }),
  );
  expect(workspace.slots.map((slot) => slot.roomId)).toEqual([1, ...Array(8).fill(null)]);
});
test("恢复时清理无效房间关联和越界音量", () => {
  const room = { id: 1, title: "直播", anchor: "主播", cover: "", live: true };
  const restored = restoreWorkspace(
    JSON.stringify({
      rooms: [room, room],
      layout: "invalid",
      slots: [
        { roomId: 2, volume: 150 },
        { roomId: 1, volume: -1 },
      ],
    }),
  );
  expect(restored.rooms).toHaveLength(1);
  expect(restored.layout).toBe("duo");
  expect(restored.slots[0]).toMatchObject({ roomId: null, volume: 100 });
  expect(restored.slots[1]).toMatchObject({ roomId: 1, volume: 0 });
  expect(restoreWorkspace("bad")).toEqual(createWorkspace());
});
test("独听只改变静音状态，保留所有滑杆的音量", () => {
  const workspace = createWorkspace();
  workspace.slots[0].volume = 31;
  soloSlot(workspace.slots, 1);
  expect(workspace.slots.map((slot) => slot.muted)).toEqual(
    Array.from({ length: 9 }, (_, index) => index !== 1),
  );
  expect(workspace.slots[0].volume).toBe(31);
});

test("旧四槽位工作台扩展为九槽位，九路分配和存档完整恢复", () => {
  const rooms = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    title: "直播",
    anchor: "主播",
    cover: "",
    live: true,
  }));
  const migrated = restoreWorkspace(
    JSON.stringify({
      rooms,
      layout: "quad",
      slots: [{ roomId: 1, volume: 23, muted: true }],
    }),
  );
  expect(migrated.slots).toHaveLength(9);
  expect(migrated.slots[0]).toMatchObject({ roomId: 1, volume: 23, muted: true });
  rooms.forEach((room, index) => expect(assignRoom(migrated, room.id, index)).toBe(true));
  expect(assignRoom(migrated, 9, 0)).toBe(false);
  expect(assignRoom(migrated, 10, 9)).toBe(false);
  migrated.layout = "nine";
  expect(restoreWorkspace(JSON.stringify(migrated))).toEqual(migrated);
});
