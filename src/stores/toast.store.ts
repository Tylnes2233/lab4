import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ToastItem } from '../types/greed'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([])

  function showToast(message: string, type: ToastItem['type'] = 'info', duration = 4000) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    showToast,
    removeToast
  }
})