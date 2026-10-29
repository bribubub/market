import { ref } from 'vue'

export interface User {
  id: number
  full_name: string
  email: string
  role: string
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    if (raw && localStorage.getItem('token')) return JSON.parse(raw)
  } catch {
    // data di localStorage rusak, anggap belum login
  }
  return null
}

export const user = ref<User | null>(loadUser())

export const getToken = () => localStorage.getItem('token')

export function setSession(token: string, u: User) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(u))
  user.value = u
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  user.value = null
}

// fetch yang otomatis membawa token; kalau token ditolak server, sesi dibersihkan
export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = getToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...options, headers })
  if (res.status === 401 && token) clearSession()
  return res
}