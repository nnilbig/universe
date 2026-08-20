<script setup lang="ts">
import { ref } from 'vue'

const { profile, isAuthenticated, loginWithLine, logout } = useAuth()
const showAuthChoice = ref(false)

async function onClick() {
  if (isAuthenticated.value) {
    await logout()
  } else {
    showAuthChoice.value = true
  }
}

async function onLineLogin() {
  showAuthChoice.value = false
  await loginWithLine()
}
</script>

<template>
  <button
    class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-obsidian-700/60"
    @click="onClick"
  >
    <UiAvatar :src="profile?.avatarUrl" :name="profile?.displayName" size="sm" />
    <span class="text-xs text-titanium">
      {{ isAuthenticated ? profile?.displayName : '註冊/登入' }}
    </span>
  </button>

  <UiDialog v-model:open="showAuthChoice" title="註冊/登入">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-titanium/70">選擇登入方式，快速開啟運動體驗</p>
      <div class="flex flex-col gap-3">
        <UiButton variant="primary" size="lg" @click="onLineLogin">綁定 LINE 一鍵註冊 / 登入</UiButton>
        <UiButton variant="outline" size="lg" @click="showAuthChoice = false">以訪客身份繼續</UiButton>
      </div>
    </div>
  </UiDialog>
</template>
