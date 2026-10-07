import { createWorkspace, restoreWorkspace, type Workspace } from "./workspace";

export interface SavedWorkspace {
  id: string;
  name: string;
  state: Workspace;
}
export interface WorkspaceCollection {
  activeId: string;
  items: SavedWorkspace[];
}
export function newWorkspace(name: string): SavedWorkspace {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    name: name.trim().slice(0, 40) || "新工作台",
    state: createWorkspace(),
  };
}
export function restoreWorkspaces(raw: string, legacy = ""): WorkspaceCollection {
  try {
    const value = JSON.parse(raw) as WorkspaceCollection;
    const seen = new Set<string>();
    const items = value.items
      .filter((item) => {
        if (
          !item ||
          typeof item.id !== "string" ||
          !item.id ||
          seen.has(item.id) ||
          typeof item.name !== "string"
        )
          return false;
        seen.add(item.id);
        return true;
      })
      .map((item) => ({
        id: item.id,
        name: item.name.trim().slice(0, 40) || "工作台",
        state: restoreWorkspace(JSON.stringify(item.state)),
      }));
    if (items.length)
      return {
        items,
        activeId: items.some((item) => item.id === value.activeId) ? value.activeId : items[0].id,
      };
  } catch {
    /* 损坏的存档回退到旧工作台。 */
  }
  const first = newWorkspace("我的工作台");
  if (legacy) first.state = restoreWorkspace(legacy);
  return { activeId: first.id, items: [first] };
}
