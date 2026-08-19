<script setup lang="ts">
import { ref } from 'vue'
import type { Registration } from '~/types'

const props = defineProps<{ activityId: string; registration: Registration }>()
const emit = defineEmits<{ cancelled: [] }>()

const { cancel } = useRegistrations()
const confirmingCancel = ref(false)
const pin = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function doCancel() {
  error.value = ''
  if (props.registration.kind === 'guest' && !/^\d{4}$/.test(pin.value)) {
    error.value = '請輸入 4 位數 PIN 碼'
    return
  }
  isSubmitting.value = true
  try {
    await cancel(
      props.activityId,
      props.registration.id,
      props.registration.kind === 'guest' ? pin.value : undefined
    )
    confirmingCancel.value = false
    pin.value = ''
    emit('cancelled')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '取消失敗'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="rounded-card border border-gold/30 bg-gold/5 p-4">
    <p class="text-sm font-medium text-gold-light">
      {{ registration.kind === 'guest' ? registration.nickname : '你' }}已報名此活動
    </p>

    <template v-if="!confirmingCancel">
      <div class="mt-3 flex gap-2">
        <NuxtLink
          to="/wallet"
          class="inline-flex h-8 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-titanium/30 px-3 text-xs font-medium text-titanium-light transition-colors hover:border-gold/60"
        >
          查看核銷卡
        </NuxtLink>
        <UiButton variant="danger" size="sm" class="flex-1" @click="confirmingCancel = true">取消報名</UiButton>
      </div>
    </template>
    <template v-else>
      <div class="mt-3 flex flex-col gap-2">
        <template v-if="registration.kind === 'guest'">
          <label class="text-xs text-titanium/50">輸入 4 位數 PIN 碼以取消</label>
          <UiPinInput v-model="pin" />
        </template>
        <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
        <div class="flex gap-2">
          <UiButton variant="outline" size="sm" class="flex-1" @click="confirmingCancel = false">返回</UiButton>
          <UiButton variant="danger" size="sm" class="flex-1" :disabled="isSubmitting" @click="doCancel">
            {{ isSubmitting ? '處理中...' : '確認取消' }}
          </UiButton>
        </div>
      </div>
    </template>
  </div>
</template>
