<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCircle2, Circle } from 'lucide-vue-next'

const props = defineProps<{ activityId: string }>()

const { listByActivity, setCheckedIn } = useRegistrations()
const findProfile = useProfileLookup()
const pendingIds = ref(new Set<string>())

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

const checkedInCount = computed(() => attendees.value.filter((a) => a.checkedIn).length)

async function toggle(id: string, current: boolean) {
  pendingIds.value.add(id)
  try {
    await setCheckedIn(id, !current)
  } finally {
    pendingIds.value.delete(id)
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

    <button
      v-for="a in attendees"
      :key="a.id"
      type="button"
      :disabled="pendingIds.has(a.id)"
      class="flex items-center gap-3 rounded-lg border border-titanium/10 bg-obsidian-900 px-3 py-2.5 text-left transition-colors disabled:opacity-50"
      :class="a.checkedIn ? 'border-gold/30 bg-gold/5' : ''"
      @click="toggle(a.id, a.checkedIn)"
    >
      <UiAvatar :src="a.avatarUrl" :name="a.name" size="sm" />
      <span class="flex-1 text-sm" :class="a.checkedIn ? 'text-gold-light' : 'text-titanium-light'">{{ a.name }}</span>
      <CheckCircle2 v-if="a.checkedIn" class="h-5 w-5 shrink-0 text-gold" />
      <Circle v-else class="h-5 w-5 shrink-0 text-titanium/30" />
    </button>
  </div>
</template>
