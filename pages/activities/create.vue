<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { cn } from '~/lib/utils'

const { canToggleViewMode, profile } = useAuth()
const { activityTypes, sportTypes, loadLookups, createActivity } = useActivities()

onMounted(async () => {
  if (!activityTypes.value.length || !sportTypes.value.length) await loadLookups()
  activityTypeId.value = activityTypes.value.find((t) => t.code === 'casual')?.id ?? activityTypes.value[0]?.id ?? ''
  sportTypeId.value = sportTypes.value.find((s) => s.code === 'badminton')?.id ?? sportTypes.value[0]?.id ?? ''
})

const title = ref('')
const activityTypeId = ref('')
const sportTypeId = ref('')
const date = ref('')
const startTime = ref('')
const endTime = ref('')
const location = ref('')
const capacity = ref('')
const fee = ref('')

// Once startTime moves past an already-picked endTime, the picker's own min-based disabling would
// leave endTime holding a now-invalid value with nothing forcing it back into view — clear it so
// isValid can't be satisfied by a stale selection.
watch(startTime, () => {
  if (endTime.value && endTime.value <= startTime.value) endTime.value = ''
})

function nearestFridayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7))
  return d.toISOString().slice(0, 10)
}

function applyBadmintonPreset() {
  title.value = 'WHONEXT 羽球交流'
  activityTypeId.value = activityTypes.value.find((t) => t.code === 'casual')?.id ?? activityTypeId.value
  sportTypeId.value = sportTypes.value.find((s) => s.code === 'badminton')?.id ?? sportTypeId.value
  date.value = nearestFridayIso()
  startTime.value = '20:00'
  endTime.value = '22:00'
  location.value = '大墩大慶羽球館 4號場地'
  capacity.value = '16'
}

const isValid = computed(
  () =>
    title.value.trim() &&
    activityTypeId.value &&
    sportTypeId.value &&
    date.value &&
    startTime.value &&
    (!endTime.value || endTime.value > startTime.value) &&
    location.value.trim() &&
    Number(capacity.value) > 0
)

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const created = ref(false)

async function submit() {
  if (!isValid.value || !profile.value) return
  isSubmitting.value = true
  submitError.value = null
  try {
    await createActivity(
      {
        title: title.value.trim(),
        activityTypeId: activityTypeId.value,
        sportTypeId: sportTypeId.value,
        date: date.value,
        startTime: startTime.value,
        endTime: endTime.value || undefined,
        location: location.value.trim(),
        capacity: Math.round(Number(capacity.value)),
        fee: Math.round(Number(fee.value)) || 0
      },
      profile.value.id
    )
    created.value = true
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : '建立失敗，請再試一次'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <CommonPlaceholderCard v-if="!canToggleViewMode" title="沒有權限" description="僅管理員／Owner 可建立活動。" />

    <template v-else-if="created">
      <CommonPlaceholderCard title="活動已建立">
        <p class="text-xs text-titanium/50">「{{ title }}」已加入活動列表。</p>
        <NuxtLink to="/" class="mt-3 inline-block"><UiButton size="sm">回首頁</UiButton></NuxtLink>
      </CommonPlaceholderCard>
    </template>

    <template v-else>
      <h2 class="font-display text-base font-semibold text-titanium-light">建立活動</h2>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs text-titanium/50">標題</label>
            <button
              type="button"
              class="rounded-full border border-gold/40 px-3 py-1 text-[11px] font-medium text-gold-light transition-colors hover:bg-gold/10"
              @click="applyBadmintonPreset"
            >
              預設羽球
            </button>
          </div>
          <UiInput v-model="title" placeholder="活動標題" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-titanium/50">活動類型</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in activityTypes"
              :key="t.id"
              type="button"
              :class="
                cn(
                  'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
                  activityTypeId === t.id
                    ? 'border-gold/60 bg-gold/10 text-gold-light'
                    : 'border-titanium/15 text-titanium/60 hover:border-titanium/30'
                )
              "
              @click="activityTypeId = t.id"
            >
              {{ t.labelZh }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-titanium/50">運動類型</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in sportTypes"
              :key="s.id"
              type="button"
              :class="
                cn(
                  'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
                  sportTypeId === s.id
                    ? 'border-gold/60 bg-gold/10 text-gold-light'
                    : 'border-titanium/15 text-titanium/60 hover:border-titanium/30'
                )
              "
              @click="sportTypeId = s.id"
            >
              {{ s.labelZh }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-titanium/50">日期</label>
            <UiInput v-model="date" type="date" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-titanium/50">人數上限</label>
            <UiInput v-model="capacity" type="number" inputmode="numeric" placeholder="16" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-titanium/50">開始時間</label>
          <UiTimePicker v-model="startTime" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-titanium/50">結束時間</label>
          <UiTimePicker v-model="endTime" :min="startTime" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-titanium/50">地點</label>
          <UiInput v-model="location" placeholder="場地名稱" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-titanium/50">費用</label>
          <UiInput v-model="fee" type="number" inputmode="numeric" placeholder="0" />
        </div>
      </div>

      <p v-if="submitError" class="text-xs text-red-300">{{ submitError }}</p>

      <UiButton :disabled="!isValid || isSubmitting" @click="submit">
        {{ isSubmitting ? '建立中...' : '建立活動' }}
      </UiButton>
    </template>
  </div>
</template>
