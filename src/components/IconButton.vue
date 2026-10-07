<script setup lang="ts">
import { icons, type IconName } from "../domain/icons";
defineProps<{ name: IconName; label: string }>();
const emit = defineEmits<{ tap: [] }>();
</script>
<template>
  <Button
    :text="icons[name]"
    :accessibilityLabel="label"
    class="icon material-icon"
    @tap="emit('tap')"
  />
</template>
