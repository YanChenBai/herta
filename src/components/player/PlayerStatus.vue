<script setup lang="ts">
import IconButton from "../IconButton.vue";
defineProps<{ message: string; loading: boolean }>();
const emit = defineEmits<{ refresh: [] }>();
</script>
<template>
  <StackLayout
    width="80%"
    maxWidth="280"
    verticalAlignment="center"
    horizontalAlignment="center"
    class="p-2"
  >
    <ActivityIndicator
      v-if="loading"
      busy="true"
      width="28"
      height="28"
      color="#a78bfa"
      horizontalAlignment="center"
      class="mb-2"
      accessibilityLabel="直播正在加载"
    />
    <Label
      :text="message"
      textWrap="true"
      fontSize="11"
      maxHeight="48"
      class="text-mist text-center player-caption"
    />
    <IconButton
      v-if="!loading"
      name="refresh"
      label="重试播放这个直播间"
      class="quiet compact mt-2"
      color="#a78bfa"
      horizontalAlignment="center"
      @tap="emit('refresh')"
    />
  </StackLayout>
</template>
