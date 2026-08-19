<script setup lang="ts">
const { isSplashLoading, progress } = useSplash()
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-400"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isSplashLoading"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-obsidian-950"
    >
      <div class="flex flex-col items-center gap-2">
        <span class="bg-gold-gradient bg-clip-text font-display text-3xl font-bold tracking-wide text-transparent">
          WHONEXT
        </span>
        <span class="text-xs tracking-[0.3em] text-titanium/60">UNIVERSE</span>
      </div>
      <div class="h-1 w-40 overflow-hidden rounded-full bg-obsidian-700">
        <div
          class="h-full rounded-full bg-gold-gradient transition-[width] duration-150 ease-out"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>
  </Transition>
</template>
