<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { Activity, Registration } from '~/types'
import { formatActivityDate, formatTimeRange } from '~/lib/format'

const props = defineProps<{ activity: Activity; registration: Registration }>()

const findProfile = useProfileLookup()
const registrant = computed(() => {
  if (props.registration.kind === 'guest') {
    return { name: props.registration.nickname ?? '訪客', avatarUrl: props.registration.avatarUrl }
  }
  const profile = props.registration.profileId ? findProfile(props.registration.profileId) : undefined
  return { name: profile?.displayName ?? 'LINE', avatarUrl: props.registration.avatarUrl ?? profile?.avatarUrl }
})
</script>

<template>
  <div class="metallic-border relative overflow-hidden bg-obsidian-800 p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-display text-sm font-semibold text-titanium-light">{{ activity.title }}</p>
        <p class="mt-1 text-xs text-titanium/60">
          {{ formatActivityDate(activity.date) }} · {{ formatTimeRange(activity.startTime, activity.endTime) }}
        </p>
        <p class="mt-0.5 flex items-center gap-1 text-xs text-titanium/60">
          <MapPin class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ activity.location }}</span>
        </p>
      </div>
      <UiBadge :variant="registration.checkedIn ? 'gold' : 'neutral'" class="shrink-0">
        {{ registration.checkedIn ? '已核銷' : '尚未核銷' }}
      </UiBadge>
    </div>

    <div class="mt-3 flex items-center gap-2 border-t border-dashed border-titanium/15 pt-3">
      <UiAvatar :src="registrant.avatarUrl" :name="registrant.name" size="xs" />
      <span class="text-xs text-titanium/70">{{ registrant.name }}</span>
    </div>
  </div>
</template>
