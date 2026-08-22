<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { ActivityWithLookups } from '~/services/activities/activities.types'
import { formatActivityDate, formatTimeRange } from '~/lib/format'

const uiStore = useUiStore()
const { getById, closeActivity } = useActivities()
const { myRegistrationGroup, listByActivity } = useRegistrations()
const { profile, viewMode, canToggleViewMode } = useAuth()
const findProfile = useProfileLookup()

const activity = ref<ActivityWithLookups | null>(null)
const isLoading = ref(false)
const refreshTick = ref(0)
const pendingAvatarIds = ref<string[] | null>(null)
const isRegistering = ref(false)
const isClosingActivity = ref(false)
const closeError = ref('')
const confirmCloseOpen = ref(false)
const cancelSuccessMessage = ref('')
let cancelSuccessTimer: ReturnType<typeof setTimeout> | undefined

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
    clearTimeout(cancelSuccessTimer)
    cancelSuccessMessage.value = ''
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

const registeredCount = computed(() => (activity.value ? listByActivity(activity.value.id).length : 0))

const myGroup = computed(() => {
  refreshTick.value
  if (!activity.value) return []
  return myRegistrationGroup(activity.value.id)
})

// Cancelling the group's last member reactively empties myGroup and swaps this view back to
// RegistrationRegisterOptions — which unmounts RegistrationGroupState before an emit from it would
// reliably reach us (the reactive swap and the emit race on the same microtask). Watching here
// instead of listening for a child emit sidesteps that race entirely.
watch(myGroup, (newGroup, oldGroup) => {
  if (oldGroup && oldGroup.length > 0 && newGroup.length === 0) {
    clearTimeout(cancelSuccessTimer)
    cancelSuccessMessage.value = '取消成功'
    cancelSuccessTimer = setTimeout(() => {
      cancelSuccessMessage.value = ''
    }, 2500)
  }
})

const isOrganizer = computed(() => !!activity.value && !!profile.value && activity.value.organizerId === profile.value.id)

// Only when manually switched to edit mode — otherwise organizers see the same view as any
// player. Admins/owners get the same registrant-management powers on any activity, not just
// their own (see the role comment on Profile.role in types/user.ts).
const canManageActivity = computed(
  () => !!activity.value && viewMode.value === 'edit' && (isOrganizer.value || canToggleViewMode.value)
)

const canCloseActivity = computed(
  () => !!activity.value && (activity.value.status === 'open' || activity.value.status === 'full')
)

function bumpRefresh() {
  refreshTick.value++
}

function askCloseActivity() {
  closeError.value = ''
  confirmCloseOpen.value = true
}

async function confirmCloseActivity() {
  if (!activity.value) return
  confirmCloseOpen.value = false
  isClosingActivity.value = true
  try {
    activity.value = await closeActivity(activity.value.id)
  } catch (e) {
    closeError.value = e instanceof Error ? e.message : '關閉活動失敗'
  } finally {
    isClosingActivity.value = false
  }
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
        <div class="flex items-center justify-between gap-2">
          <ActivityRegisteredAvatarStack :activity-id="activity.id" size="sm" />
          <span class="shrink-0 text-xs text-titanium/50">{{ registeredCount }}/{{ activity.capacity }}</span>
        </div>
      </div>

      <div v-if="canManageActivity" class="flex flex-col gap-4 rounded-card border border-gold/30 bg-gold/5 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-gold-light">
              {{ isOrganizer ? '這是你發起的活動' : '你正在以管理員身分管理此活動' }}
            </p>
            <p class="mt-1 text-xs text-titanium/50">
              點擊成員完成現場核銷。編輯活動內容即將推出 — 忘記報名的球員可用「訪客報名」入口現場登記。
            </p>
          </div>
          <UiButton
            v-if="canCloseActivity"
            variant="danger"
            size="sm"
            class="shrink-0"
            :disabled="isClosingActivity"
            @click="askCloseActivity"
          >
            關閉活動
          </UiButton>
        </div>
        <p v-if="closeError" class="text-xs text-red-400">{{ closeError }}</p>
        <ActivityAttendeeCheckinList :activity-id="activity.id" />
      </div>
      <RegistrationAvatarPicker
        v-else-if="pendingAvatarIds"
        :registration-ids="pendingAvatarIds"
        @done="onAvatarDone"
      />
      <RegistrationGroupState
        v-else-if="myGroup.length && !isRegistering"
        :activity-id="activity.id"
        :activity="activity"
        :group="myGroup"
        @changed="bumpRefresh"
      />
      <div v-else class="flex flex-col gap-3">
        <p v-if="cancelSuccessMessage" class="text-xs text-gold-light">{{ cancelSuccessMessage }}</p>
        <RegistrationRegisterOptions
          :activity-id="activity.id"
          @registering="onRegistering"
          @registered="onJustRegistered"
        />
      </div>
    </div>

    <UiDialog v-model:open="confirmCloseOpen" title="關閉活動">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-titanium/70">確認關閉「{{ activity?.title }}」？關閉後將停止接受新的報名。</p>
        <div class="flex gap-2">
          <UiButton variant="outline" size="sm" class="flex-1" @click="confirmCloseOpen = false">返回</UiButton>
          <UiButton variant="danger" size="sm" class="flex-1" :disabled="isClosingActivity" @click="confirmCloseActivity">
            確認關閉
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </UiSheet>
</template>
