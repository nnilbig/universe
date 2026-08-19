<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{ length?: number }>(), { length: 4 })
const model = defineModel<string>({ default: '' })

const digits = ref<string[]>(Array.from({ length: props.length }, (_, i) => model.value[i] ?? ''))
const inputRefs = ref<(HTMLInputElement | null)[]>([])

watch(
  () => model.value,
  (val) => {
    const next = Array.from({ length: props.length }, (_, i) => val[i] ?? '')
    if (next.join('') !== digits.value.join('')) digits.value = next
  }
)

function syncModel() {
  model.value = digits.value.join('')
}

function onInput(index: number, e: Event) {
  const target = e.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '').slice(-1)
  digits.value[index] = value
  target.value = value
  syncModel()
  if (value && index < props.length - 1) {
    nextTick(() => inputRefs.value[index + 1]?.focus())
  }
}

function onKeydown(index: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[index] && index > 0) {
    e.preventDefault()
    digits.value[index - 1] = ''
    syncModel()
    nextTick(() => inputRefs.value[index - 1]?.focus())
  }
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? ''
  const clean = text.replace(/\D/g, '').slice(0, props.length)
  if (!clean) return
  e.preventDefault()
  digits.value = Array.from({ length: props.length }, (_, i) => clean[i] ?? '')
  syncModel()
  nextTick(() => {
    const lastIndex = Math.min(clean.length, props.length - 1)
    inputRefs.value[lastIndex]?.focus()
  })
}
</script>

<template>
  <div class="flex gap-2">
    <input
      v-for="(_, i) in length"
      :key="i"
      :ref="(el) => (inputRefs[i] = el as HTMLInputElement)"
      :value="digits[i]"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      :class="
        cn(
          'h-12 w-12 rounded-lg border border-titanium/20 bg-obsidian-900 text-center text-lg font-semibold text-titanium-light outline-none transition-colors focus:border-gold/60'
        )
      "
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste"
    />
  </div>
</template>
