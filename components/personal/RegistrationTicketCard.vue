<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { Activity } from '~/types'
import { formatDateParts, formatTimeRange } from '~/lib/format'

const props = defineProps<{ activity: Activity; nickname: string; completed?: boolean }>()
defineEmits<{ cancel: [] }>()

// Where the stub's left border sits, measured from the card's right edge — shared by the notch
// holes and the stub column so both line up exactly.
const STUB_WIDTH = '2.5rem'

const dateParts = computed(() => formatDateParts(props.activity.date))
</script>

<template>
  <div class="metallic-border relative flex items-stretch overflow-hidden bg-obsidian-800">
    <div v-if="completed" class="pointer-events-none absolute inset-0 z-20 bg-obsidian-950/40" />
    <span
      v-if="completed"
      class="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 -rotate-12 whitespace-nowrap rounded border-2 border-titanium/40 bg-obsidian-800 px-3 py-1 font-display text-sm font-bold uppercase tracking-[0.3em] text-titanium/50"
      :style="{ left: `calc(100% - ${STUB_WIDTH})` }"
    >
      已結束
    </span>

    <div class="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 bg-obsidian-700/50 text-center">
      <span class="font-display text-sm font-semibold leading-tight text-gold-light">{{ dateParts.monthDay }}</span>
      <span class="text-[11px] leading-tight text-titanium/50">{{ dateParts.weekday }}</span>
    </div>

    <span
      class="absolute top-0 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-obsidian-950"
      :style="{ left: `calc(100% - ${STUB_WIDTH})` }"
    />
    <span
      class="absolute bottom-0 z-10 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-obsidian-950"
      :style="{ left: `calc(100% - ${STUB_WIDTH})` }"
    />

    <div class="min-w-0 flex-1 p-4">
      <p class="truncate font-display text-sm font-semibold text-titanium-light">{{ activity.title }}</p>
      <p class="mt-0.5 text-xs text-gold-light">{{ nickname }}</p>
      <p class="mt-1 text-xs text-titanium/60">{{ formatTimeRange(activity.startTime, activity.endTime) }}</p>
      <p class="mt-0.5 flex items-center gap-1 text-xs text-titanium/60">
        <MapPin class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ activity.location }}</span>
      </p>
      <UiButton v-if="!completed" variant="danger" size="sm" class="mt-2" @click="$emit('cancel')">取消</UiButton>
    </div>

    <div
      class="flex shrink-0 items-center justify-center border-l border-dashed border-titanium/25"
      :style="{ width: STUB_WIDTH }"
    >
      <span class="rotate-90 whitespace-nowrap text-[10px] tracking-[0.3em] text-titanium/40">入場券</span>
    </div>
  </div>
</template>
