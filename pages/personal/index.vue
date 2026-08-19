<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Activity, Registration } from '~/types'
import { formatActivityDate } from '~/lib/format'

interface MyRegistrationEntry {
  registration: Registration
  activity: Activity
}

const { profile } = useAuth()
const { cancel, myRegistrations } = useRegistrations()
const { getById } = useActivities()

const entries = ref<MyRegistrationEntry[]>([])
const isLoading = ref(true)

async function load() {
  if (!profile.value) {
    entries.value = []
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const regs = (await myRegistrations()).filter((r) => r.kind === 'line')
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

async function onCancel(activityId: string, registrationId: string) {
  await cancel(activityId, registrationId)
  await load()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <CommonPlaceholderCard v-if="!profile" title="尚未登入" description="登入 LINE 帳號即可查看您的報名紀錄。" />
    <p v-else-if="isLoading" class="py-10 text-center text-sm text-titanium/50">載入中...</p>

    <section v-if="profile && !isLoading" class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">近期報名的活動</h2>
      <div v-if="upcoming.length" class="flex flex-col gap-2">
        <div v-for="x in upcoming" :key="x.registration.id" class="flex items-center gap-2">
          <CommonSkeletonListItem
            class="flex-1"
            :title="x.activity.title"
            :subtitle="`${formatActivityDate(x.activity.date)} · ${x.activity.location}`"
          />
          <UiButton variant="ghost" size="sm" @click="onCancel(x.activity.id, x.registration.id)">取消</UiButton>
        </div>
      </div>
      <p v-else class="text-xs text-titanium/40">目前沒有即將到來的報名。</p>
    </section>

    <section v-if="profile && !isLoading" class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">歷史活動</h2>
      <div v-if="history.length" class="flex flex-col gap-2">
        <CommonSkeletonListItem
          v-for="x in history"
          :key="x.registration.id"
          :title="x.activity.title"
          :subtitle="`${formatActivityDate(x.activity.date)} · ${x.activity.location}`"
          meta="已結束"
        />
      </div>
      <p v-else class="text-xs text-titanium/40">尚無歷史活動紀錄。</p>
    </section>
  </div>
</template>
