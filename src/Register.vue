<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  phone: '',
})
const pesan = ref('')
const loading = ref(false)

async function register() {
  loading.value = true
  pesan.value = ''

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const hasil = await res.json()
    pesan.value = hasil.message

    if (res.ok) {
      form.full_name = ''
      form.email = ''
      form.password = ''
      form.phone = ''
    }
  } catch (err) {
    pesan.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <h2>Register</h2>

  <input v-model="form.full_name" type="text" placeholder="Nama lengkap" /><br /><br />
  <input v-model="form.email" type="email" placeholder="Email" /><br /><br />
  <input v-model="form.password" type="password" placeholder="Password (min. 6 karakter)" /><br /><br />
  <input v-model="form.phone" type="text" placeholder="No. telepon (opsional)" /><br /><br />

  <button @click="register" :disabled="loading">
    {{ loading ? 'Memproses...' : 'Daftar' }}
  </button>

  <p>{{ pesan }}</p>
</template>