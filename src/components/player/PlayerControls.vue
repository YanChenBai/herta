<script setup lang="ts">
import type { PlayerSlot } from "../../domain/workspace";
import IconButton from "../IconButton.vue";
import RoomAvatar from "../RoomAvatar.vue";
defineProps<{ title: string; avatar?: string; slot: PlayerSlot; danmakuStatus: string }>();
const emit = defineEmits<{
  clear: [];
  mute: [];
  danmaku: [];
  retryDanmaku: [];
  refresh: [];
}>();
</script>

<template>
  <GridLayout rows="32,*,32" class="p-2">
    <GridLayout rows="auto" columns="32,*,12,32" row="0">
      <RoomAvatar :src="avatar" :size="24" verticalAlignment="center" />
      <Label
        col="1"
        :text="title"
        class="player-caption"
        fontSize="11"
        verticalAlignment="center"
      />
      <Label
        v-if="slot.danmaku"
        col="2"
        text="●"
        fontSize="7"
        :color="danmakuStatus.includes('已连接') ? '#65c98a' : '#9991b0'"
        :accessibilityLabel="danmakuStatus"
        verticalAlignment="center"
        @tap="emit('retryDanmaku')"
      />
      <IconButton
        col="3"
        name="close"
        label="移除播放区域的直播间"
        class="quiet compact player-icon"
        accessibilityLabel="移除播放区域的直播间"
        @tap="emit('clear')"
      />
    </GridLayout>
    <GridLayout row="2" rows="auto" columns="32,*,32,8,32">
      <IconButton
        :name="slot.muted ? 'mute' : 'volume'"
        :label="slot.muted ? '恢复声音' : '静音'"
        class="quiet compact player-icon"
        @tap="emit('mute')"
      />
      <IconButton
        col="2"
        name="danmaku"
        :label="slot.danmaku ? '关闭弹幕' : '开启弹幕'"
        class="quiet compact player-icon"
        :color="slot.danmaku ? '#a78bfa' : '#9991b0'"
        @tap="emit('danmaku')"
      />
      <IconButton
        col="4"
        name="refresh"
        label="刷新这个播放区域"
        class="quiet compact player-icon"
        @tap="emit('refresh')"
      />
    </GridLayout>
  </GridLayout>
</template>
