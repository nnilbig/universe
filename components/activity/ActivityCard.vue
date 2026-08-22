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
    class="metallic-border flex w-full items-center gap-3 bg-obsidian-800 p-3 text-left transition-transform active:scale-[0.99]"
    @click="open"
  >
    <div class="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 py-1 text-center">
      <span class="font-display text-xs font-semibold leading-tight text-gold-light">{{ formatActivityDate(activity.date) }}</span>
    </div>

    <div class="min-w-0 flex-1 space-y-1">
      <div class="flex items-center gap-2">
        <h3 class="line-clamp-1 min-w-0 flex-1 font-display text-sm font-semibold text-titanium-light">{{ activity.title }}</h3>
        <ActivityStatusBadge :status="activity.status" />
      </div>

      <div class="flex items-center gap-2 text-xs text-titanium/70">
        <UiBadge variant="neutral">{{ activity.activityType.labelZh }}</UiBadge>
        <UiBadge variant="neutral">{{ activity.sportType.labelZh }}</UiBadge>
      </div>

      <div class="flex items-center gap-3 text-xs text-titanium/70">
        <span class="shrink-0">{{ formatTimeRange(activity.startTime, activity.endTime) }}</span>
        <span class="flex min-w-0 items-center gap-1">
          <MapPin class="h-3.5 w-3.5 shrink-0" />
          <span class="line-clamp-1">{{ activity.location }}</span>
        </span>
      </div>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-1.5">
      <UiAvatar :src="organizer?.avatarUrl" :name="organizer?.displayName" size="xs" />
      <ActivityRegisteredAvatarStack :activity-id="activity.id" :max="3" size="xs" />
    </div>
  </button>
</template>
