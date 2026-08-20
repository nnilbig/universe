<script setup lang="ts">
import { ref, computed } from 'vue'
import { cn } from '~/lib/utils'

const seasons = [
  { code: '2026', label: '2026 卡牌賽' },
  { code: '2025', label: '2025 夏季賽' },
  { code: '2024', label: '2024 年終賽' }
]

interface RankingTable {
  no: number
  members: string[]
}

// Hardcoded for now — replace with real per-season table standings once available.
const tablesBySeason: Record<string, RankingTable[]> = {
  '2026': [
    { no: 1, members: ['喬', 'TonyH', '韶恩'] },
    { no: 2, members: ['Bat', '祈翰', '俞民'] },
    { no: 3, members: ['扯翔', '學承', 'eden'] },
    { no: 4, members: ['儒', '承', '容'] }
  ],
  '2025': [
    { no: 1, members: ['Ting', '喬', '儒', '扯翔'] },
    { no: 2, members: ['霞', '孟', '小健', '覺深'] },
    { no: 3, members: ['嘉偉', 'eden', '承', '雞佛'] },
    { no: 4, members: ['博', '安', '容', '祈翰'] }
  ],
  '2024': [
    { no: 1, members: ['博', '安', '承'] },
    { no: 2, members: ['家緯', '扯翔', '咖咖'] },
    { no: 3, members: ['eden', '祈翰', '儒'] },
    { no: 4, members: ['孟翰', '嘉偉', '雞佛'] }
  ]
}

const selectedSeason = ref('2026')
const tables = computed(() => tablesBySeason[selectedSeason.value] ?? [])

const openTableNo = ref<number | null>(null)
const openTable = computed(() => tables.value.find((t) => t.no === openTableNo.value) ?? null)
const tableSheetOpen = computed({
  get: () => openTableNo.value !== null,
  set: (val: boolean) => {
    if (!val) openTableNo.value = null
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <section class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">歷屆賽事</h2>

      <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          v-for="s in seasons"
          :key="s.code"
          type="button"
          :class="
            cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
              selectedSeason === s.code
                ? 'border-gold/60 bg-gold/10 text-gold-light'
                : 'border-titanium/15 text-titanium/60 hover:border-titanium/30'
            )
          "
          @click="selectedSeason = s.code"
        >
          {{ s.label }}
        </button>
      </div>

      <div class="metallic-border flex flex-col divide-y divide-titanium/10 bg-obsidian-800">
        <button
          v-for="t in tables"
          :key="t.no"
          type="button"
          class="flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-obsidian-700"
          @click="openTableNo = t.no"
        >
          <div class="flex -space-x-2">
            <UiAvatar v-for="m in t.members" :key="m" :name="m" size="sm" ringed />
          </div>
          <span class="flex-1 truncate text-sm text-titanium/70">{{ t.members.join('、') }}</span>
        </button>
      </div>
    </section>

    <p class="text-xs text-titanium/40">歷屆賽事排行榜。</p>

    <UiSheet v-model:open="tableSheetOpen" title="成員">
      <div v-if="openTable" class="flex flex-col gap-3">
        <div
          v-for="m in openTable.members"
          :key="m"
          class="flex items-center gap-3 rounded-lg border border-titanium/10 bg-obsidian-900 px-3 py-2.5"
        >
          <UiAvatar :name="m" size="sm" />
          <span class="text-sm text-titanium-light">{{ m }}</span>
        </div>
      </div>
    </UiSheet>
  </div>
</template>
