<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ activityId: string }>()
const emit = defineEmits<{ submitting: []; registered: [registrationIds: string[]]; back: [] }>()

const SLOT_LABELS = ['主報名者', '友人 A', '友人 B', '友人 C']

// Always 4 slots — slot 0 (主報名者) is required, the rest (友人) may stay blank.
const nicknames = ref<string[]>(['', '', '', ''])
const error = ref('')
const isSubmitting = ref(false)

const { registerAsGuest, listByActivity } = useRegistrations()
const findProfile = useProfileLookup()
const guestNames = useGuestNames()

// MVP has no PIN — pre-fill 主報名者 with this device's most recently used nickname so a
// returning guest can register again without retyping it.
onMounted(() => {
  const recent = guestNames.mostRecent()
  if (recent) nicknames.value[0] = recent
})

const filledNicknames = computed(() => nicknames.value.map((n) => n.trim()).filter((n) => n.length > 0))

const isValid = computed(
  () => nicknames.value[0].trim().length > 0 && nicknames.value.every((n) => n.trim().length <= 4)
)

// This activity's current registrant names (LINE display names + guest nicknames), so a submitted
// nickname that's already taken here gets caught before hitting the API.
function existingNames(): Set<string> {
  const names = new Set<string>()
  for (const r of listByActivity(props.activityId)) {
    if (r.kind === 'guest' && r.nickname) names.add(r.nickname)
    else if (r.kind === 'line' && r.profileId) {
      const p = findProfile(r.profileId)
      if (p?.displayName) names.add(p.displayName)
    }
  }
  return names
}

function findDuplicateName(): string | null {
  const taken = existingNames()
  const seenInBatch = new Set<string>()
  for (const n of filledNicknames.value) {
    if (taken.has(n) || seenInBatch.has(n)) return n
    seenInBatch.add(n)
  }
  return null
}

async function submit() {
  error.value = ''
  if (!isValid.value) {
    error.value = '請輸入主報名者暱稱（最多 4 字），友人暱稱最多 4 字'
    return
  }
  const duplicate = findDuplicateName()
  if (duplicate) {
    error.value = `此場次已有叫「${duplicate}」的球友！請重新輸入。`
    return
  }
  isSubmitting.value = true
  emit('submitting')
  try {
    const registrations = await registerAsGuest({
      activityId: props.activityId,
      members: filledNicknames.value.map((nickname) => ({ nickname }))
    })
    for (const r of registrations) if (r.nickname) guestNames.remember(r.nickname)
    emit(
      'registered',
      registrations.map((r) => r.id)
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : '報名失敗，請再試一次'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-for="(label, i) in SLOT_LABELS" :key="i">
      <label class="mb-1.5 block text-xs text-titanium/50">
        {{ label }}（最多 4 字）{{ i === 0 ? '' : '・選填' }}
      </label>
      <UiInput v-model="nicknames[i]" maxlength="4" :placeholder="i === 0 ? '輸入暱稱' : '選填'" />
    </div>

    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>

    <div class="flex gap-3">
      <UiButton variant="outline" class="flex-1" @click="$emit('back')">返回</UiButton>
      <UiButton variant="primary" class="flex-1" :disabled="isSubmitting" @click="submit">
        {{ isSubmitting ? '報名中...' : '送出報名' }}
      </UiButton>
    </div>
  </div>
</template>
