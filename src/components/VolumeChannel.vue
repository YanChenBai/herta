<script setup lang="ts">
import type { Slider } from "@nativescript/core";
import RoomAvatar from "./RoomAvatar.vue";
import IconButton from "./IconButton.vue";
defineProps<{
  name: string;
  avatar?: string;
  index: number;
  volume: number;
  muted: boolean;
  solo: boolean;
}>();
const emit = defineEmits<{ volume: [value: number]; mute: []; solo: [] }>();
</script>

<template>
  <GridLayout rows="40,8,32" class="bg-raised rounded-xl p-3 mb-2">
    <GridLayout columns="32,8,*,8,32,4,32" rows="*">
      <RoomAvatar :src="avatar" verticalAlignment="center" />
      <StackLayout col="2" verticalAlignment="center">
        <Label :text="name" fontSize="13" class="font-bold" />
        <Label :text="`区域 0${index + 1}`" fontSize="10" class="text-mist mt-1" />
      </StackLayout>
      <IconButton
        col="4"
        :name="muted ? 'mute' : 'volume'"
        :label="muted ? `恢复${name}的声音` : `静音${name}`"
        class="quiet compact"
        :color="muted ? '#9991b0' : '#edeaf6'"
        verticalAlignment="center"
        @tap="emit('mute')"
      />
      <IconButton
        col="6"
        name="headphones"
        :label="`只听${name}`"
        class="quiet compact"
        :color="solo ? '#a78bfa' : '#9991b0'"
        verticalAlignment="center"
        @tap="emit('solo')"
      />
    </GridLayout>
    <GridLayout row="2" rows="*" columns="*,8,40">
      <Slider
        :value="volume"
        minValue="0"
        maxValue="100"
        :accessibilityLabel="`${name}的音量`"
        @valueChange="emit('volume', ($event.object as Slider).value)"
      />
      <Label
        col="2"
        :text="muted ? '静音' : `${Math.round(volume)}%`"
        fontSize="12"
        :color="muted ? '#9991b0' : '#a78bfa'"
        textAlignment="right"
        verticalAlignment="center"
      />
    </GridLayout>
  </GridLayout>
</template>
