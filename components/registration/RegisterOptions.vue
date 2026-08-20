<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ activityId: string }>()
// 'registering' fires synchronously before any await, so the parent can keep this component
// mounted for the whole async round-trip — otherwise the registrant-list update (reactive) races
// ahead, swaps the parent to its "already registered" branch, and unmounts us before we can emit.
const emit = defineEmits<{ registering: []; registered: [registrationIds: string[]] }>()

type Mode = 'options' | 'guest'
const mode = ref<Mode>('options')
const showConsent = ref(false)

const { isAuthenticated, bindLineAccount } = useAuth()
const { registerWithLine } = useRegistrations()

async function onConsentConfirmed() {
  showConsent.value = false
  emit('registering')
  await bindLineAccount()
  const reg = await registerWithLine(props.activityId)
  emit('registered', [reg.id])
}

async function onDirectRegister() {
  emit('registering')
  const reg = await registerWithLine(props.activityId)
  emit('registered', [reg.id])
}

function onGuestSubmitting() {
  emit('registering')
}

function onGuestRegistered(registrationIds: string[]) {
  emit('registered', registrationIds)
}
</script>

<template>
  <div v-if="mode === 'options' && isAuthenticated" class="flex flex-col gap-3">
    <UiButton variant="primary" size="lg" @click="onDirectRegister">我要報名</UiButton>
  </div>
  <div v-else-if="mode === 'options'" class="flex flex-col gap-3">
    <UiButton variant="primary" size="lg" @click="showConsent = true">快速登入報名</UiButton>
    <UiButton variant="outline" size="lg" @click="mode = 'guest'">訪客報名</UiButton>
  </div>

  <RegistrationGuestRegisterForm
    v-else-if="mode === 'guest'"
    :activity-id="activityId"
    @submitting="onGuestSubmitting"
    @registered="onGuestRegistered"
    @back="mode = 'options'"
  />

  <UiDialog v-model:open="showConsent" title="綁定 LINE 帳號">
    <RegistrationQuickLoginConsent @confirm="onConsentConfirmed" @cancel="showConsent = false" />
  </UiDialog>
</template>
