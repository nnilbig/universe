<script setup lang="ts">
import { cn } from '~/lib/utils'

const { viewMode, canToggleViewMode, toggleViewMode } = useAuth()

// Only two states exist, so switching to the inactive segment is always just a toggle.
function selectMode(mode: 'player' | 'edit') {
  if (mode !== viewMode.value) toggleViewMode()
}
</script>

<template>
  <div
    v-if="canToggleViewMode"
    class="flex items-center rounded-full border border-titanium/20 bg-obsidian-800 p-0.5 text-[11px] font-medium"
  >
    <button
      type="button"
      :class="
        cn(
          'rounded-full px-2.5 py-1 transition-colors',
          viewMode === 'player' ? 'bg-titanium/15 text-titanium-light' : 'text-titanium/50 hover:text-titanium/70'
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
          'rounded-full px-2.5 py-1 transition-colors',
          viewMode === 'edit' ? 'bg-gold/15 text-gold-light' : 'text-titanium/50 hover:text-titanium/70'
        )
      "
      @click="selectMode('edit')"
    >
      管理員
    </button>
  </div>
  <UiBadge v-else variant="neutral">球員</UiBadge>
</template>
