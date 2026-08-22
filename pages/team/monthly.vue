<script setup lang="ts">
import { ref, computed } from 'vue'

const { canToggleViewMode } = useAuth()

interface DuesEntry {
  id: string
  name: string
  balance: number
}

const entries = ref<DuesEntry[]>([])
const draftName = ref('')
const draftBalance = ref('')

const canAdd = computed(() => draftName.value.trim().length > 0 && draftBalance.value.trim().length > 0)

function add() {
  if (!canAdd.value) return
  entries.value.push({
    id: crypto.randomUUID(),
    name: draftName.value.trim(),
    balance: Math.round(Number(draftBalance.value))
  })
  draftName.value = ''
  draftBalance.value = ''
}

function remove(id: string) {
  entries.value = entries.value.filter((e) => e.id !== id)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <CommonPlaceholderCard v-if="!canToggleViewMode" title="沒有權限" description="僅管理員／Owner 可使用月繳名單。" />

    <template v-else>
      <h2 class="font-display text-base font-semibold text-titanium-light">月繳名單</h2>

      <div class="flex gap-2">
        <UiInput v-model="draftName" placeholder="名稱" class="flex-1" />
        <UiInput v-model="draftBalance" type="number" inputmode="numeric" placeholder="錢包餘額" class="w-24" />
        <UiButton :disabled="!canAdd" @click="add">新增</UiButton>
      </div>

      <div v-if="entries.length" class="metallic-border flex flex-col divide-y divide-titanium/10 bg-obsidian-800">
        <div v-for="e in entries" :key="e.id" class="flex items-center gap-3 px-4 py-3">
          <UiAvatar :name="e.name" size="sm" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-titanium-light">{{ e.name }}</p>
            <p class="text-[11px] text-titanium/40">餘額 ${{ e.balance.toLocaleString() }}</p>
          </div>
          <UiButton variant="danger" size="sm" @click="remove(e.id)">移除</UiButton>
        </div>
      </div>
      <p v-else class="text-xs text-titanium/40">尚無名單，請於上方新增。</p>
    </template>
  </div>
</template>
