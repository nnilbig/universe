<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Registration } from '~/types'
import type { ActivityWithLookups } from '~/services/activities/activities.types'
import { formatActivityDate, formatTimeRange, redemptionCode } from '~/lib/format'

const props = defineProps<{ activityId: string; activity: ActivityWithLookups; group: Registration[] }>()
const emit = defineEmits<{ changed: [] }>()

const { cancel, addGuestCompanion, listByActivity } = useRegistrations()
const findProfile = useProfileLookup()
const guestNames = useGuestNames()

const pendingIds = ref(new Set<string>())
const confirmTarget = ref<Registration | null>(null)
const error = ref('')
const cancelSuccessMessage = ref('')
let cancelSuccessTimer: ReturnType<typeof setTimeout> | undefined

const companionName = ref('')
const isAddingCompanion = ref(false)
const addError = ref('')

// The member who anchors the group — a LINE registrant, or the 訪客報名 主報名者. Always exactly
// one of these per group; everyone else is a 補充報名 companion (kind === 'guest', never anchors).
const anchor = computed(() => props.group.find((r) => r.kind === 'line') ?? props.group.find((r) => r.isPrimary))

function memberName(m: Registration): string {
  if (m.kind === 'guest') return m.nickname ?? '訪客'
  return (m.profileId ? findProfile(m.profileId)?.displayName : undefined) ?? 'LINE'
}

function memberTag(m: Registration): string {
  if (m.kind === 'line') return '你'
  return m.isPrimary ? '主報名者' : ''
}

// Anchor first, then everyone else in whatever order the server returns them.
const sortedGroup = computed(() =>
  [...props.group].sort((a, b) => Number(b.id === anchor.value?.id) - Number(a.id === anchor.value?.id))
)
const code = computed(() => (anchor.value ? redemptionCode(anchor.value.groupId) : ''))

const confirmOpen = computed({
  get: () => confirmTarget.value !== null,
  set: (val: boolean) => {
    if (!val) closeConfirm()
  }
})

function askCancel(member: Registration) {
  error.value = ''
  confirmTarget.value = member
}

function closeConfirm() {
  confirmTarget.value = null
}

async function confirmCancel() {
  const member = confirmTarget.value
  if (!member) return
  closeConfirm()
  pendingIds.value.add(member.id)
  try {
    await cancel(props.activityId, member.id, member.nickname)
    emit('changed')
    clearTimeout(cancelSuccessTimer)
    cancelSuccessMessage.value = '取消成功'
    cancelSuccessTimer = setTimeout(() => {
      cancelSuccessMessage.value = ''
    }, 2500)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '取消失敗'
  } finally {
    pendingIds.value.delete(member.id)
  }
}

async function addCompanion() {
  addError.value = ''
  const name = companionName.value.trim()
  if (!name || name.length > 4) {
    addError.value = '請輸入 1-4 個字的暱稱'
    return
  }
  const taken = listByActivity(props.activityId).some(
    (r) => r.nickname === name || (r.kind === 'line' && r.profileId && findProfile(r.profileId)?.displayName === name)
  )
  if (taken) {
    addError.value = `此場次已有叫「${name}」的球友！請重新輸入。`
    return
  }
  if (!anchor.value) return
  isAddingCompanion.value = true
  try {
    await addGuestCompanion(props.activityId, anchor.value.groupId, name)
    guestNames.remember(name)
    companionName.value = ''
    emit('changed')
  } catch (e) {
    addError.value = e instanceof Error ? e.message : '新增失敗，請再試一次'
  } finally {
    isAddingCompanion.value = false
  }
}
</script>

<template>
  <div class="rounded-card border border-gold/30 bg-gold/5 p-4">
    <p class="text-sm font-medium text-gold-light">報名成功</p>

    <div class="mt-3 rounded-lg border border-gold/20 bg-obsidian-900 p-3">
      <p class="text-[11px] text-titanium/50">入場通行證</p>
      <p class="mt-1 text-sm text-titanium-light">
        {{ formatActivityDate(activity.date) }} · {{ formatTimeRange(activity.startTime, activity.endTime) }}
      </p>
      <p class="text-xs text-titanium/50">{{ activity.location }}</p>
      <div class="mt-2 flex items-center justify-between border-t border-titanium/10 pt-2">
        <span class="text-xs text-titanium/50">報名總人數 共 {{ group.length }} 位</span>
        <span class="font-display text-lg font-bold tracking-[0.2em] text-gold-light">{{ code }}</span>
      </div>
    </div>

    <div class="mt-3 flex flex-col gap-2">
      <div
        v-for="m in sortedGroup"
        :key="m.id"
        class="flex items-center justify-between gap-2 rounded-lg border border-titanium/10 bg-obsidian-900 px-3 py-2"
      >
        <span class="text-sm text-titanium-light">
          {{ memberName(m) }}
          <span v-if="memberTag(m)" class="ml-1 text-[10px] text-gold-light">{{ memberTag(m) }}</span>
        </span>
        <UiButton variant="outline" size="sm" :disabled="pendingIds.has(m.id)" @click="askCancel(m)">
          取消報名
        </UiButton>
      </div>
    </div>

    <p v-if="cancelSuccessMessage" class="mt-2 text-xs text-gold-light">{{ cancelSuccessMessage }}</p>
    <p v-if="error" class="mt-2 text-xs text-red-400">{{ error }}</p>

    <div v-if="group.length < 4" class="mt-3 flex flex-col gap-2">
      <label class="text-xs text-titanium/50">補充報名</label>
      <div class="flex gap-2">
        <UiInput v-model="companionName" maxlength="4" placeholder="輸入友人暱稱" class="flex-1" />
        <UiButton variant="primary" size="sm" :disabled="isAddingCompanion" @click="addCompanion">
          {{ isAddingCompanion ? '新增中...' : '新增報名' }}
        </UiButton>
      </div>
      <p v-if="addError" class="text-xs text-red-400">{{ addError }}</p>
    </div>

    <UiDialog v-model:open="confirmOpen" title="取消報名">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-titanium/70">確認「{{ confirmTarget ? memberName(confirmTarget) : '' }}」取消報名？</p>
        <div class="flex gap-2">
          <UiButton variant="outline" size="sm" class="flex-1" @click="closeConfirm">返回</UiButton>
          <UiButton
            variant="danger"
            size="sm"
            class="flex-1"
            :disabled="confirmTarget ? pendingIds.has(confirmTarget.id) : false"
            @click="confirmCancel"
          >
            確認取消
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
