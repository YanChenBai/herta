<script setup lang="ts">
import { layouts, type LayoutId } from "../../domain/workspace";
import { computed } from "nativescript-vue";
import { viewingLayout } from "../../domain/view-layout";
import MaterialIcon from "../MaterialIcon.vue";
const props = defineProps<{ selected: LayoutId; landscape: boolean }>();
const choices = computed(() =>
  layouts.map((layout) => ({ ...layout, ...viewingLayout(layout, props.landscape) })),
);
const emit = defineEmits<{ select: [id: LayoutId] }>();
</script>

<template>
  <StackLayout>
    <Label
      text="切换布局时保留房间与音量，隐藏的区域暂停播放。"
      textWrap="true"
      class="text-sm text-mist mb-4"
    />
    <GridLayout
      v-for="item in choices"
      :key="item.id"
      rows="auto"
      columns="76,*,auto"
      class="bg-raised rounded-xl p-3 mb-3"
      @tap="emit('select', item.id)"
    >
      <GridLayout :rows="item.rows" :columns="item.columns" height="46" width="64">
        <Label
          v-for="(cell, index) in item.cells"
          :key="index"
          :row="cell[0]"
          :col="cell[1]"
          :rowSpan="cell[2]"
          :colSpan="cell[3]"
          class="bg-iris rounded-sm m-1"
        />
      </GridLayout>
      <StackLayout col="1" verticalAlignment="center">
        <Label :text="item.name" class="text-base font-bold" />
        <Label :text="item.description" class="text-xs text-mist mt-1" textWrap="true" />
      </StackLayout>
      <MaterialIcon
        col="2"
        :name="selected === item.id ? 'check' : 'layout'"
        :class="selected === item.id ? 'text-iris' : 'text-mist'"
        verticalAlignment="center"
      />
    </GridLayout>
  </StackLayout>
</template>
