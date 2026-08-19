<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import { cn } from '~/lib/utils'

defineProps<{ title?: string; description?: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <DialogOverlay v-if="open" class="fixed inset-0 z-40 bg-obsidian-950/70 backdrop-blur-sm" />
      </Transition>
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition-all duration-150 ease-in"
        leave-to-class="opacity-0 scale-95"
      >
        <DialogContent
          v-if="open"
          class="metallic-border fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-card bg-obsidian-800 p-5 focus:outline-none"
        >
          <DialogTitle :class="cn('mb-3 font-display text-lg font-semibold text-titanium-light', !title && 'sr-only')">
            {{ title ?? '確認' }}
          </DialogTitle>
          <DialogDescription class="sr-only">{{ description ?? '確認對話框' }}</DialogDescription>
          <slot />
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
