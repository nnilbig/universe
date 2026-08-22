<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { GripVertical } from 'lucide-vue-next'

const props = defineProps<{ activityId: string }>()

const { listByActivity, setCheckedIn, cancel, adminAddGuest, reorder } = useRegistrations()
const findProfile = useProfileLookup()

const newAttendeeName = ref('')
const isAddingAttendee = ref(false)
const addAttendeeError = ref('')

// Taps stage a checked_in change locally (pendingChanges) instead of writing immediately — the
// organizer reviews the whole batch, then 確認 submits every staged change in one go.
const pendingChanges = reactive(new Map<string, boolean>())
const isSubmitting = ref(false)

const cancelTarget = ref<{ id: string; name: string; nickname?: string } | null>(null)
const isCancelling = ref(false)
const cancelError = ref('')
const confirmCancelOpen = computed({
  get: () => cancelTarget.value !== null,
  set: (val: boolean) => {
    if (!val) cancelTarget.value = null
  }
})

const attendees = computed(() =>
  listByActivity(props.activityId).map((r) => {
    if (r.kind === 'guest')
      return { id: r.id, name: r.nickname ?? '訪客', nickname: r.nickname, avatarUrl: r.avatarUrl, checkedIn: r.checkedIn }
    const profile = r.profileId ? findProfile(r.profileId) : undefined
    return {
      id: r.id,
      name: profile?.displayName ?? 'LINE',
      nickname: undefined,
      avatarUrl: r.avatarUrl ?? profile?.avatarUrl,
      checkedIn: r.checkedIn
    }
  })
)

// The server's own order (attendees, above) is the source of truth, but a drag in progress needs
// its own mutable copy of the id order so intermediate positions render smoothly without a round
// trip per pointermove. Only resynced from the server when the *set* of ids actually changes
// (someone registered/cancelled/was added) — not on every reactive tick — so it doesn't clobber an
// in-flight drag or the just-persisted order while the confirming request is still in flight.
const localOrder = ref<string[]>([])
watch(
  () => attendees.value.map((a) => a.id),
  (ids) => {
    const sameSet = localOrder.value.length === ids.length && localOrder.value.every((id) => ids.includes(id))
    if (!sameSet) localOrder.value = ids
  },
  { immediate: true }
)

const orderedAttendees = computed(() => {
  const byId = new Map(attendees.value.map((a) => [a.id, a]))
  return localOrder.value.map((id) => byId.get(id)).filter((a): a is (typeof attendees.value)[number] => !!a)
})

const rowEls = ref<(HTMLElement | null)[]>([])
function setRowEl(el: unknown, index: number) {
  rowEls.value[index] = el as HTMLElement | null
}

const draggingId = ref<string | null>(null)
const isReordering = ref(false)
const reorderError = ref('')

function onHandlePointerDown(id: string, event: PointerEvent) {
  draggingId.value = id
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onHandlePointerMove(event: PointerEvent) {
  if (!draggingId.value) return
  const fromIndex = localOrder.value.indexOf(draggingId.value)
  if (fromIndex === -1) return
  let toIndex = fromIndex
  for (let i = 0; i < rowEls.value.length; i++) {
    const rect = rowEls.value[i]?.getBoundingClientRect()
    if (!rect) continue
    toIndex = i
    if (event.clientY < rect.top + rect.height / 2) break
  }
  if (toIndex !== fromIndex) {
    const ids = [...localOrder.value]
    const [moved] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, moved)
    localOrder.value = ids
  }
}

async function onHandlePointerUp() {
  if (!draggingId.value) return
  draggingId.value = null
  isReordering.value = true
  reorderError.value = ''
  try {
    await reorder(props.activityId, localOrder.value)
  } catch (e) {
    reorderError.value = e instanceof Error ? e.message : '排序失敗，請再試一次'
  } finally {
    isReordering.value = false
  }
}

async function addAttendee() {
  addAttendeeError.value = ''
  const name = newAttendeeName.value.trim()
  if (!name || name.length > 8) {
    addAttendeeError.value = '請輸入 1-8 個字的暱稱'
    return
  }
  if (attendees.value.some((a) => a.name === name)) {
    addAttendeeError.value = `此場次已有叫「${name}」的球友！請重新輸入。`
    return
  }
  isAddingAttendee.value = true
  try {
    await adminAddGuest(props.activityId, name)
    newAttendeeName.value = ''
  } catch (e) {
    addAttendeeError.value = e instanceof Error ? e.message : '新增失敗，請再試一次'
  } finally {
    isAddingAttendee.value = false
  }
}

