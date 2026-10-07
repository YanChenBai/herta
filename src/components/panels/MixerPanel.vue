<script setup lang="ts">
import { computed } from "nativescript-vue";
import { Screen } from "@nativescript/core";
import type { PlayerSlot, Room } from "../../domain/workspace";
import VolumeChannel from "../VolumeChannel.vue";
import IconAction from "../IconAction.vue";
const props = defineProps<{
  channels: { slot: PlayerSlot; room: Room; index: number }[];
  landscape: boolean;
}>();
const listHeight = computed(() => {
  void props.landscape;
  return Math.max(80, Math.min(300, Screen.mainScreen.heightDIPs - 240));
});
function isSolo(index: number) {
  return (
    props.channels.length > 1 &&
    props.channels.every((item) => (item.index === index ? !item.slot.muted : item.slot.muted))
  );
}
const emit = defineEmits<{
  volume: [index: number, value: number];
  mute: [index: number];
  solo: [index: number];
  muteAll: [muted: boolean];
}>();
</script>

<template>
  <StackLayout>
    <Label
      :text="
        channels.length ? `${channels.length} 个房间 · 独立调整音量` : '独立调整每个房间的声音'
      "
      class="text-xs text-mist mb-3"
    />
    <Label
      v-if="!channels.length"
      text="播放一个直播间后，就可以在这里调整声音。"
      textWrap="true"
      class="text-mist py-6"
    />
    <ScrollView v-else :height="listHeight">
      <StackLayout>
        <VolumeChannel
          v-for="item in channels"
          :key="item.index"
          :name="item.room.anchor"
          :avatar="item.room.avatar || item.room.cover"
          :index="item.index"
          :volume="item.slot.volume"
          :muted="item.slot.muted"
          :solo="isSolo(item.index)"
          @volume="emit('volume', item.index, $event)"
          @mute="emit('mute', item.index)"
          @solo="emit('solo', item.index)"
        />
      </StackLayout>
    </ScrollView>
    <GridLayout
      v-if="channels.length"
      rows="auto"
      columns="*,8,*"
      class="mt-3 pt-2"
      borderTopWidth="1"
      borderColor="#202024"
    >
      <IconAction name="mute" label="全部静音" @tap="emit('muteAll', true)" />
      <IconAction col="2" name="volume" label="全部恢复" @tap="emit('muteAll', false)" />
    </GridLayout>
  </StackLayout>
</template>
