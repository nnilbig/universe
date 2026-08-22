<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{ activityId: string }>()
const emit = defineEmits<{
  submitting: []
  registered: [registrationIds: string[], skipAvatarStep?: boolean]
  back: []
}>()

const { isAuthenticated, profile } = useAuth()
const { registerWithLine, registerAsGuest, addGuestCompanion, listByActivity } = useRegistrations()
const findProfile = useProfileLookup()
const guestNames = useGuestNames()

const selfDisplayName = computed(() => (profile.value ? findProfile(profile.value.id)?.displayName : undefined))

const selfNickname = ref('')
// MVP has no PIN — pre-fill with this device's most recently used nickname (onMounted, not an
// inline ref initializer, so SSR and the first client render still match before hydration).
onMounted(() => {
  if (!isAuthenticated.value) selfNickname.value = guestNames.mostRecent()
})

const rawInput = ref('')
const friendNames = ref<string[]>([])
const error = ref('')
const isSubmitting = ref(false)

// Commits whitespace/newline-separated tokens out of the textarea into pills as they're finished
// (i.e. followed by a separator) — or every token, once the caller says the input is done
// (paste settled / blur / submit) — leaving any still-being-typed trailing word in the box.
function commitFromInput(forceAll: boolean) {
  const text = rawInput.value
  if (!text) return
  const endsWithSeparator = /[\s\n]$/.test(text)
  const tokens = text.split(/[\s\n]+/).filter((t) => t.length > 0)
  const commitCandidateCount = forceAll || endsWithSeparator ? tokens.length : tokens.length - 1
  const trailingPartial = forceAll || endsWithSeparator ? '' : (text.match(/[^\s\n]*$/)?.[0] ?? '')

  for (let i = 0; i < commitCandidateCount; i++) {
    const name = tokens[i].slice(0, 4)
    if (name && !friendNames.value.includes(name)) friendNames.value.push(name)
  }

  rawInput.value = trailingPartial
}

function onInput() {
  commitFromInput(false)
}
function onBlur() {
  commitFromInput(true)
}
function removeFriend(i: number) {
  friendNames.value.splice(i, 1)
}

function existingNames(): Set<string> {
  const names = new Set<string>()
  for (const r of listByActivity(props.activityId)) {
    if (r.kind === 'guest' && r.nickname) names.add(r.nickname)
    else if (r.kind === 'line' && r.profileId) {
      const p = findProfile(r.profileId)
      if (p?.displayName) names.add(p.displayName)
    }
  }
  return names
}

function findDuplicate(names: string[]): string | null {
  const taken = existingNames()
  const seen = new Set<string>()
  for (const n of names) {
    if (taken.has(n) || seen.has(n)) return n
    seen.add(n)
  }
  return null
}

async function submitAuthenticated() {
  const duplicate = findDuplicate(friendNames.value)
  if (duplicate) {
    error.value = `此場次已有叫「${duplicate}」的球友！請重新輸入。`
    return
  }
  isSubmitting.value = true
  emit('submitting')
  try {
    const selfReg = await registerWithLine(props.activityId)
    const ids = [selfReg.id]
    for (const name of friendNames.value) {
      const reg = await addGuestCompanion(props.activityId, selfReg.groupId, name)
      ids.push(reg.id)
      guestNames.remember(name)
    }
    // The self registration is still a LINE one with an existing avatar — same as solo 個人報名.
    emit('registered', ids, true)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '報名失敗，請再試一次'
  } finally {
    isSubmitting.value = false
  }
}

async function submitGuest() {
  const name = selfNickname.value.trim()
  if (!name || name.length > 4) {
    error.value = '請輸入你的暱稱（最多 4 字）'
    return
  }
  const allNames = [name, ...friendNames.value]
  const duplicate = findDuplicate(allNames)
  if (duplicate) {
    error.value = `此場次已有叫「${duplicate}」的球友！請重新輸入。`
    return
  }
  isSubmitting.value = true
  emit('submitting')
  try {
    const registrations = await registerAsGuest({
      activityId: props.activityId,
      members: allNames.map((nickname) => ({ nickname }))
    })
    for (const r of registrations) if (r.nickname) guestNames.remember(r.nickname)
    emit(
      'registered',
      registrations.map((r) => r.id)
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : '報名失敗，請再試一次'
  } finally {
    isSubmitting.value = false
  }
}

async function submit() {
  error.value = ''
  commitFromInput(true)
  if (isAuthenticated.value) await submitAuthenticated()
  else await submitGuest()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="isAuthenticated"
      class="rounded-lg border border-titanium/10 bg-obsidian-900 px-3 py-2.5 text-sm text-titanium-light"
    >
      你將以「{{ selfDisplayName ?? 'LINE' }}」的身分報名
    </div>
    <div v-else>
      <label class="mb-1.5 block text-xs text-titanium/50">你的暱稱（最多 4 字）</label>
      <UiInput v-model="selfNickname" maxlength="4" placeholder="輸入暱稱" />
    </div>

    <div>
      <label class="mb-1.5 block text-xs text-titanium/50"> 友人暱稱（選填），用空格或換行分隔 </label>
      <textarea
        v-model="rawInput"
        rows="2"
        placeholder="貼上或輸入友人暱稱，例如：小美 阿哲"
        class="w-full resize-none rounded-lg border border-titanium/20 bg-obsidian-900 px-3 py-2 text-sm text-titanium-light placeholder:text-titanium/40 outline-none transition-colors focus:border-gold/60"
        @input="onInput"
        @blur="onBlur"
      />
      <div v-if="friendNames.length" class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="(name, i) in friendNames"
          :key="`${name}-${i}`"
          class="inline-flex items-center gap-1 rounded-full bg-obsidian-700 py-1 pl-3 pr-1.5 text-xs text-titanium-light"
        >
          {{ name }}
          <button
            type="button"
            class="rounded-full p-0.5 text-titanium/50 transition-colors hover:text-titanium-light"
            @click="removeFriend(i)"
          >
            <X class="h-3 w-3" />
          </button>
        </span>
      </div>
    </div>

    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>

    <div class="flex gap-3">
      <UiButton variant="outline" class="flex-1" @click="$emit('back')">返回</UiButton>
      <UiButton variant="primary" class="flex-1" :disabled="isSubmitting" @click="submit">
        {{ isSubmitting ? '報名中...' : '確認報名' }}
      </UiButton>
    </div>
  </div>
</template>
