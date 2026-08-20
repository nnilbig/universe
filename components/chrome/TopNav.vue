<template>
  <header
    class="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-titanium/10 bg-obsidian-950/90 px-4 py-3 backdrop-blur"
  >
    <NuxtLink to="/" class="font-display text-lg font-bold tracking-wide">
      <span class="bg-gold-gradient bg-clip-text text-transparent">WHONEXT</span>
      <span class="text-titanium"> UNIVERSE</span>
    </NuxtLink>
    <div class="flex items-center gap-2">
      <ChromeViewModeToggle />
      <ChromeAvatarButton />
    </div>
  </header>
</template>
