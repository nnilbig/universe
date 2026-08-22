<script setup lang="ts">
import { computed } from 'vue'
import { Wallet } from 'lucide-vue-next'

const { profile } = useAuth()

// 0 for guests; once logged in, reads the account's own stored balance (profiles.wallet_balance).
const balance = computed(() => profile.value?.walletBalance ?? 0)
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
  </div>
</template>
