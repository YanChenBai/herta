import { expect, test } from "vite-plus/test";
import { createWorkspace } from "../src/domain/workspace";
import { newWorkspace, restoreWorkspaces } from "../src/domain/workspaces";

test("旧单工作台存档迁移时保留房间、布局与音量", () => {
  const legacy = createWorkspace();
  legacy.layout = "quad";
  legacy.rooms = [{ id: 6, title: "直播", anchor: "主播", cover: "", live: true }];
  legacy.slots[0].roomId = 6;
  legacy.slots[0].volume = 23;
  const restored = restoreWorkspaces("", JSON.stringify(legacy));
  expect(restored.items[0].state).toEqual(legacy);
  expect(restored.activeId).toBe(restored.items[0].id);
});
test("多套配置独立恢复，清理重复编号与无效活动编号", () => {
  const first = newWorkspace("第一套");
  const second = newWorkspace("第二套");
  first.state.slots[0].volume = 12;
  second.state.layout = "quad";
  const restored = restoreWorkspaces(
    JSON.stringify({ activeId: "missing", items: [first, first, null, second] }),
  );
  expect(restored.items).toHaveLength(2);
  expect(restored.activeId).toBe(first.id);
  restored.items[0].state.slots[0].volume = 99;
  expect(restored.items[1].state.slots[0].volume).toBe(70);
  expect(restored.items[1].state.layout).toBe("quad");
  expect(restoreWorkspaces("null").items).toHaveLength(1);
});
