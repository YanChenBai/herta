<script setup lang="ts">
import { computed, shallowRef } from "nativescript-vue";
import { Screen, View, Enums } from "@nativescript/core";
import PanelHeader from "./PanelHeader.vue";
const props = defineProps<{
  title: string;
  landscape: boolean;
  dragging: boolean;
  drawer?: boolean;
  scrollContent?: boolean;
}>();
const maximum = computed(() => {
  // 旋转后重新读取可用屏幕空间，不给短表单固定高度。
  void props.landscape;
  return Math.max(180, Screen.mainScreen.heightDIPs - 120);
});
const emit = defineEmits<{ close: [] }>();
const sheet = shallowRef<View>();
const backdrop = shallowRef<View>();
function enterBackdrop(view: View) {
  backdrop.value = view;
  view.opacity = 0;
  void view.animate({ opacity: 1, duration: 220 }).catch(() => {});
}
function enter(view: View) {
  sheet.value = view;
  view.opacity = 0;
  view.translateX = props.drawer ? 32 : 0;
  view.translateY = props.drawer ? 0 : 20;
  void view
    .animate({
      opacity: 1,
      translate: { x: 0, y: 0 },
      duration: 220,
      curve: Enums.AnimationCurve.easeOut,
    })
    .catch(() => {});
}
async function leave() {
  await Promise.allSettled([
    sheet.value?.animate({
      opacity: 0,
      translate: { x: props.drawer ? 32 : 0, y: props.drawer ? 0 : 20 },
      duration: 160,
      curve: Enums.AnimationCurve.easeIn,
    }),
    backdrop.value?.animate({ opacity: 0, duration: 160 }),
  ]);
}
defineExpose({ leave });
</script>

<template>
  <GridLayout :opacity="dragging ? 0.35 : 1">
    <GridLayout
      @loaded="enterBackdrop($event.object as View)"
      :opacity="dragging ? 0 : 1"
      @tap="emit('close')"
    >
      <Label backgroundColor="#000000" opacity="0.55" isUserInteractionEnabled="false" />
    </GridLayout>
    <GridLayout :class="drawer ? '' : 'p-3'">
      <GridLayout
        v-if="drawer"
        rows="auto,*"
        :width="Math.min(Screen.mainScreen.widthDIPs * 0.88, 360)"
        height="100%"
        horizontalAlignment="right"
        class="drawer p-4"
        @loaded="enter($event.object as View)"
      >
        <PanelHeader :title="title" @close="emit('close')" />
        <GridLayout row="1"><slot /></GridLayout>
      </GridLayout>
      <StackLayout
        v-else
        @loaded="enter($event.object as View)"
        class="sheet p-4"
        :width="landscape ? 360 : '100%'"
        :maxWidth="landscape ? 360 : 520"
        :maxHeight="maximum + 80"
        horizontalAlignment="center"
        verticalAlignment="center"
      >
        <PanelHeader :title="title" @close="emit('close')" />
        <ScrollView
          v-if="scrollContent !== false"
          verticalAlignment="top"
          :maxHeight="maximum - 44"
        >
          <StackLayout><slot /></StackLayout>
        </ScrollView>
        <StackLayout v-else><slot /></StackLayout>
      </StackLayout>
    </GridLayout>
  </GridLayout>
</template>
