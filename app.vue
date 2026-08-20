<script setup lang="ts">
const { init: initAuth } = useAuth()
const { loadLookups, loadWeekly, loadUpcoming } = useActivities()
const { runBoot } = useSplash()

onMounted(() => {
  runBoot([() => initAuth(), async () => loadLookups(), () => loadWeekly(), () => loadUpcoming()])
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
