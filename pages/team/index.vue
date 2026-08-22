<script setup lang="ts">
import { PhListChecks, PhReceipt } from '@phosphor-icons/vue'

const sections = [
  { label: '月繳名單', icon: PhListChecks, to: '/team/monthly' },
  { label: '收支明細', icon: PhReceipt, to: null }
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2 class="font-display text-base font-semibold text-titanium-light">球隊</h2>

    <div class="metallic-border flex flex-col divide-y divide-titanium/10 bg-obsidian-800">
      <template v-for="s in sections" :key="s.label">
        <NuxtLink
          v-if="s.to"
          :to="s.to"
          class="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-obsidian-700"
        >
          <component :is="s.icon" class="h-5 w-5 shrink-0 text-gold" />
          <span class="flex-1 text-sm text-titanium-light">{{ s.label }}</span>
        </NuxtLink>
        <div v-else class="flex items-center gap-3 px-4 py-3.5">
          <component :is="s.icon" class="h-5 w-5 shrink-0 text-gold" />
          <span class="flex-1 text-sm text-titanium-light">{{ s.label }}</span>
          <span class="text-xs text-titanium/40">敬請期待</span>
        </div>
      </template>
    </div>
  </div>
</template>
