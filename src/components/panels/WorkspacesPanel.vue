<script setup lang="ts">
import { ref } from "nativescript-vue";
import { confirm, prompt } from "@nativescript/core";
import type { SavedWorkspace } from "../../domain/workspaces";
import WorkspaceCard from "../WorkspaceCard.vue";
import IconButton from "../IconButton.vue";
defineProps<{ items: SavedWorkspace[]; activeId: string }>();
const emit = defineEmits<{
  select: [id: string];
  add: [name: string];
  rename: [id: string, name: string];
  remove: [id: string];
}>();
const name = ref("");
function add() {
  emit("add", name.value);
  name.value = "";
}
async function rename(item: SavedWorkspace) {
  const result = await prompt({
    title: "重命名工作台",
    defaultText: item.name,
    okButtonText: "保存",
    cancelButtonText: "取消",
  });
  if (result.result) emit("rename", item.id, result.text);
}
async function remove(item: SavedWorkspace) {
  if (
    await confirm({
      title: "删除工作台",
      message: `删除「${item.name}」和其中保存的房间配置？`,
      okButtonText: "删除",
      cancelButtonText: "取消",
    })
  )
    emit("remove", item.id);
}
</script>
<template>
  <StackLayout>
    <Label
      text="为不同观看场景保存房间、布局和音量。"
      textWrap="true"
      class="text-sm text-mist mb-4"
    />
    <WorkspaceCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :active="item.id === activeId"
      :removable="items.length > 1"
      @select="emit('select', item.id)"
      @rename="rename(item)"
      @remove="remove(item)"
    />
    <GridLayout rows="auto" columns="*,12,36" class="mt-3">
      <TextField
        v-model="name"
        hint="新工作台名称"
        maxLength="40"
        returnKeyType="done"
        @returnPress="add"
      />
      <IconButton
        col="2"
        name="add"
        label="新建工作台"
        class="primary"
        verticalAlignment="center"
        @tap="add"
      />
    </GridLayout>
  </StackLayout>
</template>
