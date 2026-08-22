<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'
import type { Activity } from '~/types'
import { formatActivityDate, formatTimeRange } from '~/lib/format'

defineProps<{ activity: Activity; completed?: boolean }>()
defineEmits<{ cancel: [] }>()

// Where the stub's left border sits, measured from the card's right edge — shared by the notch
// holes and the torn strip so both line up with the stub column exactly.
const STUB_WIDTH = '2.5rem'
</script>

<template>
  <div class="metallic-border relative flex bg-obsidian-800">
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
    <div
      v-else
      class="absolute top-0 z-10 h-full w-2 -translate-x-1/2 bg-repeat-y"
      :style="{
        left: `calc(100% - ${STUB_WIDTH})`,
        backgroundImage:
          'linear-gradient(45deg, transparent 50%, #0A0A0B 50%), linear-gradient(-45deg, transparent 50%, #0A0A0B 50%)',
        backgroundSize: '8px 10px',
        backgroundPosition: 'center'
      }"
    />

    <div class="min-w-0 flex-1 p-4">
      <p class="truncate font-display text-sm font-semibold text-titanium-light">{{ activity.title }}</p>
      <p class="mt-1 text-xs text-titanium/60">
        {{ formatActivityDate(activity.date) }} · {{ formatTimeRange(activity.startTime, activity.endTime) }}
      </p>
      <p class="mt-0.5 flex items-center gap-1 text-xs text-titanium/60">
        <MapPin class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ activity.location }}</span>
      </p>
      <UiButton v-if="!completed" variant="danger" size="sm" class="mt-2" @click="$emit('cancel')">取消</UiButton>
      <span v-else class="mt-2 inline-block text-[10px] text-titanium/40">已結束</span>
    </div>

    <div
      class="flex shrink-0 items-center justify-center"
      :class="!completed && 'border-l border-dashed border-titanium/25'"
      :style="{ width: STUB_WIDTH }"
    >
      <span class="rotate-90 whitespace-nowrap text-[10px] tracking-[0.3em] text-titanium/40">入場券</span>
    </div>
  </div>
</template>
