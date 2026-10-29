<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { apiFetch } from '../auth'

interface CartItem {
  id: number
  quantity: number
  variant_id: number
  size: string
  stock: number
  product_id: number
  name: string
  price: number
  image_url: string | null
  subtotal: number
}

const router = useRouter()

const items = ref<CartItem[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const message = ref('')

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

function toLogin() {
  router.push({ path: '/login', query: { redirect: '/cart' } })
}

async function loadCart() {
  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch('/api/cart')
    if (res.status === 401) return toLogin()

    const data = await res.json()
    if (!res.ok) {
      error.value = data.message || 'Gagal memuat keranjang'
      return
    }
    items.value = data.items
    total.value = data.total
  } catch {
    error.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}

async function changeQty(item: CartItem, newQty: number) {
  if (newQty < 1) return
  message.value = ''

  try {
    const res = await apiFetch(`/api/cart/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: newQty }),
    })
    if (res.status === 401) return toLogin()

    const data = await res.json()
    if (!res.ok) {
      message.value = data.message
      return
    }
    await loadCart()
  } catch {
    message.value = 'Tidak bisa terhubung ke server'
  }
}

async function removeItem(item: CartItem) {
  message.value = ''

  try {
    const res = await apiFetch(`/api/cart/${item.id}`, { method: 'DELETE' })
    if (res.status === 401) return toLogin()

    const data = await res.json()
    if (!res.ok) {
      message.value = data.message
      return
    }
    await loadCart()
  } catch {
    message.value = 'Tidak bisa terhubung ke server'
  }
}

onMounted(loadCart)
</script>

<template>
  <h2>Keranjang</h2>

  <p v-if="loading">Memuat...</p>
  <p v-else-if="error">{{ error }}</p>

  <div v-else-if="items.length === 0">
    <p>Keranjang masih kosong</p>
    <RouterLink to="/products">Lihat produk</RouterLink>
  </div>

  <div v-else>
    <p v-if="message">{{ message }}</p>

    <div v-for="item in items" :key="item.id" class="row">
      <img v-if="item.image_url" :src="item.image_url" :alt="item.name" />

      <div class="info">
        <RouterLink :to="`/products/${item.product_id}`">{{ item.name }}</RouterLink>
        <div>Ukuran {{ item.size }}</div>
        <div>{{ rupiah(item.price) }}</div>
        <small v-if="item.quantity > item.stock">
          Stok tersisa {{ item.stock }}, kurangi jumlahnya
        </small>
      </div>

      <div class="qty">
        <button :disabled="item.quantity <= 1" @click="changeQty(item, item.quantity - 1)">-</button>
        <span>{{ item.quantity }}</span>
        <button :disabled="item.quantity >= item.stock" @click="changeQty(item, item.quantity + 1)">+</button>
      </div>

      <div class="sub">{{ rupiah(item.subtotal) }}</div>

      <button @click="removeItem(item)">Hapus</button>
    </div>

    <h3>Total: {{ rupiah(total) }}</h3>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid #888;
  padding: 12px 0;
}
.row img {
  width: 80px;
  display: block;
}
.qty {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>