<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const { canToggleViewMode } = useAuth()

interface DuesEntry {
  id: string
  name: string
  balance: string
}

const entries = ref<DuesEntry[]>([])
const draftName = ref('')
const draftBalance = ref('')
const canAdd = computed(() => draftName.value.trim().length > 0 && draftBalance.value.trim().length > 0)

function addEntry() {
  if (!canAdd.value) return
  entries.value.push({ id: crypto.randomUUID(), name: draftName.value.trim(), balance: draftBalance.value.trim() })
  draftName.value = ''
  draftBalance.value = ''
}

function removeEntry(id: string) {
  entries.value = entries.value.filter((e) => e.id !== id)
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

        <div v-if="showMonthly" class="flex flex-col divide-y divide-titanium/10 border-t border-titanium/10">
          <div v-for="e in entries" :key="e.id" class="flex items-center gap-3 px-4 py-3">
            <UiAvatar :name="e.name" size="sm" />
            <span class="min-w-0 flex-1 truncate text-sm text-titanium-light">{{ e.name }}</span>
            <UiInput v-model="e.balance" type="number" inputmode="numeric" placeholder="錢包餘額" class="w-24 text-right" />
            <UiButton variant="danger" size="sm" @click="removeEntry(e.id)">移除</UiButton>
          </div>

          <div class="flex items-center gap-2 px-4 py-3">
            <UiInput v-model="draftName" placeholder="名稱" class="min-w-0 flex-1" />
            <UiInput v-model="draftBalance" type="number" inputmode="numeric" placeholder="錢包餘額" class="w-24 text-right" />
            <UiButton size="sm" :disabled="!canAdd" @click="addEntry">新增</UiButton>
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
