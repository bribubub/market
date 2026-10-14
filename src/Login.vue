<script setup>
import { reactive, ref } from 'vue'

const emit = defineEmits(['login-success'])

const form = reactive({
  email: '',
  password: '',
})
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
    pesan.value = hasil.message

    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(hasil.user))
      emit('login-success', hasil.user)
    }
  } catch (err) {
    pesan.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <h2>Login</h2>

  <input v-model="form.email" type="email" placeholder="Email" /><br /><br />
  <input v-model="form.password" type="password" placeholder="Password" /><br /><br />

  <button @click="login" :disabled="loading">
    {{ loading ? 'Memproses...' : 'Login' }}
  </button>

  <p>{{ pesan }}</p>
</template>