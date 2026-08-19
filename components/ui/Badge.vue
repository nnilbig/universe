<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-obsidian-700 text-titanium',
      gold: 'bg-gold/15 text-gold-light',
      danger: 'bg-red-500/15 text-red-300'
    }
  },
  defaultVariants: { variant: 'neutral' }
})

type BadgeVariants = VariantProps<typeof badgeVariants>

withDefaults(defineProps<{ variant?: BadgeVariants['variant'] }>(), { variant: 'neutral' })
</script>

<template>
  <span :class="cn(badgeVariants({ variant }))">
    <slot />
  </span>
</template>
