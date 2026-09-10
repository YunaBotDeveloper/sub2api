import { inject, provide, type InjectionKey } from "vue";
import type { SettingsViewContext } from "./useSettingsView";

export const SETTINGS_VIEW_CONTEXT: InjectionKey<SettingsViewContext> = Symbol("SettingsViewContext");

export function provideSettingsViewContext(ctx: SettingsViewContext): void {
  provide(SETTINGS_VIEW_CONTEXT, ctx);
}

export function useSettingsViewContext(): SettingsViewContext {
  const ctx = inject(SETTINGS_VIEW_CONTEXT);
  if (!ctx) {
    throw new Error("useSettingsViewContext must be used inside SettingsView");
  }
  return ctx;
}
