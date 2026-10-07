<script setup lang="ts">
import type { Panel } from "../domain/panels";
import MaterialIcon from "./MaterialIcon.vue";
import { useChromeMotion } from "../composables/useChromeMotion";
const props = defineProps<{ visible: boolean; roomCount: number; layoutName: string }>();
const { loaded } = useChromeMotion(() => props.visible, 12);
const emit = defineEmits<{ open: [panel: Panel] }>();
</script>
<template>
  <GridLayout
    @loaded="loaded"
    columns="*,*,*,*,*"
    rows="auto"
    verticalAlignment="bottom"
    class="bg-night py-1 px-2"
    borderTopWidth="1"
    borderColor="#202024"
  >
    <StackLayout
      class="dock-item"
      accessibilityRole="button"
      accessibilityLabel="直播间列表"
      @tap="emit('open', 'rooms')"
    >
      <MaterialIcon name="rooms" horizontalAlignment="center" />
      <Label :text="`房间 ${roomCount}`" class="text-xs text-mist text-center mt-1" />
    </StackLayout>
    <StackLayout
      col="1"
      class="dock-item"
      accessibilityRole="button"
      accessibilityLabel="工作台"
      @tap="emit('open', 'workspaces')"
    >
      <MaterialIcon name="workspaces" horizontalAlignment="center" />
      <Label text="工作台" class="text-xs text-mist text-center mt-1" />
    </StackLayout>
    <StackLayout
      col="2"
      class="dock-item"
      accessibilityRole="button"
      :accessibilityLabel="`画面布局，当前${layoutName}`"
      @tap="emit('open', 'layout')"
    >
      <MaterialIcon name="layout" horizontalAlignment="center" />
      <Label text="布局" class="text-xs text-mist text-center mt-1" />
    </StackLayout>
    <StackLayout
      col="3"
      class="dock-item"
      accessibilityRole="button"
      accessibilityLabel="混音台"
      @tap="emit('open', 'mixer')"
    >
      <MaterialIcon name="mixer" horizontalAlignment="center" />
      <Label text="混音台" class="text-xs text-mist text-center mt-1" />
    </StackLayout>
    <StackLayout
      col="4"
      class="dock-item"
      accessibilityRole="button"
      accessibilityLabel="获取 Cookie"
      @tap="emit('open', 'cookie')"
    >
      <MaterialIcon name="cookie" horizontalAlignment="center" />
      <Label text="Cookie" class="text-xs text-mist text-center mt-1" />
    </StackLayout>
  </GridLayout>
</template>
