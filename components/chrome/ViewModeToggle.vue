<script setup lang="ts">
import { cn } from '~/lib/utils'

const { viewMode, canToggleViewMode, toggleViewMode } = useAuth()

// Only two states exist, so switching to the inactive segment is always just a toggle.
function selectMode(mode: 'player' | 'edit') {
  if (mode !== viewMode.value) toggleViewMode()
}
</script>

<template>
  <div v-if="canToggleViewMode" class="flex items-center gap-1.5 text-[11px] font-medium">
    <button
      type="button"
      :class="
        cn(
          'rounded-full border px-2.5 py-1 transition-colors',
          viewMode === 'player'
            ? 'border-titanium/40 bg-obsidian-800 text-titanium-light'
            : 'border-titanium/15 text-titanium/50 hover:border-titanium/30 hover:text-titanium/70'
        )
      "
      @click="selectMode('player')"
    >
      球員
    </button>
    <button
      type="button"
      :class="
        cn(
          'rounded-full border px-2.5 py-1 transition-colors',
          viewMode === 'edit'
            ? 'border-gold/60 bg-gold/10 text-gold-light'
            : 'border-titanium/15 text-titanium/50 hover:border-titanium/30 hover:text-titanium/70'
        )
      "
      @click="selectMode('edit')"
    >
      管理員
    </button>
  </div>
  <UiBadge v-else variant="neutral">球員</UiBadge>
</template>
