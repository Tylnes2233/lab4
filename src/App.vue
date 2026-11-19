<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Coins, Bomb, RotateCcw, AlertTriangle, Percent, Sparkles } from 'lucide-vue-next'
import { useGreedStore } from './stores/greed.store'
import GreedMachine from './components/GreedMachine.vue'
import CharacterSelectorPanel from './components/CharacterSelectorPanel.vue'
import SessionsPanel from './components/SessionsPanel.vue'
import ToastContainer from './components/ToastContainer.vue'

const store = useGreedStore()
const {
  activeSessionId,
  gameState,
  digits,
  isLoading,
  isActionPending,
  isShaking,
  lastPayloadName
} = storeToRefs(store)

onMounted(() => {
  store.initApp()
})
</script>

<template>
  <div class="min-h-screen bg-base-200 text-base-content pb-12">
    <ToastContainer />

    <header class="navbar bg-base-100 shadow-md px-4 md:px-8 mb-6">
      <div class="flex-1">
        <span class="text-xl font-extrabold tracking-wide text-primary">
          🎰 THE GREED MACHINE
        </span>
      </div>
      <div class="flex-none">
        <span v-if="activeSessionId" class="badge badge-outline font-mono text-xs">
          Session: {{ activeSessionId }}
        </span>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4">
      <div v-if="isLoading && !gameState" class="flex justify-center items-center py-24">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-4">
          <CharacterSelectorPanel />
        </div>

        <div class="lg:col-span-4 flex flex-col items-center space-y-5">
          <div :class="{ 'animate-bounce': isShaking }">
            <GreedMachine>
              <span class="countdown">
                <span :style="{ '--value': digits.hundreds, '--digits': 1 }">
                  {{ digits.hundreds }}
                </span>
              </span>
              <span class="countdown">
                <span :style="{ '--value': digits.tens, '--digits': 1 }">
                  {{ digits.tens }}
                </span>
              </span>
              <span class="countdown">
                <span :style="{ '--value': digits.units, '--digits': 1 }">
                  {{ digits.units }}
                </span>
              </span>
            </GreedMachine>
          </div>

          <div
            v-if="gameState?.is_jammed"
            class="alert alert-error shadow-md text-sm py-2.5 flex items-center gap-2"
          >
            <AlertTriangle class="w-5 h-5 shrink-0" />
            <span>Автомат заклинило! Підірвіть бомбою або скиньте забіг.</span>
          </div>

          <div
            v-if="lastPayloadName"
            class="badge badge-secondary gap-1 py-3 px-4 text-xs font-semibold"
          >
            <Sparkles class="w-3.5 h-3.5" />
            Останній ефект: {{ lastPayloadName }}
          </div>

          <div v-if="gameState" class="card bg-base-100 shadow-xl border border-base-300 w-full">
            <div class="card-body p-5 space-y-4">
              <div class="stats stats-horizontal shadow bg-base-200 w-full">
                <div class="stat py-3 px-4">
                  <div class="stat-title text-xs flex items-center gap-1">
                    <Coins class="w-3.5 h-3.5 text-warning" />
                    Монети
                  </div>
                  <div class="stat-value text-2xl text-warning">{{ gameState.wallet }}</div>
                </div>

                <div class="stat py-3 px-4">
                  <div class="stat-title text-xs flex items-center gap-1">
                    <Bomb class="w-3.5 h-3.5 text-error" />
                    Бомби
                  </div>
                  <div class="stat-value text-2xl text-error">{{ gameState.bombs }}</div>
                </div>

                <div class="stat py-3 px-4">
                  <div class="stat-title text-xs flex items-center gap-1">
                    <Percent class="w-3.5 h-3.5 text-info" />
                    Шанс клину
                  </div>
                  <div class="stat-value text-xl text-info">
                    {{ Number(gameState.jam_chance ?? 0).toFixed(2) }}%
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  class="btn btn-warning btn-lg w-full font-bold gap-2"
                  :disabled="
                    isActionPending ||
                    gameState.is_jammed ||
                    gameState.wallet <= 0
                  "
                  @click="store.donateCoin"
                >
                  <Coins class="w-5 h-5" />
                  Кинути 1 монету (Донат)
                </button>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="btn btn-error gap-1"
                    :disabled="isActionPending || gameState.bombs <= 0"
                    @click="store.blowUpMachine"
                  >
                    <Bomb class="w-4 h-4" />
                    Підірвати бомбою
                  </button>

                  <button
                    type="button"
                    class="btn btn-outline gap-1"
                    :disabled="isActionPending"
                    @click="store.resetCurrentRun"
                  >
                    <RotateCcw class="w-4 h-4" />
                    Скинути спробу
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-4">
          <SessionsPanel />
        </div>
      </div>
    </main>
  </div>
</template>