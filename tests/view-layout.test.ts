import { expect, test } from "vite-plus/test";
import { layouts } from "../src/domain/workspace";
import { viewingLayout, separators } from "../src/domain/view-layout";
import { maxPlayerSlots } from "../src/domain/layouts";

test("竖屏双窗上下排列，分割线不出现在外边缘", () => {
  const layout = viewingLayout(layouts[1], false);
  expect(layout.columns).toBe("*");
  expect(layout.cells[1]).toEqual([1, 0, 1, 1]);
  expect(separators(layout, 0)).toEqual({ borderRightWidth: 0, borderBottomWidth: 1 });
  expect(separators(layout, 1)).toEqual({ borderRightWidth: 0, borderBottomWidth: 0 });
});

test("所有布局在横竖屏均完整覆盖网格，没有重叠或外边缘分割线", () => {
  for (const landscape of [false, true])
    for (const option of layouts) {
      const layout = viewingLayout(option, landscape);
      const rows = layout.rows.split(",").length;
      const columns = layout.columns.split(",").length;
      const coverage = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
      expect(layout.cells.length).toBeLessThanOrEqual(maxPlayerSlots);
      layout.cells.forEach(([row, col, rowSpan, colSpan], index) => {
        expect(row + rowSpan).toBeLessThanOrEqual(rows);
        expect(col + colSpan).toBeLessThanOrEqual(columns);
        for (let y = row; y < row + rowSpan; y++)
          for (let x = col; x < col + colSpan; x++) coverage[y][x]++;
        const edges = separators(layout, index);
        if (col + colSpan === columns) expect(edges.borderRightWidth).toBe(0);
        if (row + rowSpan === rows) expect(edges.borderBottomWidth).toBe(0);
      });
      expect(coverage.flat().every((count) => count === 1)).toBe(true);
    }
});
test("横屏保持并排，主次布局在竖屏保留主画面与两路小画面", () => {
  expect(viewingLayout(layouts[1], true)).toBe(layouts[1]);
  const layout = viewingLayout(layouts[2], false);
  expect(layout.cells[0]).toEqual([0, 0, 1, 2]);
  expect(separators(layout, 0)).toEqual({ borderRightWidth: 0, borderBottomWidth: 1 });
  expect(separators(layout, 1)).toEqual({ borderRightWidth: 1, borderBottomWidth: 0 });
  expect(separators(layout, 2)).toEqual({ borderRightWidth: 0, borderBottomWidth: 0 });
});
