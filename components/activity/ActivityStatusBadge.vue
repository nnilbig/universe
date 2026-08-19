<script setup lang="ts">
import { computed } from 'vue'
import type { ActivityStatus } from '~/types'

const props = defineProps<{ status: ActivityStatus }>()

const config = computed(
  () =>
    ({
      open: { label: '報名中', variant: 'gold' as const },
      full: { label: '已額滿', variant: 'neutral' as const },
      closed: { label: '已截止', variant: 'neutral' as const },
      cancelled: { label: '已取消', variant: 'danger' as const }
    })[props.status]
)
</script>

<template>
  <UiBadge :variant="config.variant">{{ config.label }}</UiBadge>
</template>
