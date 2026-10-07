<script setup lang="ts">
import type { Panel } from "../domain/panels";
import ToolbarButton from "./ToolbarButton.vue";
import { useChromeMotion } from "../composables/useChromeMotion";
const props = defineProps<{
  visible: boolean;
}>();
const { loaded } = useChromeMotion(() => props.visible, -12);
const emit = defineEmits<{ open: [panel: Panel]; rotate: []; hide: []; refresh: [] }>();
</script>

<template>
  <GridLayout
    @loaded="loaded"
    rows="*"
    columns="32,*,32,8,32,8,32,8,32"
    height="44"
    verticalAlignment="top"
    class="bg-night px-3 py-1"
  >
    <Image
      col="0"
      src="~/assets/herta-icon.png"
      width="32"
      height="32"
      borderRadius="8"
      stretch="aspectFill"
      verticalAlignment="center"
      horizontalAlignment="left"
      accessibilityLabel="黑塔"
    />
    <ToolbarButton
      col="2"
      name="rotate"
      label="旋转屏幕"
      verticalAlignment="center"
      accessibilityLabel="旋转屏幕"
      @tap="emit('rotate')"
    />
    <ToolbarButton
      col="8"
      name="add"
      label="添加直播间"
      primary
      verticalAlignment="center"
      accessibilityLabel="添加直播间"
      @tap="emit('open', 'add')"
    />
    <ToolbarButton
      col="6"
      name="hide"
      label="隐藏上下控制栏"
      verticalAlignment="center"
      @tap="emit('hide')"
    />
    <ToolbarButton
      col="4"
      name="refresh"
      label="刷新全部播放区域"
      verticalAlignment="center"
      @tap="emit('refresh')"
    />
  </GridLayout>
</template>
