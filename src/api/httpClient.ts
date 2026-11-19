import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useToastStore } from '../stores/toast.store'

const ACTIVE_SESSION_KEY = 'greed_active_session_id'

export function getStoredActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY)
}

export function setStoredActiveSessionId(sessionId: string | null): void {
  if (sessionId) {
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId)
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY)
  }
}

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://wurger-palantir.duckdns.org/demo-api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const activeSessionId = getStoredActiveSessionId()
    if (activeSessionId) {
      config.headers['X-Session-ID'] = activeSessionId
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

httpClient.interceptors.response.use(
  (response) => {
    const toastStore = useToastStore()
    const data = response.data as Record<string, unknown> | null

    if (data && typeof data.message === 'string' && data.message.trim()) {
      toastStore.showToast(data.message, 'success')
    }

    return response
  },
  (error: AxiosError<{ detail?: string | Array<{ msg: string }>; message?: string }>) => {
    const toastStore = useToastStore()
    const status = error.response?.status
    const responseData = error.response?.data

    let errorMessage = 'Помилка з’єднання з сервером'

    if (typeof responseData?.detail === 'string') {
      errorMessage = responseData.detail
    } else if (Array.isArray(responseData?.detail) && responseData.detail.length > 0) {
      errorMessage = responseData.detail.map((d) => d.msg).join(', ')
    } else if (typeof responseData?.message === 'string') {
      errorMessage = responseData.message
    } else if (status === 409) {
      errorMessage = 'Автомат заклинило! Використайте бомбу або скиньте забіг.'
    } else if (status === 429) {
      errorMessage = 'Занадто багато запитів! Не спамте кліками.'
    } else if (status === 404) {
      errorMessage = 'Сесію не знайдено (404 Not Found)'
    }

    const toastType = status === 409 || status === 429 ? 'warning' : 'error'
    toastStore.showToast(errorMessage, toastType)

    return Promise.reject(error)
  }
)