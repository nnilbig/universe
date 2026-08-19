<script setup lang="ts">
import { PhCalendarDot, PhUserCircle, PhWallet, PhTrophy, PhStorefront } from '@phosphor-icons/vue'

const route = useRoute()

const tabs = [
  { to: '/', label: '活動', icon: PhCalendarDot },
  { to: '/personal', label: '個人', icon: PhUserCircle },
  { to: '/wallet', label: '錢包', icon: PhWallet },
  { to: '/ranking', label: '排行', icon: PhTrophy },
  { to: '/shop', label: '商城', icon: PhStorefront }
]

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 flex border-t border-titanium/10 bg-obsidian-950/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur"
  >
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors"
      :class="isActive(tab.to) ? 'text-gold' : 'text-titanium/60'"
    >
      <component :is="tab.icon" class="h-6 w-6" :weight="isActive(tab.to) ? 'regular' : 'light'" />
      {{ tab.label }}
    </NuxtLink>
  </nav>
</template>
