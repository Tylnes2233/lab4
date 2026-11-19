import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { greedService } from '../services/greedService'
import { getStoredActiveSessionId, setStoredActiveSessionId } from '../api/httpClient'
import { useToastStore } from './toast.store'
import type {
  CharacterModel,
  GreedStateModel,
  PayloadModel,
  SavedSession
} from '../types/greed'

const SAVED_SESSIONS_KEY = 'greed_saved_sessions_v1'

export const useGreedStore = defineStore('greed', () => {
  const toastStore = useToastStore()

  const characters = ref<CharacterModel[]>([])
  const activeSessionId = ref<string | null>(getStoredActiveSessionId())
  const gameState = ref<GreedStateModel | null>(null)
  const savedSessions = ref<SavedSession[]>(loadSavedSessions())

  const isLoading = ref(false)
  const isActionPending = ref(false)
  const isShaking = ref(false)
  const lastPayloadName = ref<string | null>(null)

  function loadSavedSessions(): SavedSession[] {
    try {
      const raw = localStorage.getItem(SAVED_SESSIONS_KEY)
      return raw ? (JSON.parse(raw) as SavedSession[]) : []
    } catch {
      return []
    }
  }

  function persistSavedSessions() {
    localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(savedSessions.value))
  }

  function upsertSessionRecord(state: GreedStateModel) {
    const charObj =
      state.character ||
      characters.value.find((c) => c.id === state.character_id) ||
      null
    const charName = charObj ? charObj.name : 'Isaac'

    const existingIndex = savedSessions.value.findIndex((s) => s.id === state.session_id)
    const entry: SavedSession = {
      id: state.session_id,
      title: `Забіг #${state.session_id.slice(-6)}`,
      characterName: charName,
      updatedAt: new Date().toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    if (existingIndex !== -1) {
      savedSessions.value[existingIndex] = entry
    } else {
      savedSessions.value.unshift(entry)
    }
    persistSavedSessions()
  }

  function triggerShake() {
    isShaking.value = false
    requestAnimationFrame(() => {
      isShaking.value = true
      setTimeout(() => {
        isShaking.value = false
      }, 500)
    })
  }

  function executeServerPayload(payload?: PayloadModel | null) {
    if (!payload || !payload.code) return
    lastPayloadName.value = payload.name || payload.id || 'Server Event'
    toastStore.showToast(`Активовано подію: ${lastPayloadName.value}`, 'info', 5000)

    try {
      const runner = new Function(payload.code)
      runner()
    } catch (err) {
      console.error('Payload execution failed:', err)
    }
  }

  const currentCharacter = computed<CharacterModel | null>(() => {
    if (!gameState.value) return characters.value[0] || null
    if (gameState.value.character) return gameState.value.character
    return (
      characters.value.find((c) => c.id === gameState.value?.character_id) ||
      characters.value[0] ||
      null
    )
  })

  const digits = computed(() => {
    const raw = gameState.value?.coins_in_machine ?? 0
    const clamped = Math.max(0, Math.min(999, Math.floor(raw)))
    return {
      hundreds: Math.floor(clamped / 100),
      tens: Math.floor((clamped % 100) / 10),
      units: clamped % 10
    }
  })

  async function initApp() {
    isLoading.value = true
    try {
      characters.value = await greedService.getCharacters()

      if (activeSessionId.value) {
        try {
          await greedService.verifySession(activeSessionId.value)
          const state = await greedService.getState()
          gameState.value = state
          upsertSessionRecord(state)
          return
        } catch {
          setStoredActiveSessionId(null)
          activeSessionId.value = null
        }
      }

      await startNewRun(characters.value[0]?.id)
    } finally {
      isLoading.value = false
    }
  }

  async function startNewRun(characterId?: string) {
    isLoading.value = true
    try {
      const targetCharId = characterId || currentCharacter.value?.id
      const created = await greedService.createNewSession(targetCharId)

      activeSessionId.value = created.session_id
      setStoredActiveSessionId(created.session_id)

      const freshState = await greedService.getState()
      gameState.value = freshState
      upsertSessionRecord(freshState)
    } finally {
      isLoading.value = false
    }
  }

  async function connectToSession(sessionId: string): Promise<boolean> {
    const trimmed = sessionId.trim()
    if (!trimmed) {
      toastStore.showToast('Введіть ID сесії для підключення', 'warning')
      return false
    }

    isLoading.value = true
    try {
      await greedService.verifySession(trimmed)

      activeSessionId.value = trimmed
      setStoredActiveSessionId(trimmed)

      const state = await greedService.getState()
      gameState.value = state
      upsertSessionRecord(state)
      toastStore.showToast(`Підключено до сесії ${trimmed}`, 'success')
      return true
    } catch {
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function changeCharacter(characterId: string) {
    if (!activeSessionId.value) return
    isActionPending.value = true
    try {
      await greedService.selectCharacter(characterId)
      const freshState = await greedService.getState()
      gameState.value = freshState
      upsertSessionRecord(freshState)
    } finally {
      isActionPending.value = false
    }
  }

  async function donateCoin() {
    if (!activeSessionId.value || !gameState.value || gameState.value.is_jammed) return
    isActionPending.value = true
    try {
      const res = await greedService.donate(1)

      gameState.value = {
        ...gameState.value,
        coins_in_machine: res.coins_in_machine,
        wallet: res.wallet,
        bombs: res.bombs ?? gameState.value.bombs,
        jam_chance: res.jam_chance ?? gameState.value.jam_chance,
        is_jammed: res.is_jammed ?? gameState.value.is_jammed
      }

      if (res.is_jammed) {
        triggerShake()
      }

      if (res.payload) {
        executeServerPayload(res.payload)
      }

      upsertSessionRecord(gameState.value)
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 409 && gameState.value) {
        gameState.value.is_jammed = true
        triggerShake()
      }
    } finally {
      isActionPending.value = false
    }
  }

  async function blowUpMachine() {
    if (!activeSessionId.value || !gameState.value) return
    isActionPending.value = true
    try {
      const res = await greedService.useBomb()
      triggerShake()

      gameState.value = {
        ...gameState.value,
        coins_in_machine: res.coins_in_machine,
        wallet: res.wallet,
        bombs: res.bombs,
        jam_chance: res.jam_chance ?? gameState.value.jam_chance,
        is_jammed: res.is_jammed
      }
      upsertSessionRecord(gameState.value)
    } finally {
      isActionPending.value = false
    }
  }

  async function resetCurrentRun() {
    if (!activeSessionId.value) return
    isActionPending.value = true
    try {
      const res = await greedService.resetRun(currentCharacter.value?.id)
      gameState.value = res
      lastPayloadName.value = null
      upsertSessionRecord(res)
    } finally {
      isActionPending.value = false
    }
  }

  function removeSavedSession(sessionId: string) {
    savedSessions.value = savedSessions.value.filter((s) => s.id !== sessionId)
    persistSavedSessions()
  }

  return {
    characters,
    activeSessionId,
    gameState,
    savedSessions,
    isLoading,
    isActionPending,
    isShaking,
    lastPayloadName,
    currentCharacter,
    digits,
    initApp,
    startNewRun,
    connectToSession,
    changeCharacter,
    donateCoin,
    blowUpMachine,
    resetCurrentRun,
    removeSavedSession
  }
})