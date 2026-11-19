<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { X } from 'lucide-vue-next'
import { useToastStore } from '../stores/toast.store'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

const alertClass = (type: string) => {
  if (type === 'success') return 'alert-success'
  if (type === 'warning') return 'alert-warning'
  if (type === 'error') return 'alert-error'
  return 'alert-info'
}
</script>

<template>
  <div class="toast toast-top toast-end z-50 max-w-sm">
    <div
      v-for="item in toasts"
      :key="item.id"
      class="alert shadow-lg flex justify-between items-center gap-2 text-sm"
      :class="alertClass(item.type)"
    >
      <span>{{ item.message }}</span>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-circle"
        @click="toastStore.removeToast(item.id)"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>