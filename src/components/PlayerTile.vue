<script setup lang="ts">
import type { View } from "@nativescript/core";
import { useLivePlayer, type LivePlayerProps } from "../composables/useLivePlayer";
import DanmakuOverlay from "./player/DanmakuOverlay.vue";
import PlayerControls from "./player/PlayerControls.vue";
import PlayerStatus from "./player/PlayerStatus.vue";
import IconButton from "./IconButton.vue";

const props = defineProps<
  LivePlayerProps & { index: number; selected: boolean; controls: boolean }
>();
const emit = defineEmits<{
  select: [];
  empty: [];
  mute: [];
  danmaku: [];
  clear: [];
  view: [view: View];
}>();
const {
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
  retryDanmaku,
} = useLivePlayer(props);
</script>

<template>
  <GridLayout class="slot" @loaded="emit('view', $event.object as View)" @tap="emit('select')">
    <VideoPlayer
      v-if="stream"
      :key="stream"
      :headers="headers"
      :src="stream"
      :autoplay="false"
      :initialVolume="slot.muted ? 0 : slot.volume / 100"
      :controls="false"
      @loaded="videoLoaded"
      @playbackReady="playbackReady"
      @buffering="bufferingChanged"
      @error="playbackFailed()"
    />
    <GridLayout
      v-if="!room"
      rows="44,auto"
      width="88"
      verticalAlignment="center"
      horizontalAlignment="center"
    >
      <IconButton
        name="add"
        label="向这个区域添加直播间"
        class="quiet"
        color="#a78bfa"
        horizontalAlignment="center"
        verticalAlignment="center"
        @tap="emit('empty')"
      />
      <Label row="1" :text="`区域 0${index + 1}`" class="text-xs text-mist text-center mt-1" />
    </GridLayout>
    <PlayerStatus v-if="room && status" :message="status" :loading="loading" @refresh="refresh" />
    <DanmakuOverlay v-if="slot.danmaku" :messages="messages" />
    <PlayerControls
      v-if="room && controls && selected"
      :title="room.anchor || room.title"
      :avatar="room.avatar || room.cover"
      :slot="slot"
      :danmakuStatus="danmakuStatus"
      @clear="emit('clear')"
      @mute="emit('mute')"
      @danmaku="emit('danmaku')"
      @retryDanmaku="retryDanmaku"
      @refresh="refresh"
    />
  </GridLayout>
</template>
