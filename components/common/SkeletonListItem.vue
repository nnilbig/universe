<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; meta?: string }>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 rounded-lg border border-titanium/10 bg-obsidian-800 px-4 py-3">
    <div class="min-w-0">
      <p class="truncate text-sm text-titanium-light">{{ title }}</p>
      <p v-if="subtitle" class="truncate text-xs text-titanium/50">{{ subtitle }}</p>
    </div>
    <span v-if="meta" class="shrink-0 text-xs text-gold-light">{{ meta }}</span>
  </div>
</template>