function askCancel(a: { id: string; name: string; nickname?: string }) {
  cancelError.value = ''
  cancelTarget.value = a
}

async function confirmCancel() {
  const target = cancelTarget.value
  if (!target) return
  isCancelling.value = true
  try {
    await cancel(props.activityId, target.id, target.nickname)
    cancelTarget.value = null
  } catch (e) {
    cancelError.value = e instanceof Error ? e.message : '取消失敗'
  } finally {
    isCancelling.value = false
  }
}

function effectiveCheckedIn(a: { id: string; checkedIn: boolean }): boolean {
  return pendingChanges.has(a.id) ? pendingChanges.get(a.id)! : a.checkedIn
}

const checkedInCount = computed(() => attendees.value.filter((a) => effectiveCheckedIn(a)).length)
const pendingCount = computed(() => pendingChanges.size)

function toggleLocal(a: { id: string; checkedIn: boolean }) {
  const next = !effectiveCheckedIn(a)
  if (next === a.checkedIn) pendingChanges.delete(a.id)
  else pendingChanges.set(a.id, next)
}

async function submitBatch() {
  if (!pendingChanges.size) return
  isSubmitting.value = true
  try {
    await Promise.all([...pendingChanges.entries()].map(([id, checkedIn]) => setCheckedIn(id, checkedIn)))
    pendingChanges.clear()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between text-xs text-titanium/50">
      <span>現場核銷</span>
      <span>{{ checkedInCount }} / {{ attendees.length }} 已到場</span>
    </div>

    <div class="flex gap-2">
      <UiInput v-model="newAttendeeName" maxlength="8" placeholder="輸入球員暱稱，手動新增報名" class="flex-1" />
      <UiButton type="button" size="sm" :disabled="isAddingAttendee" @click="addAttendee">
        {{ isAddingAttendee ? '新增中...' : '新增人員' }}
      </UiButton>
    </div>
    <p v-if="addAttendeeError" class="text-xs text-red-400">{{ addAttendeeError }}</p>

    <p v-if="!attendees.length" class="rounded-lg border border-dashed border-titanium/15 py-4 text-center text-xs text-titanium/40">
      尚無人報名
    </p>

    <div
      v-for="(a, index) in orderedAttendees"
      :ref="(el) => setRowEl(el, index)"
      :key="a.id"
      class="flex items-center gap-3 rounded-lg border border-titanium/10 bg-obsidian-900 px-3 py-2.5"
      :class="[effectiveCheckedIn(a) ? 'border-gold/30 bg-gold/5' : '', draggingId === a.id ? 'opacity-60' : '']"
    >
      <button
        type="button"
        class="shrink-0 touch-none text-titanium/30 hover:text-titanium/60"
        @pointerdown="onHandlePointerDown(a.id, $event)"
        @pointermove="onHandlePointerMove"
        @pointerup="onHandlePointerUp"
        @pointercancel="onHandlePointerUp"
      >
        <GripVertical class="h-4 w-4" />
      </button>
      <UiAvatar :src="a.avatarUrl" :name="a.name" size="sm" />
      <span class="flex-1 text-sm" :class="effectiveCheckedIn(a) ? 'text-gold-light' : 'text-titanium-light'">
        {{ a.name }}
      </span>
      <span v-if="pendingChanges.has(a.id)" class="text-[10px] text-titanium/40">未送出</span>
      <UiButton
        type="button"
        size="sm"
        :variant="effectiveCheckedIn(a) ? 'outline' : 'primary'"
        @click="toggleLocal(a)"
      >
        {{ effectiveCheckedIn(a) ? '取消核銷' : '核銷' }}
      </UiButton>
      <UiButton type="button" size="sm" variant="danger" @click="askCancel(a)">取消報名</UiButton>
    </div>

    <p v-if="reorderError" class="text-xs text-red-400">{{ reorderError }}</p>
    <p v-if="cancelError" class="text-xs text-red-400">{{ cancelError }}</p>

    <UiButton v-if="pendingCount" class="mt-1" :disabled="isSubmitting" @click="submitBatch">
      {{ isSubmitting ? '更新中...' : '確認' }}
    </UiButton>

    <UiDialog v-model:open="confirmCancelOpen" title="取消報名">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-titanium/70">確認取消「{{ cancelTarget?.name }}」的報名？</p>
        <div class="flex gap-2">
          <UiButton variant="outline" size="sm" class="flex-1" @click="confirmCancelOpen = false">返回</UiButton>
          <UiButton variant="danger" size="sm" class="flex-1" :disabled="isCancelling" @click="confirmCancel">
            {{ isCancelling ? '處理中...' : '確認取消' }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
