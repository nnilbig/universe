<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { ActivityWithLookups } from '~/services/activities/activities.types'
import { formatActivityDate, formatTimeRange } from '~/lib/format'

const uiStore = useUiStore()
const { getById } = useActivities()
const { myRegistration, myGuestGroup } = useRegistrations()
const { profile, viewMode } = useAuth()
const findProfile = useProfileLookup()

const activity = ref<ActivityWithLookups | null>(null)
const isLoading = ref(false)
const refreshTick = ref(0)
const pendingAvatarIds = ref<string[] | null>(null)
const isRegistering = ref(false)

const open = computed({
  get: () => uiStore.expandedActivityId !== null,
  set: (val: boolean) => {
    if (!val) uiStore.closeActivitySheet()
  }
})

watch(
  () => uiStore.expandedActivityId,
  async (id) => {
    activity.value = null
    pendingAvatarIds.value = null
    isRegistering.value = false
    if (!id) return
    isLoading.value = true
    try {
      activity.value = (await getById(id)) ?? null
    } finally {
      isLoading.value = false
    }
  },
  { immediate: true }
)

const organizer = computed(() => (activity.value ? findProfile(activity.value.organizerId) : undefined))

const currentRegistration = computed(() => {
  refreshTick.value
  if (!activity.value) return null
  return myRegistration(activity.value.id)
})

const isLineRegistration = computed(() => currentRegistration.value?.kind === 'line')

const guestGroup = computed(() => {
  refreshTick.value
  if (!activity.value) return []
  return myGuestGroup(activity.value.id)
})

// Only when manually switched to edit mode — otherwise organizers see the same view as any player.
const isOwnActivityEditMode = computed(
  () =>
    !!activity.value &&
    !!profile.value &&
    activity.value.organizerId === profile.value.id &&
    viewMode.value === 'edit'
)

function bumpRefresh() {
  refreshTick.value++
}

function onRegistering() {
  isRegistering.value = true
}

function onJustRegistered(registrationIds: string[], skipAvatarStep?: boolean) {
  isRegistering.value = false
  if (skipAvatarStep) {
    bumpRefresh()
  } else {
    pendingAvatarIds.value = registrationIds
  }
}

function onAvatarDone() {
  pendingAvatarIds.value = null
  bumpRefresh()
}
</script>

<template>
  <UiSheet v-model:open="open" :title="activity?.title">
    <div v-if="isLoading" class="py-10 text-center text-sm text-titanium/50">載入中...</div>
    <div v-else-if="activity" class="flex flex-col gap-5">
      <div class="space-y-2 text-sm text-titanium/70">
        <div class="flex flex-wrap items-center gap-2">
          <ActivityStatusBadge :status="activity.status" />
          <UiBadge>{{ activity.activityType.labelZh }}</UiBadge>
          <UiBadge>{{ activity.sportType.labelZh }}</UiBadge>
        </div>
        <p>{{ formatActivityDate(activity.date) }} · {{ formatTimeRange(activity.startTime, activity.endTime) }}</p>
        <p class="flex items-center gap-1.5">
          <MapPin class="h-3.5 w-3.5 shrink-0" />
          {{ activity.location }}
        </p>
        <div class="flex items-center gap-1.5 pt-1">
          <UiAvatar :src="organizer?.avatarUrl" :name="organizer?.displayName" size="xs" />
          <span class="text-xs text-titanium/50">發起人・{{ organizer?.displayName }}</span>
        </div>
      </div>

      <div>
        <h4 class="mb-2 text-xs font-medium text-titanium/50">已報名成員</h4>
        <ActivityRegisteredAvatarStack :activity-id="activity.id" :max="8" size="sm" />
      </div>

      <div v-if="isOwnActivityEditMode" class="flex flex-col gap-4 rounded-card border border-gold/30 bg-gold/5 p-4">
        <div>
          <p class="text-sm font-medium text-gold-light">這是你發起的活動</p>
          <p class="mt-1 text-xs text-titanium/50">
            點擊成員完成現場核銷。編輯活動內容即將推出 — 忘記報名的球員可用「訪客報名」入口現場登記。
          </p>
        </div>
        <ActivityAttendeeCheckinList :activity-id="activity.id" />
      </div>
      <RegistrationAvatarPicker
        v-else-if="pendingAvatarIds"
        :registration-ids="pendingAvatarIds"
        @done="onAvatarDone"
      />
      <RegistrationRegisteredState
        v-else-if="isLineRegistration && !isRegistering"
        :activity-id="activity.id"
        :registration="currentRegistration!"
        @cancelled="bumpRefresh"
      />
      <RegistrationGuestGroupState
        v-else-if="guestGroup.length && !isRegistering"
        :activity-id="activity.id"
        :activity="activity"
        :group="guestGroup"
        @changed="bumpRefresh"
      />
      <RegistrationRegisterOptions
        v-else
        :activity-id="activity.id"
        @registering="onRegistering"
        @registered="onJustRegistered"
      />
    </div>
  </UiSheet>
</template>
