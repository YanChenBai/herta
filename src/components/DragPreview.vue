<script setup lang="ts">
defineProps<{ name: string; x: number; y: number }>();
</script>
<template>
  <AbsoluteLayout :isUserInteractionEnabled="false">
    <Label
      :left="x"
      :top="y"
      :text="name"
      width="160"
      height="44"
      class="bg-iris text-night text-center rounded-xl font-bold"
    />
  </AbsoluteLayout>
</template>
