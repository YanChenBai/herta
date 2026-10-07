import { computed, reactive, ref, watch } from "nativescript-vue";
import { ApplicationSettings } from "@nativescript/core";
import { assignRoom, layouts, type LayoutId, type Room } from "../domain/workspace";
import { newWorkspace, restoreWorkspaces } from "../domain/workspaces";

export function useWorkspace() {
  const collection = reactive(
    restoreWorkspaces(
      ApplicationSettings.getString("herta.workspaces", ""),
      ApplicationSettings.getString("herta.workspace", ""),
    ),
  );
  const active = computed(() => collection.items.find((item) => item.id === collection.activeId)!);
  watch(
    () => active.value.name,
    (name) => {
      if (__ANDROID__) app.viyuni.herta.PlaybackService.setWorkspaceName(name);
    },
    { immediate: true, flush: "sync" },
  );
  const workspace = computed(() => active.value.state);
  const selected = ref(0);
  const layout = computed(() => layouts.find((item) => item.id === workspace.value.layout)!);
  const visibleSlots = computed(() => workspace.value.slots.slice(0, layout.value.cells.length));
  const playing = computed(() =>
    visibleSlots.value.flatMap((slot, index) => {
      const room = workspace.value.rooms.find((room) => room.id === slot.roomId);
      return room ? [{ slot, index, room }] : [];
    }),
  );

  function selectLayout(id: LayoutId) {
    workspace.value.layout = id;
    selected.value = Math.min(selected.value, layout.value.cells.length - 1);
  }
  function assign(room: Room, index = selected.value) {
    if (!assignRoom(workspace.value, room.id, index)) return false;
    selected.value = index;
    return true;
  }
  function saveRoom(room: Room) {
    const index = workspace.value.rooms.findIndex((item) => item.id === room.id);
    if (index >= 0) workspace.value.rooms[index] = room;
    else workspace.value.rooms.push(room);
  }
  function removeRoom(room: Room) {
    workspace.value.rooms = workspace.value.rooms.filter((item) => item.id !== room.id);
    workspace.value.slots.forEach((slot) => {
      if (slot.roomId === room.id) slot.roomId = null;
    });
  }
  watch(
    collection,
    () => ApplicationSettings.setString("herta.workspaces", JSON.stringify(collection)),
    { deep: true, immediate: true },
  );
  return {
    workspace,
    collection,
    active,
    switchWorkspace(id: string) {
      if (!collection.items.some((item) => item.id === id)) return;
      collection.activeId = id;
      selected.value = 0;
    },
    addWorkspace(name: string) {
      const item = newWorkspace(name);
      collection.items.push(item);
      collection.activeId = item.id;
      selected.value = 0;
    },
    renameWorkspace(id: string, name: string) {
      const item = collection.items.find((item) => item.id === id);
      if (item && name.trim()) item.name = name.trim().slice(0, 40);
    },
    deleteWorkspace(id: string) {
      if (collection.items.length === 1) return;
      collection.items = collection.items.filter((item) => item.id !== id);
      if (collection.activeId === id) collection.activeId = collection.items[0].id;
      selected.value = 0;
    },
    selected,
    layout,
    visibleSlots,
    playing,
    selectLayout,
    assign,
    saveRoom,
    removeRoom,
  };
}
