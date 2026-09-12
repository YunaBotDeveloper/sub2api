<template>
  <div v-show="activeTab === 'backup'">
    <BackupSettings />
  </div>
</template>

<script setup lang="ts">
import { useSettingsViewContext } from "./context";
import BackupSettings from "@/views/admin/BackupView.vue";

// 纯移动拆分：所有状态与方法来自 SettingsView 提供的上下文（openspec: rebuild-frontend-design-system Phase 3）
const ctx = useSettingsViewContext();
const {
  activeTab,
} = ctx;
</script>
