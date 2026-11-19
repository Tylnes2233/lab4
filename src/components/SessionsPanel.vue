<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { History, Trash2, CheckCircle2, Copy } from 'lucide-vue-next'
import { useGreedStore } from '../stores/greed.store'
import { useToastStore } from '../stores/toast.store'

const store = useGreedStore()
const toastStore = useToastStore()
const { savedSessions, activeSessionId, isLoading } = storeToRefs(store)

const handleSelectChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  if (value && value !== activeSessionId.value) {
    store.connectToSession(value)
  }
}

const copySessionId = async (id: string) => {
  await navigator.clipboard.writeText(id)
  toastStore.showToast('ID сесії скопійовано в буфер обміну', 'info', 2500)
}
</script>

<template>
  <div class="card bg-base-100 shadow-xl border border-base-300">
    <div class="card-body space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="card-title text-lg gap-2">
          <History class="w-5 h-5 text-primary" />
          Збережені сесії ({{ savedSessions.length }})
        </h2>
      </div>

      <div v-if="savedSessions.length > 0" class="form-control">
        <label class="label">
          <span class="label-text text-xs font-semibold">Швидке перемикання забігу:</span>
        </label>
        <select
          class="select select-bordered select-sm w-full font-mono"
          :value="activeSessionId || ''"
          :disabled="isLoading"
          @change="handleSelectChange"
        >
          <option v-for="s in savedSessions" :key="s.id" :value="s.id">
            {{ s.title }} — {{ s.characterName }} ({{ s.id }})
          </option>
        </select>
      </div>

      <div v-if="savedSessions.length === 0" class="alert text-xs">
        <span>Список збережених забігів порожній. Почніть нову сесію!</span>
      </div>

      <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
        <div
          v-for="session in savedSessions"
          :key="session.id"
          class="p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer"
          :class="
            session.id === activeSessionId
              ? 'border-primary bg-primary/10'
              : 'border-base-300 bg-base-200/60 hover:border-primary/50'
          "
          @click="session.id !== activeSessionId && store.connectToSession(session.id)"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <CheckCircle2
                v-if="session.id === activeSessionId"
                class="w-4 h-4 text-primary shrink-0"
              />
              <span class="font-bold text-sm truncate">{{ session.characterName }}</span>
              <span class="badge badge-xs badge-ghost">{{ session.updatedAt }}</span>
            </div>
            <div class="text-xs font-mono opacity-70 truncate mt-0.5">{{ session.id }}</div>
          </div>

          <div class="flex items-center gap-1 shrink-0" @click.stop>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square"
              title="Скопіювати ID"
              @click="copySessionId(session.id)"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="session.id !== activeSessionId"
              type="button"
              class="btn btn-ghost btn-xs btn-square text-error"
              title="Видалити зі списку"
              @click="store.removeSavedSession(session.id)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>