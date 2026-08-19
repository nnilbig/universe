<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
  {
    variants: {
      variant: {
        primary: 'bg-gold-gradient text-obsidian-950 font-semibold hover:brightness-110',
        secondary: 'bg-obsidian-700 text-titanium-light hover:bg-obsidian-700/70',
        ghost: 'bg-transparent text-titanium hover:text-titanium-light',
        outline: 'border border-titanium/30 text-titanium-light hover:border-gold/60',
        danger: 'border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base'
      }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', type: 'button' }
)
</script>

<template>
  <button :type="type" :class="cn(buttonVariants({ variant, size }))">
    <slot />
  </button>
</template>
