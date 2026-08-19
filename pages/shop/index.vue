<script setup lang="ts">
const products = [
  { id: 'p1', name: 'WHONEXT 隊服 - 黑耀金款', price: 1280, soldOut: true },
  { id: 'p2', name: 'WHONEXT 隊服 - 鈦銀款', price: 1280, soldOut: true }
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2 class="font-display text-base font-semibold text-titanium-light">商城</h2>
    <div class="grid grid-cols-2 gap-3">
      <div v-for="p in products" :key="p.id" class="metallic-border flex flex-col gap-2 bg-obsidian-800 p-3">
        <div class="relative flex aspect-square items-center justify-center rounded-lg bg-obsidian-700">
          <span class="font-display text-3xl text-titanium/20">👕</span>
          <span
            v-if="p.soldOut"
            class="absolute inset-0 flex items-center justify-center rounded-lg bg-obsidian-950/70 font-display text-sm font-bold tracking-widest text-titanium-light"
          >
            售罄
          </span>
        </div>
        <p class="text-xs text-titanium-light">{{ p.name }}</p>
        <p class="text-xs text-gold-light">${{ p.price.toLocaleString() }}</p>
      </div>
    </div>
    <p class="text-xs text-titanium/40">商城功能即將推出，敬請期待更多商品。</p>
  </div>
</template>
