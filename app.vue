<script setup lang="ts">
const { init: initAuth } = useAuth()
const { loadLookups, loadWeekly, loadMonthly } = useActivities()
const { runBoot } = useSplash()

onMounted(() => {
  runBoot([() => initAuth(), async () => loadLookups(), () => loadWeekly(), () => loadMonthly()])
})
</script>

<template>
  <div>
    <VitePwaManifest />
    <ChromeSplashScreen />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
