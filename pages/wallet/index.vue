<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Wallet, Ticket, ChevronDown } from 'lucide-vue-next'
import type { Activity, Registration } from '~/types'

interface RedemptionCardEntry {
  activity: Activity
  registration: Registration
}

const { profile } = useAuth()
const { myRegistrations } = useRegistrations()
const { getById } = useActivities()

const redemptionCards = ref<RedemptionCardEntry[]>([])
const isLoadingCards = ref(true)

async function loadRedemptionCards() {
  isLoadingCards.value = true
  try {
    const regs = await myRegistrations()
    const resolved = await Promise.all(
      regs.map(async (registration): Promise<RedemptionCardEntry | null> => {
        const activity = await getById(registration.activityId)
        return activity ? { activity, registration } : null
      })
    )
    redemptionCards.value = resolved
      .filter((entry): entry is RedemptionCardEntry => !!entry)
      .sort((a, b) => a.activity.date.localeCompare(b.activity.date))
  } finally {
    isLoadingCards.value = false
  }
}

onMounted(loadRedemptionCards)
watch(profile, loadRedemptionCards)

const PREVIEW_COUNT = 2
const balance = 850

const topUpHistory = [
  { id: 't1', label: 'LINE Pay 儲值', amount: '+1,000', date: '2026-08-10' },
  { id: 't2', label: '現金儲值', amount: '+500', date: '2026-07-28' },
  { id: 't3', label: 'LINE Pay 儲值', amount: '+2,000', date: '2026-07-15' },
  { id: 't4', label: '現金儲值', amount: '+300', date: '2026-06-30' }
]

const deductionHistory = [
  { id: 'd1', label: '夜間羽球激戰 報名扣款', amount: '-150', date: '2026-08-14' },
  { id: 'd2', label: '排球交流之夜 報名扣款', amount: '-200', date: '2026-08-05' },
  { id: 'd3', label: '半馬備賽團練 報名扣款', amount: '-300', date: '2026-07-20' },
  { id: 'd4', label: '羽球新手友誼賽 報名扣款', amount: '-150', date: '2026-07-10' },
  { id: 'd5', label: '排球錦標賽 8 強 報名扣款', amount: '-250', date: '2026-06-22' }
]

const CARD_PREVIEW_COUNT = 1
const showAllCards = ref(false)
const visibleCards = computed(() =>
  showAllCards.value ? redemptionCards.value : redemptionCards.value.slice(0, CARD_PREVIEW_COUNT)
)

const showAllTopUp = ref(false)
const showAllDeduction = ref(false)

const visibleTopUp = computed(() => (showAllTopUp.value ? topUpHistory : topUpHistory.slice(0, PREVIEW_COUNT)))
const visibleDeduction = computed(() =>
  showAllDeduction.value ? deductionHistory : deductionHistory.slice(0, PREVIEW_COUNT)
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="metallic-border flex items-center justify-between bg-obsidian-800 p-5">
      <div>
        <p class="text-xs text-titanium/50">儲值餘額</p>
        <p class="font-display text-2xl font-bold text-gold-light">${{ balance.toLocaleString() }}</p>
      </div>
      <Wallet class="h-8 w-8 text-gold/60" />
    </div>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">活動核銷卡</h2>
      <p v-if="isLoadingCards" class="py-4 text-center text-xs text-titanium/40">載入中...</p>
      <template v-else-if="redemptionCards.length">
        <div class="flex flex-col gap-3">
          <WalletRedemptionCard
            v-for="c in visibleCards"
            :key="c.registration.id"
            :activity="c.activity"
            :registration="c.registration"
          />
        </div>
        <button
          v-if="redemptionCards.length > CARD_PREVIEW_COUNT"
          type="button"
          class="flex items-center justify-center gap-1 py-1 text-xs text-titanium/50 transition-colors hover:text-titanium-light"
          @click="showAllCards = !showAllCards"
        >
          {{ showAllCards ? '收合' : `顯示更多（${redemptionCards.length - CARD_PREVIEW_COUNT}）` }}
          <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="showAllCards && 'rotate-180'" />
        </button>
      </template>
      <CommonPlaceholderCard v-else :icon="Ticket" title="尚無核銷卡">
        <p class="text-xs text-titanium/50">報名活動後，核銷卡會顯示在這裡，供主辦現場核銷。</p>
      </CommonPlaceholderCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">儲值紀錄</h2>
      <CommonSkeletonListItem
        v-for="t in visibleTopUp"
        :key="t.id"
        :title="t.label"
        :subtitle="t.date"
        :meta="t.amount"
      />
      <button
        v-if="topUpHistory.length > PREVIEW_COUNT"
        type="button"
        class="flex items-center justify-center gap-1 py-1 text-xs text-titanium/50 transition-colors hover:text-titanium-light"
        @click="showAllTopUp = !showAllTopUp"
      >
        {{ showAllTopUp ? '收合' : `顯示更多（${topUpHistory.length - PREVIEW_COUNT}）` }}
        <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="showAllTopUp && 'rotate-180'" />
      </button>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">扣款紀錄</h2>
      <CommonSkeletonListItem
        v-for="d in visibleDeduction"
        :key="d.id"
        :title="d.label"
        :subtitle="d.date"
        :meta="d.amount"
      />
      <button
        v-if="deductionHistory.length > PREVIEW_COUNT"
        type="button"
        class="flex items-center justify-center gap-1 py-1 text-xs text-titanium/50 transition-colors hover:text-titanium-light"
        @click="showAllDeduction = !showAllDeduction"
      >
        {{ showAllDeduction ? '收合' : `顯示更多（${deductionHistory.length - PREVIEW_COUNT}）` }}
        <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="showAllDeduction && 'rotate-180'" />
      </button>
    </section>
  </div>
</template>
