<script setup lang="ts">
import { computed } from "nativescript-vue";
import type { SavedWorkspace } from "../domain/workspaces";
import { layouts } from "../domain/workspace";
import MaterialIcon from "./MaterialIcon.vue";
import IconButton from "./IconButton.vue";
const props = defineProps<{ item: SavedWorkspace; active: boolean; removable: boolean }>();
const layoutName = computed(
  () => layouts.find((layout) => layout.id === props.item.state.layout)?.name ?? "独享",
);
const emit = defineEmits<{ select: []; rename: []; remove: [] }>();
</script>
<template>
  <GridLayout
    rows="auto"
    columns="*,36,36"
    class="workspace-card p-3 mb-3"
    :borderColor="active ? '#3a3a40' : '#202024'"
  >
    <GridLayout
      rows="auto,auto"
      columns="32,*"
      accessibilityRole="button"
      :accessibilityLabel="`切换到${item.name}`"
      @tap="emit('select')"
    >
      <MaterialIcon :name="active ? 'check' : 'layout'" rowSpan="2" class="text-iris" />
      <Label col="1" :text="item.name" class="text-base font-bold" />
      <Label
        col="1"
        row="1"
        :text="`${item.state.rooms.length} 个房间 · ${layoutName}${active ? ' · 正在使用' : ''}`"
        class="text-xs text-mist mt-1"
      />
    </GridLayout>
    <IconButton
      col="1"
      name="edit"
      label="重命名工作台"
      class="quiet compact"
      @tap="emit('rename')"
    />
    <IconButton
      col="2"
      name="remove"
      label="删除工作台"
      :isEnabled="removable"
      class="quiet compact"
      @tap="emit('remove')"
    />
  </GridLayout>
</template>
