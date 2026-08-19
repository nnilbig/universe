<script setup lang="ts">
import { ref, computed } from 'vue'
import { cn } from '~/lib/utils'

const seasons = [
  { code: '2026', label: '2026 卡牌賽' },
  { code: '2025', label: '2025 夏季賽' },
  { code: '2024', label: '2024 年終賽' }
]

const rankingsBySeason: Record<string, { rank: number; name: string; score: number }[]> = {
  '2026': [
    { rank: 1, name: '阿翔教練', score: 2450 },
    { rank: 2, name: '小柔', score: 2310 },
    { rank: 3, name: '阿哲', score: 2180 },
    { rank: 4, name: '小美', score: 1990 }
  ],
  '2025': [
    { rank: 1, name: '小柔', score: 2390 },
    { rank: 2, name: '阿翔教練', score: 2250 },
    { rank: 3, name: '小美', score: 2100 },
    { rank: 4, name: '阿凱', score: 1950 }
  ],
  '2024': [
    { rank: 1, name: '阿凱', score: 2200 },
    { rank: 2, name: '阿哲', score: 2150 },
    { rank: 3, name: '阿翔教練', score: 2080 },
    { rank: 4, name: '小柔', score: 1900 }
  ]
}

const selectedSeason = ref('2026')
const currentRankings = computed(() => rankingsBySeason[selectedSeason.value] ?? [])

function medalColor(rank: number) {
  if (rank === 1) return 'text-gold-light'
  if (rank === 2) return 'text-titanium-light'
  if (rank === 3) return 'text-gold-dark'
  return 'text-titanium/50'
}
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
        <div v-for="r in currentRankings" :key="r.rank" class="flex items-center gap-3 px-4 py-3">
          <span :class="['w-10 shrink-0 font-display text-sm font-bold', medalColor(r.rank)]">No.{{ r.rank }}</span>
          <UiAvatar :name="r.name" size="sm" />
          <span class="flex-1 text-sm text-titanium-light">{{ r.name }}</span>
          <span class="text-sm text-gold-light">{{ r.score.toLocaleString() }}</span>
        </div>
      </div>
    </section>

    <p class="text-xs text-titanium/40">排名資料為示意內容，正式賽制上線後將顯示即時排名。</p>
  </div>
</template>
