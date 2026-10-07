<script setup lang="ts">
import { computed, ref } from "nativescript-vue";
import type { TouchGestureEventData } from "@nativescript/core";
import type { Room } from "../../domain/workspace";
import { liveApi } from "../../services/runtime";
import MaterialIcon from "../MaterialIcon.vue";
import IconButton from "../IconButton.vue";
import RoomStatus from "../RoomStatus.vue";
const props = defineProps<{ rooms: Room[]; selected: number; assignmentNotice: string }>();
const emit = defineEmits<{
  assign: [room: Room];
  remove: [room: Room];
  update: [room: Room];
  add: [];
  drag: [room: Room, event: TouchGestureEventData];
}>();
const search = ref("");
const busy = ref(false);
const notice = ref("");
const filtered = computed(() =>
  props.rooms.filter((room) =>
    `${room.anchor} ${room.title} ${room.id} ${room.shortId ?? ""}`
      .toLowerCase()
      .includes(search.value.toLowerCase()),
  ),
);
async function refresh() {
  if (busy.value) return;
  busy.value = true;
  notice.value = "";
  const results = await Promise.allSettled(props.rooms.map((room) => liveApi.room(room.id)));
  results.forEach((result) => {
    if (result.status === "fulfilled") emit("update", result.value);
    else notice.value = "部分直播间刷新失败";
  });
  busy.value = false;
}
</script>

<template>
  <GridLayout rows="auto,auto,*,auto,auto" height="100%">
    <TextField v-model="search" hint="搜索主播、标题、房间号或短号" />
    <Label
      row="1"
      :text="`拖动左侧手柄到画面，或点选播放到区域 0${selected + 1}`"
      class="text-xs text-mist py-3"
      textWrap="true"
    />
    <ListView
      row="2"
      :items="filtered"
      rowHeight="100"
      separatorColor="transparent"
      backgroundColor="#111014"
    >
      <template #default="{ item }">
        <StackLayout class="pb-3">
          <GridLayout columns="32,*,36" rows="auto,auto" class="bg-raised rounded-xl p-3">
            <GridLayout
              rowSpan="2"
              height="64"
              @touch="emit('drag', item, $event)"
              accessibilityLabel="拖动直播间到播放区域"
            >
              <MaterialIcon name="drag" class="text-mist" />
            </GridLayout>
            <GridLayout
              col="1"
              rowSpan="2"
              rows="auto,auto"
              columns="48,*"
              verticalAlignment="center"
              @tap="emit('assign', item)"
            >
              <Image
                v-if="item.cover"
                :src="item.cover"
                width="40"
                height="40"
                stretch="aspectFill"
                rowSpan="2"
                class="rounded-lg"
              />
              <MaterialIcon v-else name="live" rowSpan="2" class="text-iris" />
              <Label col="1" :text="item.anchor" class="text-sm font-bold" />
              <RoomStatus
                col="1"
                row="1"
                :live="item.live"
                :roomId="item.id"
                :shortId="item.shortId"
                class="mt-2"
              />
            </GridLayout>
            <IconButton
              col="2"
              rowSpan="2"
              name="remove"
              label="移除直播间"
              class="quiet compact"
              @tap="emit('remove', item)"
            />
          </GridLayout>
        </StackLayout>
      </template>
    </ListView>
    <Label
      v-if="!filtered.length"
      row="2"
      text="还没有房间，添加你喜欢的主播吧。"
      class="text-sm text-mist text-center"
      verticalAlignment="center"
      textWrap="true"
    />
    <GridLayout row="3" rows="auto" columns="*,8,*" class="mt-3">
      <Button text="＋ 添加房间" class="primary" @tap="emit('add')" />
      <Button col="2" :text="busy ? '刷新中…' : '刷新状态'" :isEnabled="!busy" @tap="refresh" />
    </GridLayout>
    <Label
      row="4"
      :text="assignmentNotice || notice"
      textWrap="true"
      class="text-xs text-ice mt-2"
    />
  </GridLayout>
</template>
