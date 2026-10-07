<script setup lang="ts">
import MaterialIcon from "./MaterialIcon.vue";
withDefaults(defineProps<{ src?: string; size?: number }>(), { size: 32 });
</script>
<template>
  <GridLayout :width="size" :height="size" class="bg-raised rounded-full">
    <Image
      v-if="src"
      :src="src"
      :width="size"
      :height="size"
      stretch="aspectFill"
      :borderRadius="size / 2"
    />
    <MaterialIcon v-else name="live" class="text-mist text-center" />
  </GridLayout>
</template>
