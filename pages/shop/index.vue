<script setup lang="ts">
const product = { id: 'p1', name: 'WHONEXT 隊服 - 黑', price: 880, soldOut: true, image: '/products/隊服.png' }
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2 class="font-display text-base font-semibold text-titanium-light">商城</h2>
    <div class="w-1/2 pr-1.5">
      <div class="metallic-border flex flex-col gap-2 bg-obsidian-800 p-3">
        <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-obsidian-700">
          <img :src="product.image" :alt="product.name" class="h-full w-full object-cover" />
          <span
            v-if="product.soldOut"
            class="absolute inset-0 flex items-center justify-center bg-obsidian-950/70 font-display text-sm font-bold tracking-widest text-titanium-light"
          >
            售罄
          </span>
        </div>
        <p class="text-xs text-titanium-light">{{ product.name }}</p>
        <p class="text-xs text-gold-light">${{ product.price.toLocaleString() }}</p>
      </div>
    </div>
    <p class="text-xs text-titanium/40">敬請期待更多商品。</p>
  </div>
</template>
