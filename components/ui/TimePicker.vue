<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { cn } from '~/lib/utils'

// min excludes times <= min so an end-time picker can enforce "must be later than start" purely
// by disabling the invalid slots, rather than validating after the fact.
const props = defineProps<{ min?: string }>()
const model = defineModel<string>({ default: '' })

const slots = computed(() => {
  const list: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      list.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return list
})

function isDisabled(t: string): boolean {
  return props.min ? t <= props.min : false
}

const containerRef = ref<HTMLElement | null>(null)

function scrollToSelected() {
  if (!containerRef.value || !model.value) return
  const el = containerRef.value.querySelector<HTMLElement>(`[data-time="${model.value}"]`)
  el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
}

watch(model, scrollToSelected)
onMounted(() => nextTick(scrollToSelected))
</script>

<template>
  <div ref="containerRef" class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
    <button
      v-for="t in slots"
      :key="t"
      type="button"
      :data-time="t"
      :disabled="isDisabled(t)"
      :class="
        cn(
          'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-30',
          model === t
            ? 'border-gold/60 bg-gold/10 text-gold-light'
            : 'border-titanium/15 text-titanium/60 hover:border-titanium/30'
        )
      "
      @click="model = t"
    >
      {{ t }}
    </button>
  </div>
</template>
