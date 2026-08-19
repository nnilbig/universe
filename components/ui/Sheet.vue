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
        enter-active-class="transition-transform duration-250 ease-out"
        enter-from-class="translate-y-full"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="translate-y-full"
      >
        <DialogContent
          v-if="open"
          class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-titanium/10 bg-obsidian-900 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] focus:outline-none"
        >
          <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-titanium/30" />
          <DialogTitle :class="cn('mb-4 font-display text-lg font-semibold text-titanium-light', !title && 'sr-only')">
            {{ title ?? '活動詳細內容' }}
          </DialogTitle>
          <DialogDescription class="sr-only">{{ description ?? '活動詳細內容與報名選項' }}</DialogDescription>
          <slot />
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
