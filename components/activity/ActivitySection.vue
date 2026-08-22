<script setup lang="ts">
import type { ActivityWithLookups } from '~/services/activities/activities.types'

defineProps<{ label: string; activities: ActivityWithLookups[] }>()
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="font-display text-base font-semibold text-titanium-light">{{ label }}</h2>
    <div v-if="activities.length" class="flex flex-col gap-2">
      <ActivityCard v-for="activity in activities" :key="activity.id" :activity="activity" />
    </div>
    <p v-else class="rounded-card border border-dashed border-titanium/15 py-6 text-center text-xs text-titanium/40">
      目前沒有符合條件的活動
    </p>
  </section>
</template>
