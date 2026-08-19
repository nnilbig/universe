<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon?: Component; title: string; description?: string }>()
</script>

<template>
  <div class="metallic-border flex flex-col gap-2 bg-obsidian-800 p-5">
    <div class="flex items-center gap-2">
      <component :is="icon" v-if="icon" class="h-4 w-4 text-gold" />
      <h3 class="font-display text-sm font-semibold text-titanium-light">{{ title }}</h3>
    </div>
    <p v-if="description" class="text-xs leading-relaxed text-titanium/60">{{ description }}</p>
    <slot />
  </div>
</template>
