<script setup lang="ts">
import { computed, ref } from "nativescript-vue";
import type { View } from "@nativescript/core";
import type { LayoutId, Room } from "./domain/workspace";
import { viewingLayout } from "./domain/view-layout";
import { configureSystemBars } from "./services/system-bars";
import { soloSlot } from "./domain/workspace";
import type { Panel } from "./domain/panels";
import { useWorkspace } from "./composables/useWorkspace";
import { useAutoHide } from "./composables/useAutoHide";
import { useRoomDrag } from "./composables/useRoomDrag";
import { useOrientation } from "./composables/useOrientation";
import WorkspaceGrid from "./components/WorkspaceGrid.vue";
import WorkspaceHeader from "./components/WorkspaceHeader.vue";
import WorkspaceDock from "./components/WorkspaceDock.vue";
import PanelShell from "./components/PanelShell.vue";
import DragPreview from "./components/DragPreview.vue";
import RoomsPanel from "./components/panels/RoomsPanel.vue";
import AddRoomPanel from "./components/panels/AddRoomPanel.vue";
import MixerPanel from "./components/panels/MixerPanel.vue";
import CookiePanel from "./components/panels/CookiePanel.vue";
import WorkspacesPanel from "./components/panels/WorkspacesPanel.vue";
import LayoutPanel from "./components/panels/LayoutPanel.vue";
import { useSharedRoom } from "./composables/useSharedRoom";

const {
  workspace,
  collection,
  active,
  switchWorkspace,
  addWorkspace,
  renameWorkspace,
  deleteWorkspace,
  selected,
  layout,
  visibleSlots,
  playing,
  selectLayout,
  assign,
  saveRoom,
  removeRoom,
} = useWorkspace();
const { landscape, rotate } = useOrientation();
const displayLayout = computed(() => viewingLayout(layout.value, landscape.value));
const panel = ref<Panel | null>(null);
const panelShell = ref<InstanceType<typeof PanelShell> | null>(null);
let panelRevision = 0;
const cookieVersion = ref(0);
const refreshVersion = ref(0);
const addInput = ref("");
const roomNotice = ref("");
let returnToAdd = false;
function requestCookie(input: string) {
  addInput.value = input;
  returnToAdd = true;
  open("cookie");
}
function cookieUpdated() {
  cookieVersion.value++;
  if (returnToAdd) {
    returnToAdd = false;
    open("add");
  }
}
const { root, tileViews, dragging, dragX, dragY, touchRoom } = useRoomDrag({
  count: () => visibleSlots.value.length,
  selected,
  drop: playRoom,
  wake: () => wake(),
});
const { controls, wake, toggle } = useAutoHide(() => !panel.value && !dragging.value);
const titles: Record<Panel, string> = {
  rooms: "我的直播间",
  add: "添加直播间",
  mixer: "混音台",
  cookie: "获取 Cookie",
  workspaces: "工作台",
  layout: "画面布局",
};
const panelTitle = computed(() => (panel.value ? titles[panel.value] : ""));
useSharedRoom({
  target: () => active.value,
  show: async (id, message) => {
    switchWorkspace(id);
    await open("rooms");
    roomNotice.value = message;
  },
});

async function open(next: Panel | null) {
  const revision = ++panelRevision;
  if (!next && panel.value) {
    await panelShell.value?.leave();
    if (revision !== panelRevision) return;
  }
  if (next !== "cookie") returnToAdd = false;
  roomNotice.value = "";
  panel.value = next;
  wake();
}
function selectSlot(index: number) {
  if (panel.value || dragging.value) return;
  selected.value = index;
  toggle();
}
function emptySlot(index: number) {
  selectSlot(index);
  open(workspace.value.rooms.length ? "rooms" : "add");
}
function playRoom(room: Room, index = selected.value) {
  if (!assign(room, index)) {
    const existing = workspace.value.slots.findIndex((slot) => slot.roomId === room.id);
    roomNotice.value = `已在区域 0${existing + 1} 播放，请先移除再放入其他区域。`;
    wake();
    return;
  }
  open(null);
}
function changeLayout(id: LayoutId) {
  selectLayout(id);
  open(null);
}
function addedRoom(room: Room) {
  addInput.value = "";
  saveRoom(room);
  open("rooms");
}
function updateRoom(room: Room) {
  if (workspace.value.rooms.some((item) => item.id === room.id)) saveRoom(room);
}
function setVolume(index: number, value: number) {
  workspace.value.slots[index].volume = value;
  wake();
}
function toggleMute(index: number) {
  workspace.value.slots[index].muted = !workspace.value.slots[index].muted;
  wake();
}
function muteAll(muted: boolean) {
  visibleSlots.value.forEach((slot) => {
    slot.muted = muted;
  });
  wake();
}
function toggleDanmaku(index: number) {
  workspace.value.slots[index].danmaku = !workspace.value.slots[index].danmaku;
  wake();
}
function clearSlot(index: number) {
  workspace.value.slots[index].roomId = null;
  wake();
}
</script>

