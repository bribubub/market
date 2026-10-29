<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'

interface Category {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  category_slug: string
  total_stock: number
}

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const selected = ref('')
const loading = ref(false)
const error = ref('')

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

async function loadCategories() {
  try {
    const res = await fetch('/api/categories')
    if (!res.ok) throw new Error()
    categories.value = await res.json()
  } catch {
    error.value = 'Gagal memuat kategori'
  }
}

async function loadProducts() {
  loading.value = true
  error.value = ''
  try {
    const url = selected.value
      ? `/api/products?category=${encodeURIComponent(selected.value)}`
      : '/api/products'
    const res = await fetch(url)
    if (!res.ok) throw new Error()
    products.value = await res.json()
  } catch {
    error.value = 'Gagal memuat produk'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadProducts()
})

watch(selected, loadProducts)
</script>

<template>
  <h2>Produk</h2>

  <div class="filter">
    <button :disabled="selected === ''" @click="selected = ''">Semua</button>
    <button
      v-for="c in categories"
      :key="c.id"
      :disabled="selected === c.slug"
      @click="selected = c.slug"
    >
      {{ c.name }}
    </button>
  </div>

  <p v-if="loading">Memuat...</p>
  <p v-else-if="error">{{ error }}</p>
  <p v-else-if="products.length === 0">Belum ada produk</p>

  <div v-else class="grid">
    <RouterLink
      v-for="p in products"
      :key="p.id"
      :to="`/products/${p.id}`"
      class="card"
    >
      <img v-if="p.image_url" :src="p.image_url" :alt="p.name" />
      <small>{{ p.category }}</small>
      <h3>{{ p.name }}</h3>
      <p>{{ rupiah(p.price) }}</p>
      <small v-if="p.total_stock === 0">Stok habis</small>
      <small v-else>Stok: {{ p.total_stock }}</small>
    </RouterLink>
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.card {
  border: 1px solid #888;
  padding: 12px;
  display: block;
  text-decoration: none;
  color: inherit;
}
.card img {
  width: 100%;
  display: block;
}
</style>