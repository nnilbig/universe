<script setup lang="ts">
defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-titanium/70">
      綁定您的 LINE 帳號即可快速報名此活動，日後可於「個人」頁面管理報名紀錄。
    </p>
    <div class="flex gap-3">
      <UiButton variant="outline" class="flex-1" @click="$emit('cancel')">取消</UiButton>
      <UiButton variant="primary" class="flex-1" @click="$emit('confirm')">同意並報名</UiButton>
    </div>
  </div>
</template>
