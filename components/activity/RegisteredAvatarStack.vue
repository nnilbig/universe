<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    activityId: string
    /** Omit to show every registrant (wraps onto multiple rows instead of collapsing into +N). */
    max?: number
    size?: 'xs' | 'sm' | 'md'
    /** When true, tapping an avatar toggles its name via the `select` emit. */
    clickable?: boolean
  }>(),
  { size: 'sm', clickable: false }
)

const emit = defineEmits<{ select: [name: string | null] }>()

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

const selectedKey = ref<string | null>(null)

function toggleSelect(r: { key: string; name: string }) {
  if (!props.clickable) return
  selectedKey.value = selectedKey.value === r.key ? null : r.key
  emit('select', selectedKey.value ? r.name : null)
}
</script>

<template>
  <div v-if="registrants.length" class="flex items-center">
    <div :class="max ? 'flex -space-x-2' : 'flex flex-wrap gap-2'">
      <component
        :is="clickable ? 'button' : 'div'"
        v-for="r in visible"
        :key="r.key"
        :type="clickable ? 'button' : undefined"
        :class="clickable && 'rounded-full transition-transform active:scale-95'"
        @click="toggleSelect(r)"
      >
        <UiAvatar
          :src="r.avatarUrl"
          :name="r.name"
          :size="size"
          ringed
          :class="clickable && selectedKey === r.key && 'ring-2 ring-gold'"
        />
      </component>
    </div>
    <span v-if="overflowCount > 0" class="ml-2 text-xs text-titanium/60">+{{ overflowCount }}</span>
  </div>
  <span v-else class="text-xs text-titanium/40">尚無人報名</span>
</template>
