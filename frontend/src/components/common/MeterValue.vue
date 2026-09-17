<template>
  <!-- 电表读数：数值变化时逐位滚动。首屏直接显示，不做入场动画。boxed = 每位数字放进印刷方格 -->
  <span :class="['meter-roll', { 'meter-roll-boxed': boxed }]" :title="text">
    <span class="sr-only">{{ text }}</span>
    <span
      v-for="(ch, i) in chars"
      :key="chars.length - i"
      :class="['meter-roll-col', { 'meter-roll-digit': isDigit(ch) }]"
      aria-hidden="true"
    >
      <span
        v-if="isDigit(ch)"
        class="meter-roll-strip"
        :style="{ transform: `translateY(-${Number(ch) * 10}%)` }"
      >
        <span v-for="n in 10" :key="n">{{ n - 1 }}</span>
      </span>
      <span v-else>{{ ch }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: string | number; boxed?: boolean }>(), { boxed: false })

const text = computed(() => String(props.value))
const chars = computed(() => text.value.split(''))
const isDigit = (ch: string) => ch >= '0' && ch <= '9'
</script>

<style scoped>
.meter-roll {
  display: inline-flex;
  align-items: stretch;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.meter-roll-col {
  display: inline-block;
  height: 1.2em;
  line-height: 1.2em;
  overflow: hidden;
}

/* 数字列固定 1ch 宽并居中：Be Vietnam Pro 的数字不是等宽的，否则“1”会留出空隙 */
.meter-roll-digit {
  width: 1ch;
  text-align: center;
}

.meter-roll-strip {
  display: flex;
  flex-direction: column;
  transition: transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* 印刷数字方格：每位数字一格，格间细线；小数点、逗号、货币符号留在格外 */
.meter-roll-boxed .meter-roll-digit {
  box-sizing: content-box;
  width: 1ch;
  /* 只加水平内边距：垂直内边距会露出滚动条带上相邻的数字 */
  padding: 0 0.2em;
  border: 1px solid rgb(var(--border-strong));
  background: rgb(var(--surface));
  text-align: center;
}

.meter-roll-boxed .meter-roll-digit + .meter-roll-digit {
  border-left-width: 0;
}
</style>
