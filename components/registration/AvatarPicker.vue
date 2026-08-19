<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ registrationIds: string[] }>()
const emit = defineEmits<{ done: [] }>()

const { setAvatar } = useRegistrations()
const previewUrl = ref('')
const isSaving = ref(false)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  previewUrl.value = URL.createObjectURL(file)
}

async function save() {
  if (!previewUrl.value) return
  isSaving.value = true
  try {
    await Promise.all(props.registrationIds.map((id) => setAvatar(id, previewUrl.value)))
  } finally {
    isSaving.value = false
    emit('done')
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-2 text-center">
    <p class="text-sm text-titanium-light">報名成功！要順便設定頭像嗎？</p>
    <label class="cursor-pointer">
      <UiAvatar :src="previewUrl" name="?" size="lg" />
      <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
    </label>
    <div class="flex w-full gap-3">
      <UiButton variant="outline" class="flex-1" @click="emit('done')">略過</UiButton>
      <UiButton variant="primary" class="flex-1" :disabled="!previewUrl || isSaving" @click="save">
        {{ isSaving ? '儲存中...' : '儲存頭像' }}
      </UiButton>
    </div>
  </div>
</template>
