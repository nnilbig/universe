<script setup lang="ts">
const { weekly, monthly } = useActivities()
</script>

<template>
  <div class="flex flex-col gap-6">
    <ActivityTypeFilter />
    <ActivitySection label="本週活動" :activities="weekly" />
    <ActivitySection label="本月活動" :activities="monthly" />
    <ActivityDetailSheet />
  </div>
</template>
