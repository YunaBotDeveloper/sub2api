<script setup lang="ts">
interface Props {
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullscreen: false
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header (matches OpsDashboardHeader: toolbar + two meter strips) -->
    <section class="card">
      <div class="card-header flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-2">
          <div class="h-5 w-44 animate-pulse bg-accent-weak"></div>
          <div class="h-3 w-80 max-w-full animate-pulse bg-surface-sunken"></div>
        </div>
        <div v-if="!props.fullscreen" class="flex flex-wrap items-center gap-2">
          <div class="h-9 w-[140px] animate-pulse bg-surface-sunken"></div>
          <div class="h-9 w-[160px] animate-pulse bg-surface-sunken"></div>
          <div class="h-9 w-[150px] animate-pulse bg-surface-sunken"></div>
          <div class="h-9 w-9 animate-pulse bg-surface-sunken"></div>
          <div class="h-9 w-28 animate-pulse bg-surface-sunken"></div>
          <div class="h-9 w-9 animate-pulse bg-surface-sunken"></div>
        </div>
      </div>

      <div :class="props.fullscreen ? 'space-y-6 p-6' : 'space-y-4 p-5'">
        <div class="meter">
          <div v-for="i in 2" :key="`a${i}`" class="meter-cell">
            <div class="h-3 w-20 animate-pulse bg-surface-sunken"></div>
            <div class="h-8 w-28 animate-pulse bg-surface-sunken"></div>
            <div class="h-3 w-24 animate-pulse bg-surface-sunken"></div>
          </div>
        </div>
        <div class="meter">
          <div v-for="i in 6" :key="`b${i}`" class="meter-cell">
            <div class="h-3 w-16 animate-pulse bg-surface-sunken"></div>
            <div class="h-8 w-24 animate-pulse bg-surface-sunken"></div>
            <div class="h-3 w-20 animate-pulse bg-surface-sunken"></div>
          </div>
        </div>
        <div class="meter">
          <div v-for="i in 6" :key="`c${i}`" class="meter-cell">
            <div class="h-3 w-12 animate-pulse bg-surface-sunken"></div>
            <div class="h-6 w-16 animate-pulse bg-surface-sunken"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Row: Concurrency + Throughput (matches OpsDashboard.vue) -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <section
        v-for="(span, idx) in ['lg:col-span-1', 'lg:col-span-1', 'lg:col-span-2']"
        :key="idx"
        :class="['card min-h-[360px]', span]"
      >
        <div class="card-header"><div class="h-4 w-44 animate-pulse bg-accent-weak"></div></div>
        <div class="card-body"><div class="h-72 animate-pulse bg-surface-sunken"></div></div>
      </section>
    </div>

    <!-- Row: Visual Analysis (baseline 3-up grid) -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <section v-for="i in 3" :key="i" class="card">
        <div class="card-header"><div class="h-4 w-44 animate-pulse bg-accent-weak"></div></div>
        <div class="card-body"><div class="h-56 animate-pulse bg-surface-sunken"></div></div>
      </section>
    </div>

    <!-- Alert Events -->
    <section class="card">
      <div class="card-header flex flex-wrap items-center justify-between gap-4">
        <div class="h-4 w-48 animate-pulse bg-accent-weak"></div>
        <div v-if="!props.fullscreen" class="flex flex-wrap items-center gap-2">
          <div class="h-9 w-[140px] animate-pulse bg-surface-sunken"></div>
          <div class="h-9 w-[120px] animate-pulse bg-surface-sunken"></div>
          <div class="h-9 w-[120px] animate-pulse bg-surface-sunken"></div>
        </div>
      </div>

      <div class="divide-y divide-border">
        <div v-for="i in 6" :key="i" class="flex items-center justify-between gap-4 px-5 py-3">
          <div class="flex-1 space-y-2">
            <div class="h-3 w-56 animate-pulse bg-surface-sunken"></div>
            <div class="h-3 w-80 max-w-full animate-pulse bg-surface-sunken"></div>
          </div>
          <div class="h-5 w-16 animate-pulse bg-surface-sunken"></div>
        </div>
      </div>
    </section>
  </div>
</template>
