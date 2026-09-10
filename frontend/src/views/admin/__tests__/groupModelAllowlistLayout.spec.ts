import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
// GroupsView 已按 section 拆分（openspec Phase 3），断言覆盖父视图 + groups/ 子组件
const groupsViewSource = [
  "../GroupsView.vue",
  "../groups/GroupCreateModal.vue",
  "../groups/GroupEditModal.vue",
  "../groups/GroupSortOrderModal.vue",
  "../groups/GroupCompositeRoutesModal.vue",
  "../groups/useGroupsView.ts",
]
  .map((file) => readFileSync(resolve(currentDir, file), "utf8"))
  .join("\n");

describe("groups model allowlist layout", () => {
  it("keeps the toolbar outside of the scrolling list content", () => {
    expect(groupsViewSource).toContain("overflow-hidden rounded-lg border");
    expect(groupsViewSource).toContain("max-h-64 space-y-2 overflow-y-auto p-2");
    expect(groupsViewSource).not.toContain("sticky top-0");
  });

  it("uses a wide dialog and keeps model pricing controls responsive", () => {
    expect(groupsViewSource).toContain('width="wide"');
    expect(groupsViewSource).toContain(
      "btn btn-secondary shrink-0 whitespace-nowrap",
    );
  });
});
