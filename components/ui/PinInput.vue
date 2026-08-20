<script setup lang="ts">
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{ length?: number }>(), { length: 4 })
const model = defineModel<string>({ default: '' })

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '').slice(0, props.length)
  target.value = value
  model.value = value
}
</script>

<template>
  <input
    :value="model"
    type="text"
    inputmode="numeric"
    autocomplete="one-time-code"
    :maxlength="length"
    :class="
      cn(
        'h-12 w-full max-w-32 rounded-lg border border-titanium/20 bg-obsidian-900 text-center text-lg font-semibold tracking-[0.5em] text-titanium-light outline-none transition-colors focus:border-gold/60'
      )
    "
    @input="onInput"
  />
</template>
