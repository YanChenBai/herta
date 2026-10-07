<script setup lang="ts">
import type { View } from "@nativescript/core";
import type { PlayerSlot, Room } from "../domain/workspace";
import { separators, type ViewingLayout } from "../domain/view-layout";
import PlayerTile from "./PlayerTile.vue";
defineProps<{
  layout: ViewingLayout;
  slots: PlayerSlot[];
  rooms: Room[];
  selected: number;
  controls: boolean;
  cookieVersion: number;
  refreshVersion: number;
}>();
const emit = defineEmits<{
  select: [index: number];
  empty: [index: number];
  view: [index: number, view: View];
  mute: [index: number];
  danmaku: [index: number];
  clear: [index: number];
}>();
</script>

<template>
  <GridLayout :rows="layout.rows" :columns="layout.columns">
    <PlayerTile
      v-for="(slot, index) in slots"
      :key="`${index}:${cookieVersion}`"
      :style="separators(layout, index)"
      :row="layout.cells[index][0]"
      :col="layout.cells[index][1]"
      :rowSpan="layout.cells[index][2]"
      :colSpan="layout.cells[index][3]"
      :room="rooms.find((room) => room.id === slot.roomId)"
      :slot="slot"
      :index="index"
      :selected="selected === index"
      :controls="controls"
      :refreshVersion="refreshVersion"
      @select="emit('select', index)"
      @empty="emit('empty', index)"
      @view="emit('view', index, $event)"
      @mute="emit('mute', index)"
      @danmaku="emit('danmaku', index)"
      @clear="emit('clear', index)"
    />
  </GridLayout>
</template>
