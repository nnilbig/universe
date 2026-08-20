<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ activityId: string }>()
const emit = defineEmits<{ submitting: []; registered: [registrationIds: string[]]; back: [] }>()

const MIN_GROUP_SIZE = 1
const MAX_GROUP_SIZE = 4

const groupSize = ref(1)
const nicknames = ref<string[]>([''])
const pin = ref('')
const error = ref('')
const isSubmitting = ref(false)

const { registerAsGuest } = useRegistrations()

// Browser auto-session — remembers the guest's own nickname/PIN across visits (this device only)
// so returning guests don't have to retype either one. Only ever pre-fills member #1; additional
// group members in a multi-person registration still start blank.
const GUEST_IDENTITY_KEY = 'whonext:guest-identity'

interface GuestIdentity {
  nickname: string
  pin: string
}

function loadGuestIdentity(): GuestIdentity | null {
  if (import.meta.server) return null
  const raw = localStorage.getItem(GUEST_IDENTITY_KEY)
  return raw ? (JSON.parse(raw) as GuestIdentity) : null
}

function saveGuestIdentity(identity: GuestIdentity) {
  if (import.meta.server) return
  localStorage.setItem(GUEST_IDENTITY_KEY, JSON.stringify(identity))
}

onMounted(() => {
  const saved = loadGuestIdentity()
  if (!saved) return
  nicknames.value[0] = saved.nickname
  pin.value = saved.pin
})

function setGroupSize(n: number) {
  groupSize.value = n
  const next = [...nicknames.value]
  while (next.length < n) next.push('')
  next.length = n
  nicknames.value = next
}

function decrementGroupSize() {
  if (groupSize.value > MIN_GROUP_SIZE) setGroupSize(groupSize.value - 1)
}

function incrementGroupSize() {
  if (groupSize.value < MAX_GROUP_SIZE) setGroupSize(groupSize.value + 1)
}

const isValid = computed(
  () =>
    nicknames.value.every((n) => n.trim().length > 0 && n.trim().length <= 4) &&
    /^\d{4}$/.test(pin.value)
)

async function submit() {
  error.value = ''
  if (!isValid.value) {
    error.value = '暱稱請輸入 1-4 個字，PIN 碼請輸入 4 位數字'
    return
  }
  isSubmitting.value = true
  emit('submitting')
  try {
    const registrations = await registerAsGuest({
      activityId: props.activityId,
      pin: pin.value,
      members: nicknames.value.map((nickname) => ({ nickname: nickname.trim() }))
    })
    saveGuestIdentity({ nickname: nicknames.value[0].trim(), pin: pin.value })
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
    <div>
      <label class="mb-1.5 block text-xs text-titanium/50">人數</label>
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="h-9 w-9 rounded-full border border-titanium/15 text-lg text-titanium/60 transition-colors disabled:opacity-30"
          :disabled="groupSize <= MIN_GROUP_SIZE"
          @click="decrementGroupSize"
        >
          −
        </button>
        <span class="w-4 text-center font-display text-base font-semibold text-titanium-light">{{ groupSize }}</span>
        <button
          type="button"
          class="h-9 w-9 rounded-full border border-titanium/15 text-lg text-titanium/60 transition-colors disabled:opacity-30"
          :disabled="groupSize >= MAX_GROUP_SIZE"
          @click="incrementGroupSize"
        >
          +
        </button>
      </div>
    </div>

    <div v-for="(_, i) in nicknames" :key="i">
      <label class="mb-1.5 block text-xs text-titanium/50">
        暱稱{{ groupSize > 1 ? ` ${i + 1}` : '' }}（最多 4 字）
      </label>
      <UiInput v-model="nicknames[i]" maxlength="4" placeholder="輸入暱稱" />
    </div>

    <div>
      <label class="mb-1.5 block text-xs text-titanium/50">自行輸入 4 位數 PIN 碼（取消及核銷使用）</label>
      <UiPinInput v-model="pin" />
    </div>

    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>

    <div class="flex gap-3">
      <UiButton variant="outline" class="flex-1" @click="$emit('back')">返回</UiButton>
      <UiButton variant="primary" class="flex-1" :disabled="isSubmitting" @click="submit">
        {{ isSubmitting ? '報名中...' : '確認報名' }}
      </UiButton>
    </div>
  </div>
</template>
