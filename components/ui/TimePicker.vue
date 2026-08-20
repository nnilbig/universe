<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

// min excludes times <= min so an end-time picker can enforce "must be later than start" purely
// by disabling the invalid slots, rather than validating after the fact.
const props = defineProps<{ min?: string; placeholder?: string }>()
const model = defineModel<string>({ default: '' })

const open = ref(false)

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

function select(t: string) {
  if (isDisabled(t)) return
  model.value = t
  open.value = false
}

const listRef = ref<HTMLElement | null>(null)

function scrollToSelected() {
  if (!listRef.value || !model.value) return
  const el = listRef.value.querySelector<HTMLElement>(`[data-time="${model.value}"]`)
  el?.scrollIntoView({ block: 'center' })
}

watch(open, (isOpen) => {
  if (isOpen) nextTick(scrollToSelected)
})
</script>

<template>
  <button
    type="button"
    :class="[
      'flex h-11 w-full items-center justify-between rounded-lg border border-titanium/20 bg-obsidian-900 px-3 text-sm outline-none transition-colors focus:border-gold/60',
      model ? 'text-titanium-light' : 'text-titanium/40'
    ]"
    @click="open = true"
  >
    {{ model || placeholder || '選擇時間' }}
    <ChevronDown class="h-4 w-4 text-titanium/40" />
  </button>

  <UiSheet v-model:open="open" title="選擇時間">
    <div ref="listRef" class="flex max-h-[60vh] flex-col overflow-y-auto">
      <button
        v-for="t in slots"
        :key="t"
        type="button"
        :data-time="t"
        :disabled="isDisabled(t)"
        :class="[
          'py-3 text-center text-base transition-colors disabled:pointer-events-none disabled:text-titanium/20',
          model === t ? 'font-semibold text-gold-light' : 'text-titanium-light'
        ]"
        @click="select(t)"
      >
        {{ t }}
      </button>
    </div>
  </UiSheet>
</template>
