<script setup lang="ts">
import { cn } from '~/lib/utils'

defineProps<{ class?: string }>()
const model = defineModel<string>()
</script>

<template>
  <input
    v-model="model"
    :class="
      cn(
        'h-11 w-full rounded-lg border border-titanium/20 bg-obsidian-900 px-3 text-sm text-titanium-light placeholder:text-titanium/40 outline-none transition-colors focus:border-gold/60',
        $props.class
      )
    "
  />
</template>
