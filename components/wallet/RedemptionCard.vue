<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { Activity, Registration } from '~/types'
import { formatTimeRange } from '~/lib/format'

const props = defineProps<{ activity: Activity; registration: Registration }>()

const findProfile = useProfileLookup()
const registrant = computed(() => {
  if (props.registration.kind === 'guest') {
    return { name: props.registration.nickname ?? '訪客', avatarUrl: props.registration.avatarUrl }
  }
  const profile = props.registration.profileId ? findProfile(props.registration.profileId) : undefined
  return { name: profile?.displayName ?? 'LINE', avatarUrl: props.registration.avatarUrl ?? profile?.avatarUrl }
})

const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六']
// Split out for the stub's big-day-number stamp, mirroring a physical ticket's tear-off half.
const dateParts = computed(() => {
  const d = new Date(`${props.activity.date}T00:00:00`)
  return { month: d.getMonth() + 1, day: d.getDate(), weekday: WEEKDAYS_ZH[d.getDay()] }
})
</script>

<template>
  <div class="metallic-border relative flex bg-obsidian-800">
    <span class="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-obsidian-950" />
    <span class="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-obsidian-950" />

    <div class="min-w-0 flex-1 p-4">
      <div class="flex items-start justify-between gap-3">
        <p class="min-w-0 truncate font-display text-sm font-semibold text-titanium-light">{{ activity.title }}</p>
        <UiBadge :variant="registration.checkedIn ? 'gold' : 'neutral'" class="shrink-0">
          {{ registration.checkedIn ? '已核銷' : '尚未核銷' }}
        </UiBadge>
      </div>
      <p class="mt-1 text-xs text-titanium/60">{{ formatTimeRange(activity.startTime, activity.endTime) }}</p>
      <p class="mt-0.5 flex items-center gap-1 text-xs text-titanium/60">
        <MapPin class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ activity.location }}</span>
      </p>
      <div class="mt-2 flex items-center gap-1.5">
        <UiAvatar :src="registrant.avatarUrl" :name="registrant.name" size="xs" />
        <span class="text-xs text-titanium/70">{{ registrant.name }}</span>
      </div>
    </div>

    <div
      class="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 border-l border-dashed border-titanium/25 py-3 text-center"
    >
      <span class="text-[10px] text-titanium/50">{{ dateParts.month }}月</span>
      <span class="font-display text-2xl font-bold leading-none text-gold-light">{{ dateParts.day }}</span>
      <span class="mt-1 text-[9px] text-titanium/40">週{{ dateParts.weekday }}</span>
    </div>
  </div>
</template>
