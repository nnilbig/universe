<script setup lang="ts">
const { profile, isAuthenticated, loginWithLine, logout } = useAuth()

async function onClick() {
  if (isAuthenticated.value) {
    await logout()
  } else {
    await loginWithLine()
  }
}
</script>

<template>
  <button
    class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-obsidian-700/60"
    @click="onClick"
  >
    <UiAvatar :src="profile?.avatarUrl" :name="profile?.displayName" size="sm" />
    <span class="text-xs text-titanium">
      {{ isAuthenticated ? profile?.displayName : '登入' }}
    </span>
  </button>
</template>
