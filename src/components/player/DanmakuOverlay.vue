<script setup lang="ts">
defineProps<{ messages: { id: number; text: string }[] }>();
</script>
<template>
  <StackLayout verticalAlignment="top" class="mt-12 px-3" :isUserInteractionEnabled="false">
    <Label
      v-for="message in messages"
      :key="message.id"
      :text="message.text"
      class="danmaku mb-2"
      maxLines="1"
    />
  </StackLayout>
</template>
