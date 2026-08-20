<script setup lang="ts">
import { cn } from '~/lib/utils'

const { viewMode, canToggleViewMode, toggleViewMode } = useAuth()
</script>

<template>
  <button
    v-if="canToggleViewMode"
    type="button"
    :class="
      cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        viewMode === 'edit'
          ? 'border-gold/60 bg-gold/10 text-gold-light'
          : 'border-titanium/15 text-titanium/50 hover:border-titanium/30 hover:text-titanium/70'
      )
    "
    @click="toggleViewMode"
  >
    管理員
  </button>
</template>
