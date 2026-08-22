<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { MonthlyDuesEntry } from '~/types'

const { canToggleViewMode } = useAuth()
const { listMonthlyDues, addMonthlyDues, updateMonthlyDuesBalance, removeMonthlyDues } = useTeam()

const entries = ref<MonthlyDuesEntry[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function load() {
  isLoading.value = true
  loadError.value = ''
  try {
    entries.value = await listMonthlyDues()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '名單載入失敗'
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const draftName = ref('')
const draftBalance = ref('')
const canAdd = computed(() => draftName.value.trim().length > 0 && draftBalance.value.trim().length > 0)
const isAdding = ref(false)
const addError = ref('')

async function addEntry() {
  if (!canAdd.value) return
  isAdding.value = true
  addError.value = ''
  try {
    const entry = await addMonthlyDues(draftName.value.trim(), Number(draftBalance.value))
    entries.value.push(entry)
    draftName.value = ''
    draftBalance.value = ''
  } catch (e) {
    addError.value = e instanceof Error ? e.message : '新增失敗，請再試一次'
  } finally {
    isAdding.value = false
  }
}

async function saveBalance(entry: MonthlyDuesEntry) {
  try {
    await updateMonthlyDuesBalance(entry.id, entry.balance)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '更新失敗，請再試一次'
  }
}

async function removeEntry(id: string) {
  try {
    await removeMonthlyDues(id)
    entries.value = entries.value.filter((e) => e.id !== id)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '移除失敗，請再試一次'
  }
}

// type="number" makes Vue's v-model auto-cast to a Number at runtime (checked against the live
// DOM element, not the template), which broke .trim() elsewhere — so digits are filtered manually
// instead of relying on the input type.
function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

const showMonthly = ref(false)
const showIncome = ref(false)
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2 class="font-display text-base font-semibold text-titanium-light">球隊</h2>

    <CommonPlaceholderCard v-if="!canToggleViewMode" title="沒有權限" description="僅管理員／Owner 可使用球隊管理。" />

    <template v-else>
      <section class="metallic-border flex flex-col bg-obsidian-800">
        <button
          type="button"
          class="flex items-center gap-1.5 px-4 py-3.5 text-left"
          @click="showMonthly = !showMonthly"
        >
          <span class="flex-1 text-sm font-medium text-titanium-light">月繳名單</span>
          <ChevronDown class="h-4 w-4 text-titanium/50 transition-transform" :class="showMonthly && 'rotate-180'" />
        </button>

        <div v-if="showMonthly" class="flex flex-col border-t border-titanium/10">
          <p v-if="isLoading" class="py-6 text-center text-xs text-titanium/50">載入中...</p>
          <p v-else-if="loadError" class="px-4 py-3 text-xs text-red-300">{{ loadError }}</p>

          <div v-else class="flex flex-col divide-y divide-titanium/10">
            <div v-for="e in entries" :key="e.id" class="flex items-center gap-3 px-4 py-3">
              <UiAvatar :name="e.name" size="sm" />
              <span class="min-w-0 flex-1 truncate text-sm text-titanium-light">{{ e.name }}</span>
              <UiInput
                :model-value="String(e.balance)"
                inputmode="numeric"
                placeholder="錢包餘額"
                class="w-24 text-right"
                @update:model-value="e.balance = Number(digitsOnly($event))"
                @blur="saveBalance(e)"
              />
              <UiButton variant="danger" size="sm" @click="removeEntry(e.id)">移除</UiButton>
            </div>

            <div class="flex flex-col gap-2 px-4 py-3">
              <div class="flex items-center gap-2">
                <UiInput v-model="draftName" placeholder="名稱" class="min-w-0 flex-1" />
                <UiInput
                  :model-value="draftBalance"
                  inputmode="numeric"
                  placeholder="錢包餘額"
                  class="w-24 text-right"
                  @update:model-value="draftBalance = digitsOnly($event)"
                />
                <UiButton size="sm" :disabled="!canAdd || isAdding" @click="addEntry">
                  {{ isAdding ? '新增中...' : '新增' }}
                </UiButton>
              </div>
              <p v-if="addError" class="text-xs text-red-300">{{ addError }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="metallic-border flex flex-col bg-obsidian-800">
        <button type="button" class="flex items-center gap-1.5 px-4 py-3.5 text-left" @click="showIncome = !showIncome">
          <span class="flex-1 text-sm font-medium text-titanium-light">收支明細</span>
          <ChevronDown class="h-4 w-4 text-titanium/50 transition-transform" :class="showIncome && 'rotate-180'" />
        </button>

        <div v-if="showIncome" class="border-t border-titanium/10 px-4 py-3">
          <p class="text-xs text-titanium/40">敬請期待。</p>
        </div>
      </section>
    </template>
  </div>
</template>
