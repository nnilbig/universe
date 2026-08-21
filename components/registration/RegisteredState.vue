<script setup lang="ts">
import { ref } from 'vue'
import type { Registration } from '~/types'

const props = defineProps<{ activityId: string; registration: Registration }>()
const emit = defineEmits<{ cancelled: [] }>()

const { cancel } = useRegistrations()
const error = ref('')
const isSubmitting = ref(false)

async function onCancelClick() {
  error.value = ''
  isSubmitting.value = true
  try {
    await cancel(props.activityId, props.registration.id)
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
    <p class="text-sm font-medium text-gold-light">你 報名成功</p>

    <div class="mt-3 flex gap-2">
      <NuxtLink
        to="/wallet"
        class="inline-flex h-8 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-titanium/30 px-3 text-xs font-medium text-titanium-light transition-colors hover:border-gold/60"
      >
        查看入場通行證
      </NuxtLink>
      <UiButton variant="danger" size="sm" class="flex-1" :disabled="isSubmitting" @click="onCancelClick">
        {{ isSubmitting ? '處理中...' : '取消報名' }}
      </UiButton>
    </div>
    <p v-if="error" class="mt-2 text-xs text-red-400">{{ error }}</p>
  </div>
</template>
