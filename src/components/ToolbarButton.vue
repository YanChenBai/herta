<script setup lang="ts">
import { icons } from "../domain/icons";
defineProps<{
  name: "rotate" | "refresh" | "hide" | "add";
  label: string;
  primary?: boolean;
}>();
const android = __ANDROID__;
const emit = defineEmits<{ tap: [] }>();
</script>

<template>
  <GridLayout
    width="32"
    height="32"
    borderRadius="10"
    :backgroundColor="primary ? '#a78bfa' : 'transparent'"
    verticalAlignment="center"
    accessible="true"
    accessibilityRole="button"
    :accessibilityLabel="label"
    @tap="emit('tap')"
  >
    <Image
      v-if="android"
      :src="`res://ic_toolbar_${name}`"
      width="20"
      height="20"
      stretch="aspectFit"
      horizontalAlignment="center"
      verticalAlignment="center"
      isUserInteractionEnabled="false"
    />
    <Label
      v-else
      :text="icons[name]"
      class="material-icon"
      fontSize="20"
      :color="primary ? '#171223' : '#9991b0'"
      horizontalAlignment="center"
      verticalAlignment="center"
      isUserInteractionEnabled="false"
    />
  </GridLayout>
</template>
