<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

const props = defineProps<{ activityId: string }>()

const { listByActivity, setCheckedIn } = useRegistrations()
const findProfile = useProfileLookup()

// Taps stage a checked_in change locally (pendingChanges) instead of writing immediately — the
// organizer reviews the whole batch, then 確認 submits every staged change in one go.
const pendingChanges = reactive(new Map<string, boolean>())
const isSubmitting = ref(false)

const attendees = computed(() =>
  listByActivity(props.activityId).map((r) => {
    if (r.kind === 'guest') return { id: r.id, name: r.nickname ?? '訪客', avatarUrl: r.avatarUrl, checkedIn: r.checkedIn }
    const profile = r.profileId ? findProfile(r.profileId) : undefined
    return {
      id: r.id,
      name: profile?.displayName ?? 'LINE',
      avatarUrl: r.avatarUrl ?? profile?.avatarUrl,
      checkedIn: r.checkedIn
    }
  })
)

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

    <p v-if="!attendees.length" class="rounded-lg border border-dashed border-titanium/15 py-4 text-center text-xs text-titanium/40">
      尚無人報名
    </p>

    <div
      v-for="a in attendees"
      :key="a.id"
      class="flex items-center gap-3 rounded-lg border border-titanium/10 bg-obsidian-900 px-3 py-2.5"
      :class="effectiveCheckedIn(a) ? 'border-gold/30 bg-gold/5' : ''"
    >
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
        {{ effectiveCheckedIn(a) ? '取消' : '核銷' }}
      </UiButton>
    </div>

    <UiButton v-if="pendingCount" class="mt-1" :disabled="isSubmitting" @click="submitBatch">
      {{ isSubmitting ? '更新中...' : '確認' }}
    </UiButton>
  </div>
</template>
