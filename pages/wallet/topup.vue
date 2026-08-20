<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { Profile, TopUpMethod } from '~/types'

const { canToggleViewMode } = useAuth()
const { listMembers, applyTopUps } = useWallet()

const members = ref<Profile[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const openId = ref<string | null>(null)

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
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : '成員清單載入失敗'
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
  if (!drafts[id]) drafts[id] = { method: 'cash', amount: '' }
}

function draftAmount(id: string): number {
  return Number(drafts[id]?.amount) || 0
}

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
    for (const key of Object.keys(drafts)) delete drafts[key]
    openId.value = null
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
      <p v-else-if="!members.length" class="py-10 text-center text-sm text-titanium/50">目前沒有成員資料。</p>

      <div v-else class="metallic-border flex flex-col divide-y divide-titanium/10 bg-obsidian-800">
        <div v-for="m in members" :key="m.id" class="flex flex-col">
          <button
            type="button"
            class="flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-obsidian-700"
            @click="toggle(m.id)"
          >
            <UiAvatar :name="m.displayName" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-titanium-light">{{ m.displayName }}</p>
              <p class="text-[11px] text-titanium/40">
                {{ roleLabel[m.role] ?? m.role }} · 餘額 ${{ m.walletBalance.toLocaleString() }}
              </p>
            </div>
            <span v-if="draftAmount(m.id) > 0" class="shrink-0 text-xs font-medium text-gold-light">
              +{{ draftAmount(m.id).toLocaleString() }}
            </span>
            <ChevronDown
              class="h-4 w-4 shrink-0 text-titanium/40 transition-transform"
              :class="openId === m.id && 'rotate-180'"
            />
          </button>

          <div v-if="openId === m.id" class="flex items-center gap-2 px-4 pb-3 pl-14">
            <div class="flex shrink-0 gap-1.5">
              <button
                v-for="opt in (['linepay', 'cash'] as const)"
                :key="opt"
                type="button"
                :class="[
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  drafts[m.id].method === opt
                    ? 'border-gold/60 bg-gold/10 text-gold-light'
                    : 'border-titanium/20 text-titanium/60 hover:border-titanium/40'
                ]"
                @click="drafts[m.id].method = opt"
              >
                {{ opt === 'linepay' ? 'LINE Pay' : '現金' }}
              </button>
            </div>
            <UiInput v-model="drafts[m.id].amount" type="number" inputmode="numeric" placeholder="金額" class="text-right" />
          </div>
        </div>
      </div>

      <p v-if="submitError" class="text-xs text-red-300">{{ submitError }}</p>

      <UiButton :disabled="!pendingEntries.length || isSubmitting" @click="submit">
        {{ isSubmitting ? '送出中...' : `送出（${pendingEntries.length} 筆）` }}
      </UiButton>
    </template>
  </div>
</template>
