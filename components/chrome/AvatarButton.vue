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
    <div class="flex flex-col gap-5">
      <p class="text-sm text-titanium/70">選擇登入方式，快速開啟運動體驗</p>

      <div class="flex flex-col gap-1.5">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          @click="onLineLogin"
        >
          <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 3C6.98 3 3 6.35 3 10.46c0 3.68 3.16 6.76 7.44 7.35.29.06.68.19.78.44.09.22.06.58.03.8l-.13.78c-.04.23-.18.9.78.49.97-.4 5.19-3.06 7.08-5.24C20.14 13.35 21 11.98 21 10.46 21 6.35 17.02 3 12 3z"
            />
          </svg>
          LINE 快速註冊 / 登入
        </button>
        <p class="text-center text-[11px] text-titanium/40">免記密碼 · 享快速報名與歷史紀錄</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <button
          type="button"
          class="w-full rounded-xl border border-titanium/30 px-4 py-3 text-sm font-medium text-titanium-light transition-colors hover:border-titanium/50"
          @click="showAuthChoice = false"
        >
          以訪客身份繼續
        </button>
        <p class="text-center text-[11px] text-titanium/40">免綁定帳號 · 輸入暱稱即可報名</p>
      </div>
    </div>
  </UiDialog>
</template>
