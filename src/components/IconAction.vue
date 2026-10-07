<script setup lang="ts">
import MaterialIcon from "./MaterialIcon.vue";
import type { IconName } from "../domain/icons";
defineProps<{ name: IconName; label: string }>();
const emit = defineEmits<{ tap: [] }>();
</script>
<template>
  <GridLayout
    rows="*"
    columns="24,auto"
    height="40"
    horizontalAlignment="center"
    class="px-2"
    accessibilityRole="button"
    :accessibilityLabel="label"
    @tap="emit('tap')"
  >
    <MaterialIcon :name="name" class="text-iris" />
    <Label col="1" :text="label" class="text-sm ml-2" verticalAlignment="center" />
  </GridLayout>
</template>
