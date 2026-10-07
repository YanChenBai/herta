<script setup lang="ts">
import { ref } from "nativescript-vue";
import { Utils } from "@nativescript/core";
import { parseRoomId, type Room } from "../../domain/workspace";
import { liveApi } from "../../services/runtime";
import { BilibiliApiError } from "../../services/bilibili";
const props = defineProps<{ initialInput?: string; savedIds: number[] }>();
const emit = defineEmits<{ added: [room: Room]; back: []; cookie: [input: string] }>();
const input = ref(props.initialInput ?? "");
const busy = ref(false);
const error = ref("");
const restricted = ref(false);
async function add() {
  if (busy.value) return;
  Utils.dismissSoftInput();
  busy.value = true;
  error.value = "";
  restricted.value = false;
  try {
    const room = await liveApi.room(parseRoomId(input.value));
    if (props.savedIds.includes(room.id))
      throw new Error("这个直播间已经在你的列表中。不同长号和短号也会识别为同一个房间。");
    emit("added", room);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "添加失败，请稍后重试";
    restricted.value = cause instanceof BilibiliApiError && cause.code === -352;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <StackLayout>
    <Label
      text="输入长号、短号或直播间链接，收藏喜欢的直播。"
      textWrap="true"
      class="text-sm text-mist mb-5"
    />
    <TextField
      v-model="input"
      hint="例如 6，或 live.bilibili.com/6"
      returnKeyType="done"
      autocorrect="false"
      @returnPress="add"
    />
    <Button
      :text="busy ? '正在查找房间…' : '添加到我的列表'"
      :isEnabled="!busy"
      class="primary mt-4"
      @tap="add"
    />
    <Button text="返回直播间列表" class="quiet mt-2" @tap="emit('back')" />
    <StackLayout v-if="error" class="bg-raised rounded-xl p-4 mt-3">
      <Label :text="error" textWrap="true" class="text-sm text-ice" />
      <Button
        v-if="restricted"
        text="获取 Cookie 后重试"
        class="primary mt-3"
        @tap="emit('cookie', input)"
      />
    </StackLayout>
  </StackLayout>
</template>
