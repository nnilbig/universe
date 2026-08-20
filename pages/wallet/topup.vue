<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { Profile, TopUpMethod } from '~/types'

const { canToggleViewMode } = useAuth()
const { listMembers, applyTopUps } = useWallet()

const members = ref<Profile[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// Expanded by default — members are already sorted subscriber-first (see wallet.mock/live's
// ROLE_PRIORITY), so the preview naturally surfaces them first. Only once the roster is longer
// than one screenful does a "顯示更多" toggle appear, matching the pattern used elsewhere on the
// wallet page (儲值紀錄/扣款紀錄 previews).
const PREVIEW_COUNT = 6
const showAll = ref(false)
const visibleMembers = computed(() => (showAll.value ? members.value : members.value.slice(0, PREVIEW_COUNT)))

interface Draft {
  method: TopUpMethod
  amount: string
}
const drafts = reactive<Record<string, Draft>>({})

async function load() {
  isLoading.value = true
  loadError.value = null
  try {
    members.value = await listMembers()
    // Every row's method/amount fields are visible up front (no per-row expand), so the draft
    // must exist before the list ever renders, not lazily on first interaction.
    for (const m of members.value) {
      if (!drafts[m.id]) drafts[m.id] = { method: 'cash', amount: '' }
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : '成員清單載入失敗'
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const pendingEntries = computed(() =>
  Object.entries(drafts)
    .filter(([, d]) => Number(d.amount) > 0)
    .map(([profileId, d]) => ({ profileId, amount: Math.round(Number(d.amount)), method: d.method }))
)

const roleLabel: Record<string, string> = { subscriber: '訂閱', player: '一般', admin: '管理員', owner: 'Owner' }

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

async function submit() {
  if (!pendingEntries.value.length) return
  isSubmitting.value = true
  submitError.value = null
  try {
    await applyTopUps(pendingEntries.value)
    for (const key of Object.keys(drafts)) drafts[key].amount = ''
    await load()
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : '儲值失敗，請再試一次'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <CommonPlaceholderCard v-if="!canToggleViewMode" title="沒有權限" description="僅管理員／Owner 可使用儲值管理。" />

    <template v-else>
      <h2 class="font-display text-base font-semibold text-titanium-light">儲值管理</h2>

      <p v-if="isLoading" class="py-10 text-center text-sm text-titanium/50">載入中...</p>
      <p v-else-if="loadError" class="text-xs text-red-300">{{ loadError }}</p>

      <template v-else>
        <p v-if="!members.length" class="py-6 text-center text-xs text-titanium/40">目前沒有成員資料。</p>

        <template v-else>
          <div class="metallic-border flex flex-col divide-y divide-titanium/10 bg-obsidian-800">
            <div v-for="m in visibleMembers" :key="m.id" class="flex flex-wrap items-center gap-2 px-4 py-3">
              <UiAvatar :name="m.displayName" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-titanium-light">{{ m.displayName }}</p>
                <p class="text-[11px] text-titanium/40">
                  {{ roleLabel[m.role] ?? m.role }} · 餘額 ${{ m.walletBalance.toLocaleString() }}
                </p>
              </div>
              <div class="flex shrink-0 gap-1.5">
                <button
                  v-for="opt in (['linepay', 'cash'] as const)"
                  :key="opt"
                  type="button"
                  :class="[
                    'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    drafts[m.id]?.method === opt
                      ? 'border-gold/60 bg-gold/10 text-gold-light'
                      : 'border-titanium/20 text-titanium/60 hover:border-titanium/40'
                  ]"
                  @click="drafts[m.id].method = opt"
                >
                  {{ opt === 'linepay' ? 'LINE Pay' : '現金' }}
                </button>
              </div>
              <UiInput
                v-model="drafts[m.id].amount"
                type="number"
                inputmode="numeric"
                placeholder="金額"
                class="w-20 shrink-0 text-right"
              />
            </div>
          </div>

          <button
            v-if="members.length > PREVIEW_COUNT"
            type="button"
            class="flex items-center justify-center gap-1 py-1 text-xs text-titanium/50 transition-colors hover:text-titanium-light"
            @click="showAll = !showAll"
          >
            {{ showAll ? '收合' : `顯示更多（${members.length - PREVIEW_COUNT}）` }}
            <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="showAll && 'rotate-180'" />
          </button>
        </template>
      </template>

      <p v-if="submitError" class="text-xs text-red-300">{{ submitError }}</p>

      <UiButton :disabled="!pendingEntries.length || isSubmitting" @click="submit">
        {{ isSubmitting ? '送出中...' : `送出（${pendingEntries.length} 筆）` }}
      </UiButton>
    </template>
  </div>
</template>
