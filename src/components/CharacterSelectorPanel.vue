<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Play, Link2, Sparkles, Coins, Bomb } from 'lucide-vue-next'
import { useGreedStore } from '../stores/greed.store'

const store = useGreedStore()
const { characters, currentCharacter, isLoading, isActionPending } = storeToRefs(store)

const manualSessionInput = ref('')
const imageBroken = ref(false)

watch(currentCharacter, () => {
  imageBroken.value = false
})

const characterAvatarUrl = computed<string | null>(() => {
  if (!currentCharacter.value || imageBroken.value) return null
  const c = currentCharacter.value
  const raw =
    c.avatar_url ||
    c.avatar ||
    c.image ||
    c.icon ||
    (typeof c.sprite === 'string' ? c.sprite : null) ||
    (typeof c.img === 'string' ? c.img : null) ||
    (typeof c.photo === 'string' ? c.photo : null)

  if (!raw || typeof raw !== 'string') return null
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw
  }
  const baseOrigin = 'https://wurger-palantir.duckdns.org'
  return raw.startsWith('/') ? `${baseOrigin}${raw}` : `${baseOrigin}/demo-api/${raw}`
})

const handleConnect = async () => {
  const ok = await store.connectToSession(manualSessionInput.value)
  if (ok) {
    manualSessionInput.value = ''
  }
}
</script>

<template>
  <div class="card bg-base-100 shadow-xl border border-base-300">
    <div class="card-body space-y-4">
      <h2 class="card-title text-lg">Персонаж та новий забіг</h2>

      <div v-if="currentCharacter" class="bg-base-200 rounded-xl p-4 space-y-3">
        <div class="flex items-center gap-3">
          <div class="avatar shrink-0">
            <div class="bg-primary text-primary-content rounded-full w-14 h-14 ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden flex items-center justify-center">
              <img
                v-if="characterAvatarUrl"
                :src="characterAvatarUrl"
                :alt="currentCharacter.name"
                class="w-full h-full object-contain"
                @error="imageBroken = true"
              />
              <span v-else class="text-2xl font-extrabold leading-none">
                {{ currentCharacter.name.charAt(0) }}
              </span>
            </div>
          </div>
          <div>
            <div class="font-bold text-base">{{ currentCharacter.name }}</div>
            <p class="text-xs text-base-content/70">
              {{ currentCharacter.description || 'Персонаж The Binding of Isaac' }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 text-xs">
          <span v-if="currentCharacter.luck !== undefined" class="badge badge-accent gap-1">
            <Sparkles class="w-3 h-3" />
            Удача: {{ currentCharacter.luck }}
          </span>
          <span v-if="currentCharacter.starting_coins !== undefined" class="badge badge-warning gap-1">
            <Coins class="w-3 h-3" />
            Старт монет: {{ currentCharacter.starting_coins }}
          </span>
          <span v-if="currentCharacter.starting_bombs !== undefined" class="badge badge-error gap-1">
            <Bomb class="w-3 h-3" />
            Старт бомб: {{ currentCharacter.starting_bombs }}
          </span>
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs font-semibold">Обрати персонажа:</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="char in characters"
            :key="char.id"
            type="button"
            class="btn btn-sm justify-start truncate"
            :class="currentCharacter?.id === char.id ? 'btn-primary' : 'btn-outline'"
            :disabled="isLoading || isActionPending"
            @click="store.changeCharacter(char.id)"
          >
            {{ char.name }}
          </button>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-success w-full gap-2"
        :disabled="isLoading"
        @click="store.startNewRun(currentCharacter?.id)"
      >
        <Play class="w-4 h-4" />
        Почати новий забіг (Нова сесія)
      </button>

      <div class="divider text-xs my-1">Або підключитись за ID</div>

      <form class="flex gap-2" @submit.prevent="handleConnect">
        <input
          v-model="manualSessionInput"
          type="text"
          class="input input-bordered input-sm w-full font-mono"
          placeholder="greed_..."
        />
        <button
          type="submit"
          class="btn btn-sm btn-secondary shrink-0 gap-1"
          :disabled="isLoading || !manualSessionInput.trim()"
        >
          <Link2 class="w-4 h-4" />
          Підключити
        </button>
      </form>
    </div>
  </div>
</template>