<script setup lang="ts">
import IconButton from "./IconButton.vue";
defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();
</script>
<template>
  <GridLayout columns="*,36" height="36" class="mb-3">
    <Label :text="title" class="text-lg font-bold text-frost" verticalAlignment="center" />
    <IconButton col="1" name="close" label="关闭面板" class="quiet compact" @tap="emit('close')" />
  </GridLayout>
</template>
