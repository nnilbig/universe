<script setup lang="ts">
import { PlusCircle } from 'lucide-vue-next'

const { weekly, upcoming } = useActivities()
const { canToggleViewMode } = useAuth()
</script>

<template>
  <div class="flex flex-col gap-6">
    <NuxtLink
      v-if="canToggleViewMode"
      to="/activities/create"
      class="metallic-border flex items-center gap-2 bg-obsidian-800 px-4 py-3 text-sm text-titanium-light transition-colors active:bg-obsidian-700"
    >
      <PlusCircle class="h-4 w-4 text-gold-light" />
      建立活動
    </NuxtLink>
    <ActivityTypeFilter />
    <ActivitySection label="本週活動" :activities="weekly" />
    <ActivitySection label="即將到來的活動" :activities="upcoming" />
    <ActivityDetailSheet />
  </div>
</template>
