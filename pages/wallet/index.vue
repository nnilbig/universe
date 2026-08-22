<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Wallet, Ticket, ChevronDown } from 'lucide-vue-next'
import type { Activity, Registration, WalletTransaction } from '~/types'
import { formatTransactionDate } from '~/lib/format'

interface RedemptionCardEntry {
  activity: Activity
  registration: Registration
}

const { profile } = useAuth()
const { myRegistrations } = useRegistrations()
const { getById } = useActivities()
const { listTransactions } = useWallet()

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
// 0 for guests; once logged in, reads the account's own stored balance (profiles.wallet_balance).
const balance = computed(() => profile.value?.walletBalance ?? 0)

const transactions = ref<WalletTransaction[]>([])
const isLoadingTransactions = ref(true)

async function loadTransactions() {
  isLoadingTransactions.value = true
  try {
    transactions.value = profile.value ? await listTransactions(profile.value.id) : []
  } finally {
    isLoadingTransactions.value = false
  }
}

onMounted(loadTransactions)
watch(profile, loadTransactions)

function methodLabel(method: WalletTransaction['method']): string {
  return method === 'linepay' ? 'LINE Pay' : '現金'
}

function formatAmount(amount: number): string {
  return `${amount >= 0 ? '+' : ''}${amount.toLocaleString()}`
}

// wallet_transactions has no free-text reason — positive rows are top-ups (labelled by method),
// negative rows are admin balance corrections since registration doesn't debit the wallet yet.
const topUpHistory = computed(() =>
  transactions.value
    .filter((t) => t.amount > 0)
    .map((t) => ({ id: t.id, label: `${methodLabel(t.method)} 儲值`, amount: formatAmount(t.amount), date: formatTransactionDate(t.createdAt) }))
)

const deductionHistory = computed(() =>
  transactions.value
    .filter((t) => t.amount < 0)
    .map((t) => ({ id: t.id, label: '餘額調整', amount: formatAmount(t.amount), date: formatTransactionDate(t.createdAt) }))
)

const CARD_PREVIEW_COUNT = 1
const showAllCards = ref(false)
const visibleCards = computed(() =>
  showAllCards.value ? redemptionCards.value : redemptionCards.value.slice(0, CARD_PREVIEW_COUNT)
)

const showAllTopUp = ref(false)
const showAllDeduction = ref(false)

const visibleTopUp = computed(() =>
  showAllTopUp.value ? topUpHistory.value : topUpHistory.value.slice(0, PREVIEW_COUNT)
)
const visibleDeduction = computed(() =>
  showAllDeduction.value ? deductionHistory.value : deductionHistory.value.slice(0, PREVIEW_COUNT)
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="metallic-border flex items-center justify-between bg-obsidian-800 p-5">
      <div>
        <p class="text-xs text-titanium/50">錢包餘額</p>
        <p class="font-display text-2xl font-bold text-gold-light">${{ balance.toLocaleString() }}</p>
      </div>
      <Wallet class="h-8 w-8 text-gold/60" />
    </div>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">入場通行證</h2>
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
      <CommonPlaceholderCard v-else :icon="Ticket" title="尚無入場通行證">
        <p class="text-xs text-titanium/50">報名活動後，入場通行證會顯示在這裡，供主辦現場核銷。</p>
      </CommonPlaceholderCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-base font-semibold text-titanium-light">儲值紀錄</h2>
      <p v-if="isLoadingTransactions" class="py-4 text-center text-xs text-titanium/40">載入中...</p>
      <p v-else-if="!topUpHistory.length" class="py-4 text-center text-xs text-titanium/40">尚無儲值紀錄</p>
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
      <p v-if="isLoadingTransactions" class="py-4 text-center text-xs text-titanium/40">載入中...</p>
      <p v-else-if="!deductionHistory.length" class="py-4 text-center text-xs text-titanium/40">尚無扣款紀錄</p>
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
