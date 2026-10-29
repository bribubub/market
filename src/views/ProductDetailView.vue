<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { apiFetch, getToken } from '../auth'

interface Variant {
  id: number
  size: string
  stock: number
}

interface ProductDetail {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  category_slug: string
  variants: Variant[]
}

const route = useRoute()
const router = useRouter()

const product = ref<ProductDetail | null>(null)
const selectedVariantId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')

const adding = ref(false)
const cartMessage = ref('')
const cartFailed = ref(false)

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

const selectedVariant = computed(
  () => product.value?.variants.find((v) => v.id === selectedVariantId.value) ?? null
)

async function loadProduct(id: string) {
  loading.value = true
  error.value = ''
  product.value = null
  selectedVariantId.value = null
  cartMessage.value = ''

  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`)
    const data = await res.json()
    if (!res.ok) {
      error.value = data.message || 'Gagal memuat produk'
      return
    }
    product.value = data
  } catch {
    error.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}

async function addToCart() {
  cartMessage.value = ''

  if (!selectedVariant.value) {
    cartFailed.value = true
    cartMessage.value = 'Pilih ukuran terlebih dahulu'
    return
  }

  if (!getToken()) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  adding.value = true
  try {
    const res = await apiFetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ variant_id: selectedVariant.value.id, quantity: 1 }),
    })

    if (res.status === 401) {
      router.push({ path: '/login', query: { redirect: route.fullPath } })
      return
    }

    const data = await res.json()
    cartFailed.value = !res.ok
    cartMessage.value = data.message
  } catch {
    cartFailed.value = true
    cartMessage.value = 'Tidak bisa terhubung ke server'
  } finally {
    adding.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') loadProduct(id)
  },
  { immediate: true }
)
</script>

<template>
  <RouterLink to="/products">&larr; Kembali ke produk</RouterLink>

  <p v-if="loading">Memuat...</p>
  <p v-else-if="error">{{ error }}</p>

  <div v-else-if="product" class="detail">
    <img v-if="product.image_url" :src="product.image_url" :alt="product.name" />

    <div>
      <small>{{ product.category }}</small>
      <h2>{{ product.name }}</h2>
      <h3>{{ rupiah(product.price) }}</h3>
      <p>{{ product.description }}</p>

      <h4>Pilih ukuran</h4>
      <div class="sizes">
        <button
          v-for="v in product.variants"
          :key="v.id"
          :disabled="v.stock === 0"
          :class="{ active: v.id === selectedVariantId }"
          @click="selectedVariantId = v.id"
        >
          {{ v.size }}
        </button>
      </div>

      <p v-if="selectedVariant">
        Ukuran {{ selectedVariant.size }}: stok {{ selectedVariant.stock }}
      </p>
      <p v-else>Pilih ukuran untuk melihat stok</p>

      <button :disabled="adding" @click="addToCart">
        {{ adding ? 'Memproses...' : 'Tambah ke keranjang' }}
      </button>

      <p v-if="cartMessage">
        {{ cartMessage }}
        <RouterLink v-if="!cartFailed" to="/cart">Lihat keranjang</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.detail {
  display: grid;
  grid-template-columns: minmax(200px, 400px) 1fr;
  gap: 24px;
  margin-top: 16px;
}
.detail img {
  width: 100%;
  display: block;
}
.sizes {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.sizes button.active {
  outline: 2px solid currentColor;
}
</style>