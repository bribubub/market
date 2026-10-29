<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { setSession } from './auth'

const router = useRouter()
const route = useRoute()

const form = reactive({
  email: '',
  password: '',
})
const showPassword = ref(false)
const pesan = ref('')
const loading = ref(false)

async function login() {
  loading.value = true
  pesan.value = ''

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const hasil = await res.json()

    if (!res.ok) {
      pesan.value = hasil.message
      return
    }

    // simpan token + data user, navigasi otomatis ikut berubah
    setSession(hasil.token, hasil.user)

    // hanya terima alamat internal supaya tidak bisa dibelokkan ke situs lain
    const redirect = route.query.redirect
    const target =
      typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/products'
    router.push(target)
  } catch {
    pesan.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card">
    <h2>Masuk ke akunmu</h2>
    <p class="sub">
      Belum punya akun?
      <RouterLink to="/register">Buat akun baru</RouterLink>
    </p>

    <form @submit.prevent="login">
      <label for="email">Email</label>
      <input id="email" v-model="form.email" type="email" placeholder="nama@email.com" />

      <label for="password">Password</label>
      <div class="pw">
        <input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Masukkan password"
        />
        <button
          type="button"
          class="eye"
          :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
          @click="showPassword = !showPassword"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            <line v-if="showPassword" x1="3" y1="3" x2="21" y2="21" />
          </svg>
        </button>
      </div>

      <button type="submit" class="submit" :disabled="loading">
        {{ loading ? 'Memproses...' : 'Masuk' }}
      </button>
    </form>

    <p v-if="pesan" class="error">{{ pesan }}</p>
  </div>
</template>

<style scoped>
.card {
  max-width: 420px;
  padding: 32px 40px;
  border-radius: 16px;
  background: #334155;
  color: #f1f5f9;
}
h2 {
  margin: 0 0 8px;
}
.sub {
  margin: 0 0 24px;
  color: #cbd5e1;
}
.sub a {
  color: #60a5fa;
}
label {
  display: block;
  margin: 16px 0 8px;
  font-weight: 600;
  font-size: 14px;
}
input {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 20px;
  border: 1px solid #475569;
  border-radius: 12px;
  background: #1e293b;
  color: #f1f5f9;
  font-size: 16px;
}
.pw {
  position: relative;
}
.pw input {
  padding-right: 52px;
}
.eye {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px;
}
.submit {
  width: 100%;
  margin-top: 28px;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: #60a5fa;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  margin: 16px 0 0;
  color: #fca5a5;
}
</style>