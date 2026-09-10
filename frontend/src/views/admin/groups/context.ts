import { inject, provide, type InjectionKey } from "vue";
import type { GroupsViewContext } from "./useGroupsView";

export const GROUPS_VIEW_CONTEXT: InjectionKey<GroupsViewContext> = Symbol("GroupsViewContext");

export function provideGroupsViewContext(ctx: GroupsViewContext): void {
  provide(GROUPS_VIEW_CONTEXT, ctx);
}

export function useGroupsViewContext(): GroupsViewContext {
  const ctx = inject(GROUPS_VIEW_CONTEXT);
  if (!ctx) {
    throw new Error("useGroupsViewContext must be used inside GroupsView");
  }
  return ctx;
}
