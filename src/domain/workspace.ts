import { layouts, maxPlayerSlots, type LayoutId } from "./layouts";
export { layouts, type LayoutId } from "./layouts";

export interface Room {
  id: number;
  shortId?: number;
  title: string;
  anchor: string;
  cover: string;
  avatar?: string;
  live: boolean;
}
export interface PlayerSlot {
  roomId: number | null;
  volume: number;
  muted: boolean;
  danmaku: boolean;
}

export interface Workspace {
  rooms: Room[];
  slots: PlayerSlot[];
  layout: LayoutId;
}

export function createWorkspace(): Workspace {
  return {
    rooms: [],
    layout: "duo",
    slots: Array.from({ length: maxPlayerSlots }, () => ({
      roomId: null,
      volume: 70,
      muted: false,
      danmaku: true,
    })),
  };
}
export function parseRoomId(input: string): number {
  const trimmed = input.trim();
  const match = trimmed.match(/^(?:https?:\/\/)?live\.bilibili\.com\/(\d+)(?:[/?#].*)?$/);
  const id = Number(match ? match[1] : /^\d+$/.test(trimmed) ? trimmed : NaN);
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new Error("请输入直播间号或 live.bilibili.com 的直播间链接");
  return id;
}
export function restoreWorkspace(raw: string): Workspace {
  const fallback = createWorkspace();
  try {
    const value = JSON.parse(raw) as Partial<Workspace>;
    const rooms = Array.isArray(value.rooms)
      ? value.rooms.filter(
          (room) =>
            Number.isSafeInteger(room?.id) &&
            room.id > 0 &&
            typeof room.title === "string" &&
            typeof room.anchor === "string" &&
            typeof room.cover === "string",
        )
      : [];
    const ids = new Set(rooms.map((room) => room.id));
    const assigned = new Set<number>();
    return {
      rooms: rooms.filter(
        (room, index) => rooms.findIndex((item) => item.id === room.id) === index,
      ),
      layout: layouts.some((layout) => layout.id === value.layout)
        ? value.layout!
        : fallback.layout,
      slots: fallback.slots.map((slot, index) => {
        const saved = value.slots?.[index];
        const roomId =
          saved?.roomId && ids.has(saved.roomId) && !assigned.has(saved.roomId)
            ? saved.roomId
            : null;
        if (roomId) assigned.add(roomId);
        return {
          ...slot,
          roomId,
          volume:
            typeof saved?.volume === "number" && Number.isFinite(saved.volume)
              ? Math.max(0, Math.min(100, saved.volume))
              : 70,
          muted: saved?.muted === true,
          danmaku: saved?.danmaku !== false,
        };
      }),
    };
  } catch {
    return fallback;
  }
}
export function assignRoom(workspace: Workspace, roomId: number, index: number) {
  if (
    !workspace.slots[index] ||
    workspace.slots.some((slot, current) => current !== index && slot.roomId === roomId)
  )
    return false;
  workspace.slots[index].roomId = roomId;
  return true;
}
export function soloSlot(slots: PlayerSlot[], index: number) {
  slots.forEach((slot, current) => {
    slot.muted = current !== index;
  });
}
