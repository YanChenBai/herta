import type { LayoutId, layouts } from "./workspace";

export interface ViewingLayout {
  id: LayoutId;
  name: string;
  rows: string;
  columns: string;
  cells: readonly (readonly [number, number, number, number])[];
}
export function viewingLayout(layout: (typeof layouts)[number], landscape: boolean): ViewingLayout {
  if (layout.id === "five-mosaic" && landscape)
    return {
      ...layout,
      rows: layout.columns,
      columns: layout.rows,
      cells: layout.cells.map(([row, col, rowSpan, colSpan]) => [col, row, colSpan, rowSpan]),
    };
  if (landscape) return layout;
  if (
    layout.id === "seven-mosaic" ||
    layout.id === "focus-six" ||
    layout.id === "focus-seven" ||
    layout.id === "focus-nine" ||
    layout.id === "focus-five-reverse" ||
    layout.id === "focus-six-reverse"
  )
    return {
      ...layout,
      rows: layout.columns,
      columns: layout.rows,
      cells: layout.cells.map(([row, col, rowSpan, colSpan]) => [col, row, colSpan, rowSpan]),
    };
  if (layout.id === "six" || layout.id === "eight") {
    const rows = layout.columns.split(",").length;
    return {
      ...layout,
      rows: Array<string>(rows).fill("*").join(","),
      columns: "*,*",
      cells: Array.from({ length: layout.cells.length }, (_, index) => [
        Math.floor(index / 2),
        index % 2,
        1,
        1,
      ]),
    };
  }
  if (layout.id === "focus-five")
    return {
      ...layout,
      rows: "3*,*",
      columns: "*,*,*,*",
      cells: [
        [0, 0, 1, 4],
        [1, 0, 1, 1],
        [1, 1, 1, 1],
        [1, 2, 1, 1],
        [1, 3, 1, 1],
      ],
    };
  if (layout.id === "duo")
    return {
      ...layout,
      rows: "*,*",
      columns: "*",
      cells: [
        [0, 0, 1, 1],
        [1, 0, 1, 1],
      ],
    };
  if (layout.id === "focus")
    return {
      ...layout,
      rows: "2*,*",
      columns: "*,*",
      cells: [
        [0, 0, 1, 2],
        [1, 0, 1, 1],
        [1, 1, 1, 1],
      ],
    };
  if (layout.id === "cinema")
    return {
      ...layout,
      rows: "3*,*",
      columns: "*",
      cells: [
        [0, 0, 1, 1],
        [1, 0, 1, 1],
      ],
    };
  if (layout.id === "trio")
    return {
      ...layout,
      rows: "*,*,*",
      columns: "*",
      cells: [
        [0, 0, 1, 1],
        [1, 0, 1, 1],
        [2, 0, 1, 1],
      ],
    };
  if (layout.id === "focus-four")
    return {
      ...layout,
      rows: "3*,*",
      columns: "*,*,*",
      cells: [
        [0, 0, 1, 3],
        [1, 0, 1, 1],
        [1, 1, 1, 1],
        [1, 2, 1, 1],
      ],
    };
  if (layout.id === "cinema-reverse")
    return {
      ...layout,
      rows: "*,3*",
      columns: "*",
      cells: [
        [1, 0, 1, 1],
        [0, 0, 1, 1],
      ],
    };
  if (layout.id === "focus-reverse")
    return {
      ...layout,
      rows: "*,2*",
      columns: "*,*",
      cells: [
        [1, 0, 1, 2],
        [0, 0, 1, 1],
        [0, 1, 1, 1],
      ],
    };
  if (layout.id === "quad-strip")
    return {
      ...layout,
      rows: "*,*,*,*",
      columns: "*",
      cells: [
        [0, 0, 1, 1],
        [1, 0, 1, 1],
        [2, 0, 1, 1],
        [3, 0, 1, 1],
      ],
    };
  if (layout.id === "focus-four-reverse")
    return {
      ...layout,
      rows: "*,3*",
      columns: "*,*,*",
      cells: [
        [1, 0, 1, 3],
        [0, 0, 1, 1],
        [0, 1, 1, 1],
        [0, 2, 1, 1],
      ],
    };
  return layout;
}
export function separators(layout: ViewingLayout, index: number) {
  const [row, column, rowSpan, colSpan] = layout.cells[index];
  return {
    borderRightWidth: column + colSpan < layout.columns.split(",").length ? 1 : 0,
    borderBottomWidth: row + rowSpan < layout.rows.split(",").length ? 1 : 0,
  };
}
