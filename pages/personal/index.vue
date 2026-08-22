<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { Activity, Registration } from '~/types'

interface MyRegistrationEntry {
  registration: Registration
  activity: Activity
}

const { profile } = useAuth()
const { cancel, myRegistrations } = useRegistrations()
const { getById } = useActivities()
const findProfile = useProfileLookup()

function registrantName(registration: Registration): string {
  if (registration.kind === 'guest') return registration.nickname ?? '訪客'
  return (registration.profileId ? findProfile(registration.profileId)?.displayName : undefined) ?? 'LINE'
}

const entries = ref<MyRegistrationEntry[]>([])
const isLoading = ref(true)

async function load() {
  isLoading.value = true
  try {
    const regs = await myRegistrations()
    const resolved = await Promise.all(
      regs.map(async (registration): Promise<MyRegistrationEntry | null> => {
        const activity = await getById(registration.activityId)
        return activity ? { registration, activity } : null
      })
    )
    entries.value = resolved.filter((x): x is MyRegistrationEntry => !!x)
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(profile, load)

const todayIso = new Date().toISOString().slice(0, 10)
const upcoming = computed(() => entries.value.filter((x) => x.activity.date >= todayIso))
const history = computed(() => entries.value.filter((x) => x.activity.date < todayIso))

const UPCOMING_PREVIEW_COUNT = 3
const HISTORY_PREVIEW_COUNT = 1
const showAllUpcoming = ref(false)
const showAllHistory = ref(false)
const visibleUpcoming = computed(() =>
  showAllUpcoming.value ? upcoming.value : upcoming.value.slice(0, UPCOMING_PREVIEW_COUNT)
)
const visibleHistory = computed(() =>
  showAllHistory.value ? history.value : history.value.slice(0, HISTORY_PREVIEW_COUNT)
)

const cancelTarget = ref<MyRegistrationEntry | null>(null)
const isCancelling = ref(false)
const confirmOpen = computed({
  get: () => cancelTarget.value !== null,
  set: (val: boolean) => {
    if (!val) cancelTarget.value = null
  }
})

function askCancel(entry: MyRegistrationEntry) {
  cancelTarget.value = entry
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  isCancelling.value = true
  try {
    await cancel(cancelTarget.value.activity.id, cancelTarget.value.registration.id, cancelTarget.value.registration.nickname)
    cancelTarget.value = null
    await load()
  } finally {
    isCancelling.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <p v-if="isLoading" class="py-10 text-center text-sm text-titanium/50">載入中...</p>
    <CommonPlaceholderCard
      v-else-if="!entries.length"
      title="尚無報名紀錄"
      description="報名活動後即可在這裡查看您的入場券。"
    />

    <template v-else>
      <section class="flex flex-col gap-3">
        <h2 class="font-display text-base font-semibold text-titanium-light">近期報名的活動</h2>
        <div v-if="upcoming.length" class="flex flex-col gap-3">
          <PersonalRegistrationTicketCard
            v-for="x in visibleUpcoming"
            :key="x.registration.id"
            :activity="x.activity"
            :nickname="registrantName(x.registration)"
            @cancel="askCancel(x)"
          />
          <button
            v-if="upcoming.length > UPCOMING_PREVIEW_COUNT"
            type="button"
            class="flex items-center justify-center gap-1 py-1 text-xs text-titanium/50 transition-colors hover:text-titanium-light"
            @click="showAllUpcoming = !showAllUpcoming"
          >
            {{ showAllUpcoming ? '收合' : `顯示更多（${upcoming.length - UPCOMING_PREVIEW_COUNT}）` }}
            <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="showAllUpcoming && 'rotate-180'" />
          </button>
        </div>
        <p v-else class="text-xs text-titanium/40">目前沒有即將到來的報名。</p>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="font-display text-base font-semibold text-titanium-light">歷史活動</h2>
        <div v-if="history.length" class="flex flex-col gap-3">
          <PersonalRegistrationTicketCard
            v-for="x in visibleHistory"
            :key="x.registration.id"
            :activity="x.activity"
            :nickname="registrantName(x.registration)"
            completed
          />
          <button
            v-if="history.length > HISTORY_PREVIEW_COUNT"
            type="button"
            class="flex items-center justify-center gap-1 py-1 text-xs text-titanium/50 transition-colors hover:text-titanium-light"
            @click="showAllHistory = !showAllHistory"
          >
            {{ showAllHistory ? '收合' : `顯示更多（${history.length - HISTORY_PREVIEW_COUNT}）` }}
            <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="showAllHistory && 'rotate-180'" />
          </button>
        </div>
        <p v-else class="text-xs text-titanium/40">尚無歷史活動紀錄。</p>
      </section>
    </template>

    <UiDialog v-model:open="confirmOpen" title="取消報名">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-titanium/70">確定要取消「{{ cancelTarget?.activity.title }}」的報名嗎？</p>
        <div class="flex gap-2">
          <UiButton variant="outline" size="sm" class="flex-1" @click="confirmOpen = false">返回</UiButton>
          <UiButton variant="danger" size="sm" class="flex-1" :disabled="isCancelling" @click="confirmCancel">
            {{ isCancelling ? '處理中...' : '確認取消' }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