<template>
  <Frame>
    <Page
      actionBarHidden="true"
      statusBarStyle="light"
      androidStatusBarBackground="#000000"
      androidOverflowEdge="top"
    >
      <GridLayout
        @loaded="
          root = $event.object as View;
          configureSystemBars();
        "
      >
        <GridLayout rows="auto,*,auto">
          <WorkspaceGrid
            row="1"
            :key="active.id"
            :layout="displayLayout"
            :slots="visibleSlots"
            :rooms="workspace.rooms"
            :selected="selected"
            :controls="controls && !panel"
            :cookieVersion="cookieVersion"
            :refreshVersion="refreshVersion"
            @select="selectSlot"
            @empty="emptySlot"
            @view="(index, view) => tileViews.set(index, view)"
            @mute="toggleMute"
            @danmaku="toggleDanmaku"
            @clear="clearSlot"
          />
          <WorkspaceHeader
            :visible="controls && !panel"
            @open="open"
            @hide="toggle"
            @refresh="
              refreshVersion++;
              wake();
            "
            @rotate="
              rotate();
              wake();
            "
          />
          <WorkspaceDock
            row="2"
            :visible="controls && !panel"
            :roomCount="workspace.rooms.length"
            :layoutName="layout.name"
            @open="open"
          />
        </GridLayout>
        <PanelShell
          v-if="panel"
          :key="panel"
          ref="panelShell"
          :title="panelTitle"
          :landscape="landscape"
          :dragging="!!dragging"
          :drawer="panel === 'rooms'"
          :scrollContent="panel !== 'mixer'"
          @close="open(null)"
        >
          <RoomsPanel
            v-if="panel === 'rooms'"
            :rooms="workspace.rooms"
            :selected="selected"
            :assignmentNotice="roomNotice"
            @assign="playRoom"
            @remove="removeRoom"
            @update="updateRoom"
            @add="open('add')"
            @drag="touchRoom"
          />
          <AddRoomPanel
            v-else-if="panel === 'add'"
            :initialInput="addInput"
            :savedIds="workspace.rooms.map((room) => room.id)"
            @added="addedRoom"
            @back="open('rooms')"
            @cookie="requestCookie"
          />
          <MixerPanel
            v-else-if="panel === 'mixer'"
            :channels="playing"
            :landscape="landscape"
            @volume="setVolume"
            @mute="toggleMute"
            @solo="soloSlot(visibleSlots, $event)"
            @muteAll="muteAll"
          />
          <CookiePanel v-else-if="panel === 'cookie'" @updated="cookieUpdated" />
          <WorkspacesPanel
            v-else-if="panel === 'workspaces'"
            :items="collection.items"
            :activeId="active.id"
            @select="switchWorkspace"
            @add="addWorkspace"
            @rename="renameWorkspace"
            @remove="deleteWorkspace"
          />
          <LayoutPanel
            v-else-if="panel === 'layout'"
            :selected="workspace.layout"
            :landscape="landscape"
            @select="changeLayout"
          />
        </PanelShell>
        <DragPreview v-if="dragging" :name="dragging.anchor" :x="dragX" :y="dragY" />
      </GridLayout>
    </Page>
  </Frame>
</template>
