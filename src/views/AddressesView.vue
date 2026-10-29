<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../auth'

interface Address {
  id: number
  recipient: string
  street: string
  city: string
  province: string
  postal_code: string
  country: string
  is_default: number
}

const router = useRouter()

const addresses = ref<Address[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const message = ref('')

const form = reactive({
  recipient: '',
  street: '',
  city: '',
  province: '',
  postal_code: '',
  is_default: false,
})

function toLogin() {
  router.push({ path: '/login', query: { redirect: '/addresses' } })
}

async function loadAddresses() {
  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch('/api/addresses')
    if (res.status === 401) return toLogin()

    const data = await res.json()
    if (!res.ok) {
      error.value = data.message || 'Gagal memuat alamat'
      return
    }
    addresses.value = data
  } catch {
    error.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}

async function addAddress() {
  saving.value = true
  message.value = ''
  try {
    const res = await apiFetch('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    if (res.status === 401) return toLogin()

    const data = await res.json()
    message.value = data.message

    if (res.ok) {
      form.recipient = ''
      form.street = ''
      form.city = ''
      form.province = ''
      form.postal_code = ''
      form.is_default = false
      await loadAddresses()
    }
  } catch {
    message.value = 'Tidak bisa terhubung ke server'
  } finally {
    saving.value = false
  }
}

async function makeDefault(a: Address) {
  message.value = ''
  try {
    const res = await apiFetch(`/api/addresses/${a.id}/default`, { method: 'PATCH' })
    if (res.status === 401) return toLogin()

    const data = await res.json()
    message.value = data.message
    if (res.ok) await loadAddresses()
  } catch {
    message.value = 'Tidak bisa terhubung ke server'
  }
}

async function removeAddress(a: Address) {
  message.value = ''
  try {
    const res = await apiFetch(`/api/addresses/${a.id}`, { method: 'DELETE' })
    if (res.status === 401) return toLogin()

    const data = await res.json()
    message.value = data.message
    if (res.ok) await loadAddresses()
  } catch {
    message.value = 'Tidak bisa terhubung ke server'
  }
}

onMounted(loadAddresses)
</script>

<template>
  <h2>Alamat pengiriman</h2>

  <p v-if="loading">Memuat...</p>
  <p v-else-if="error">{{ error }}</p>

  <div v-else>
    <p v-if="addresses.length === 0">Belum ada alamat</p>

    <div v-for="a in addresses" :key="a.id" class="card">
      <strong>{{ a.recipient }}</strong>
      <span v-if="a.is_default"> (Utama)</span>
      <div>{{ a.street }}</div>
      <div>{{ a.city }}, {{ a.province }} {{ a.postal_code }}</div>
      <div>{{ a.country }}</div>

      <div class="actions">
        <button v-if="!a.is_default" @click="makeDefault(a)">Jadikan utama</button>
        <button @click="removeAddress(a)">Hapus</button>
      </div>
    </div>
  </div>

  <p v-if="message">{{ message }}</p>

  <h3>Tambah alamat</h3>
  <input v-model="form.recipient" type="text" placeholder="Nama penerima" /><br /><br />
  <input v-model="form.street" type="text" placeholder="Jalan, nomor, RT/RW" /><br /><br />
  <input v-model="form.city" type="text" placeholder="Kota" /><br /><br />
  <input v-model="form.province" type="text" placeholder="Provinsi" /><br /><br />
  <input v-model="form.postal_code" type="text" placeholder="Kode pos" /><br /><br />

  <label>
    <input v-model="form.is_default" type="checkbox" />
    Jadikan alamat utama
  </label>
  <br /><br />

  <button :disabled="saving" @click="addAddress">
    {{ saving ? 'Menyimpan...' : 'Simpan alamat' }}
  </button>
</template>

<style scoped>
.card {
  border: 1px solid #888;
  padding: 12px;
  margin-bottom: 12px;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>