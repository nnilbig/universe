<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    activityId: string
    /** Omit to show every registrant (wraps onto multiple rows instead of collapsing into +N). */
    max?: number
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { size: 'sm' }
)

const { listByActivity } = useRegistrations()
const findProfile = useProfileLookup()

const registrants = computed(() =>
  listByActivity(props.activityId).map((r) => {
    if (r.kind === 'guest') return { key: r.id, name: r.nickname ?? '訪客', avatarUrl: r.avatarUrl }
    const profile = r.profileId ? findProfile(r.profileId) : undefined
    return { key: r.id, name: profile?.displayName ?? 'LINE', avatarUrl: r.avatarUrl ?? profile?.avatarUrl }
  })
)

const visible = computed(() => (props.max ? registrants.value.slice(0, props.max) : registrants.value))
const overflowCount = computed(() => (props.max ? Math.max(0, registrants.value.length - props.max) : 0))
</script>

<template>
  <div v-if="registrants.length" class="flex items-center">
    <div class="flex flex-wrap gap-y-2 -space-x-2">
      <UiAvatar
        v-for="r in visible"
        :key="r.key"
        :src="r.avatarUrl"
        :name="r.name"
        :size="size"
        ringed
      />
    </div>
    <span v-if="overflowCount > 0" class="ml-2 text-xs text-titanium/60">+{{ overflowCount }}</span>
  </div>
  <span v-else class="text-xs text-titanium/40">尚無人報名</span>
</template>
