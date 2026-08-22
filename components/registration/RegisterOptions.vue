<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ activityId: string }>()
// 'registering' fires synchronously before any await, so the parent can keep this component
// mounted for the whole async round-trip — otherwise the registrant-list update (reactive) races
// ahead, swaps the parent to its "already registered" branch, and unmounts us before we can emit.
const emit = defineEmits<{
  registering: []
  registered: [registrationIds: string[], skipAvatarStep?: boolean]
}>()

type Mode = 'options' | 'solo-nickname' | 'group'
const mode = ref<Mode>('options')

const { isAuthenticated } = useAuth()
const { registerWithLine, registerAsGuest } = useRegistrations()
const guestNames = useGuestNames()

const soloNickname = ref('')
const soloError = ref('')
const isSubmittingSolo = ref(false)

// Already-authenticated members already have a LINE avatar on file — skip the post-registration
// avatar prompt that fresh guests (no photo yet) still see.
async function onDirectRegister() {
  if (isAuthenticated.value) {
    emit('registering')
    const reg = await registerWithLine(props.activityId)
    emit('registered', [reg.id], true)
    return
  }

  // A device that has registered as a guest before already has a nickname to reuse — skip asking.
  const recent = guestNames.mostRecent()
  if (recent) {
    emit('registering')
    const [reg] = await registerAsGuest({ activityId: props.activityId, members: [{ nickname: recent }] })
    emit('registered', [reg.id])
    return
  }

  // First-time guest on this device — need a nickname before we can register them.
  mode.value = 'solo-nickname'
}

async function submitSoloNickname() {
  soloError.value = ''
  const name = soloNickname.value.trim()
  if (!name || name.length > 4) {
    soloError.value = '請輸入 1-4 個字的暱稱'
    return
  }
  isSubmittingSolo.value = true
  emit('registering')
  try {
    const [reg] = await registerAsGuest({ activityId: props.activityId, members: [{ nickname: name }] })
    guestNames.remember(name)
    emit('registered', [reg.id])
  } catch (e) {
    soloError.value = e instanceof Error ? e.message : '報名失敗，請再試一次'
  } finally {
    isSubmittingSolo.value = false
  }
}

function onGroupSubmitting() {
  emit('registering')
}

function onGroupRegistered(registrationIds: string[], skipAvatarStep?: boolean) {
  emit('registered', registrationIds, skipAvatarStep)
}
</script>

<template>
  <div v-if="mode === 'options'" class="flex flex-col gap-3">
    <UiButton variant="primary" size="lg" @click="onDirectRegister">我要報名</UiButton>
    <UiButton variant="outline" size="lg" @click="mode = 'group'">團體報名</UiButton>
  </div>

  <div v-else-if="mode === 'solo-nickname'" class="flex flex-col gap-3">
    <div>
      <label class="mb-1.5 block text-xs text-titanium/50">輸入暱稱（最多 4 字）</label>
      <UiInput v-model="soloNickname" maxlength="4" placeholder="輸入暱稱" />
    </div>
    <p v-if="soloError" class="text-xs text-red-400">{{ soloError }}</p>
    <div class="flex gap-3">
      <UiButton variant="outline" class="flex-1" @click="mode = 'options'">返回</UiButton>
      <UiButton variant="primary" class="flex-1" :disabled="isSubmittingSolo" @click="submitSoloNickname">
        {{ isSubmittingSolo ? '報名中...' : '確認報名' }}
      </UiButton>
    </div>
  </div>

  <RegistrationGroupRegisterForm
    v-else-if="mode === 'group'"
    :activity-id="activityId"
    @submitting="onGroupSubmitting"
    @registered="onGroupRegistered"
    @back="mode = 'options'"
  />
</template>
