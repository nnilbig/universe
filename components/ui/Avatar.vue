<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
    ringed?: boolean
  }>(),
  { size: 'sm', ringed: false }
)

const sizeClass = computed(
  () =>
    ({
      xs: 'h-6 w-6 text-[10px]',
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-14 w-14 text-base'
    })[props.size]
)

const initials = computed(() => (props.name ?? '?').trim().slice(0, 1).toUpperCase())
</script>

<template>
  <div
    :class="
      cn(
        'relative flex shrink-0 items-center justify-center rounded-full bg-obsidian-700 font-semibold text-titanium-light overflow-hidden',
        sizeClass,
        ringed && 'ring-2 ring-obsidian-950'
      )
    "
  >
    <img v-if="src" :src="src" :alt="name" class="h-full w-full object-cover" />
    <span v-else>{{ initials }}</span>
  </div>
</template>
