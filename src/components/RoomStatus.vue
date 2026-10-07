<script setup lang="ts">
defineProps<{ live: boolean; roomId: number; shortId?: number }>();
</script>
<template>
  <GridLayout rows="auto" columns="12,*">
    <Label
      text="●"
      :color="live ? '#65c98a' : '#77777e'"
      class="text-xs"
      verticalAlignment="center"
    />
    <Label
      col="1"
      :text="`${live ? '直播中' : '未开播'} · ${shortId ? `短号 ${shortId}` : roomId}`"
      class="text-xs text-mist"
    />
  </GridLayout>
</template>
