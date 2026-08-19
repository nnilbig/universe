<template>
  <div class="min-h-screen bg-obsidian-950">
    <ChromeTopNav />
    <main class="mx-auto min-h-[calc(100vh-8.5rem)] max-w-lg px-4 pb-24 pt-4">
      <slot />
    </main>
    <ChromeBottomNav />
  </div>
</template>
