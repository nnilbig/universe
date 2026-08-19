<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const { viewMode, canToggleViewMode, toggleViewMode } = useAuth()
</script>

<template>
  <button
    v-if="canToggleViewMode"
    type="button"
    :class="
      cn(
        'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        viewMode === 'edit'
          ? 'border-gold/60 bg-gold/10 text-gold-light'
          : 'border-titanium/20 text-titanium/60 hover:border-titanium/40'
      )
    "
    @click="toggleViewMode"
  >
    <ShieldCheck class="h-3.5 w-3.5" />
    {{ viewMode === 'edit' ? '編輯模式' : '切換身分' }}
  </button>
</template>
