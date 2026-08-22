<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { Activity } from '~/types'
import { formatDateParts, formatTimeRange } from '~/lib/format'

const props = defineProps<{ activity: Activity; nickname: string; completed?: boolean }>()
defineEmits<{ cancel: [] }>()

// Where the stub's left border sits, measured from the card's right edge — a completed card is
// narrower by exactly this much, as if the perforated stub had been torn off and discarded,
// leaving the space to its right empty.
const STUB_WIDTH = '2.5rem'

// Sawtooth clip along the right edge, standing in for the torn perforation left behind once the
// stub is gone.
const TORN_EDGE_CLIP =
  'polygon(0% 0%, 100% 0%, 97% 8.3%, 100% 16.7%, 97% 25%, 100% 33.3%, 97% 41.7%, 100% 50%, 97% 58.3%, 100% 66.7%, 97% 75%, 100% 83.3%, 97% 91.7%, 100% 100%, 0% 100%)'

const dateParts = computed(() => formatDateParts(props.activity.date))
</script>

<template>
  <div
    class="metallic-border relative flex items-stretch overflow-hidden bg-obsidian-800"
    :class="completed && 'self-start'"
    :style="completed ? { width: `calc(100% - ${STUB_WIDTH})`, clipPath: TORN_EDGE_CLIP } : undefined"
  >
    <div class="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 bg-obsidian-700/50 text-center">
      <span class="font-display text-sm font-semibold leading-tight text-gold-light">{{ dateParts.monthDay }}</span>
      <span class="text-[11px] leading-tight text-titanium/50">{{ dateParts.weekday }}</span>
    </div>

    <template v-if="!completed">
      <span
        class="absolute top-0 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-obsidian-950"
        :style="{ left: `calc(100% - ${STUB_WIDTH})` }"
      />
      <span
        class="absolute bottom-0 z-10 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-obsidian-950"
        :style="{ left: `calc(100% - ${STUB_WIDTH})` }"
      />
    </template>

    <div class="min-w-0 flex-1 p-4">
      <p class="truncate font-display text-sm font-semibold text-titanium-light">{{ activity.title }}</p>
      <p class="mt-0.5 text-xs text-gold-light">{{ nickname }}</p>
      <p class="mt-1 text-xs text-titanium/60">{{ formatTimeRange(activity.startTime, activity.endTime) }}</p>
      <p class="mt-0.5 flex items-center gap-1 text-xs text-titanium/60">
        <MapPin class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ activity.location }}</span>
      </p>
      <UiButton v-if="!completed" variant="danger" size="sm" class="mt-2" @click="$emit('cancel')">取消</UiButton>
      <span v-else class="mt-2 inline-block text-[10px] text-titanium/40">已結束</span>
    </div>

    <div
      v-if="!completed"
      class="flex shrink-0 items-center justify-center border-l border-dashed border-titanium/25"
      :style="{ width: STUB_WIDTH }"
    >
      <span class="rotate-90 whitespace-nowrap text-[10px] tracking-[0.3em] text-titanium/40">入場券</span>
    </div>
  </div>
</template>
