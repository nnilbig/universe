<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { ActivityWithLookups } from '~/services/activities/activities.types'
import { formatActivityDate, formatTimeRange } from '~/lib/format'

const props = defineProps<{ activity: ActivityWithLookups }>()

const uiStore = useUiStore()
const findProfile = useProfileLookup()
const organizer = computed(() => findProfile(props.activity.organizerId))

function open() {
  uiStore.expandActivity(props.activity.id)
}
</script>

<template>
  <button
    type="button"
    class="metallic-border flex w-64 shrink-0 flex-col gap-3 bg-obsidian-800 p-4 text-left transition-transform active:scale-[0.98]"
    @click="open"
  >
    <div class="flex items-center justify-between">
      <span class="font-display text-sm font-semibold text-gold-light">{{ formatActivityDate(activity.date) }}</span>
      <ActivityStatusBadge :status="activity.status" />
    </div>

    <div class="flex items-center gap-2 text-xs text-titanium/70">
      <UiBadge variant="neutral">{{ activity.activityType.labelZh }}</UiBadge>
      <UiBadge variant="neutral">{{ activity.sportType.labelZh }}</UiBadge>
    </div>

    <h3 class="line-clamp-2 font-display text-base font-semibold text-titanium-light">{{ activity.title }}</h3>

    <div class="space-y-1 text-xs text-titanium/70">
      <p>{{ formatTimeRange(activity.startTime, activity.endTime) }}</p>
      <p class="flex items-center gap-1">
        <MapPin class="h-3.5 w-3.5 shrink-0" />
        <span class="line-clamp-1">{{ activity.location }}</span>
      </p>
    </div>

    <div class="flex items-center justify-between border-t border-titanium/10 pt-3">
      <div class="flex items-center gap-1.5">
        <UiAvatar :src="organizer?.avatarUrl" :name="organizer?.displayName" size="xs" />
        <span class="text-[11px] text-titanium/50">{{ organizer?.displayName }}</span>
      </div>
      <ActivityRegisteredAvatarStack :activity-id="activity.id" :max="3" size="xs" />
    </div>
  </button>
</template>
