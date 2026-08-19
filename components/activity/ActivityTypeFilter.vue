<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

const { sportTypes, loadFeed } = useActivities()
const uiStore = useUiStore()

const chips = computed(() => [{ code: 'all', labelZh: '全部' }, ...sportTypes.value])

async function select(code: string) {
  uiStore.setSportTypeFilter(code)
  await loadFeed(code)
}
</script>

<template>
  <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
    <button
      v-for="chip in chips"
      :key="chip.code"
      type="button"
      :class="
        cn(
          'shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
          uiStore.selectedSportTypeCode === chip.code
            ? 'border-gold/60 bg-gold/10 text-gold-light'
            : 'border-titanium/15 text-titanium/60 hover:border-titanium/30'
        )
      "
      @click="select(chip.code)"
    >
      {{ chip.labelZh }}
    </button>
  </div>
</template>
