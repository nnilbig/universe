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

// 0 for guests; once logged in, reads the account's own stored balance (profiles.wallet_balance).
const balance = computed(() => profile.value?.walletBalance ?? 0)

const CARD_PREVIEW_COUNT = 1
const showAllCards = ref(false)
const visibleCards = computed(() =>
  showAllCards.value ? redemptionCards.value : redemptionCards.value.slice(0, CARD_PREVIEW_COUNT)
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
  </div>
</template>
