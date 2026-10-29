<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { user, clearSession } from './auth'

const router = useRouter()

function logout() {
  clearSession()
  router.push('/login')
}
</script>

<template>
  <nav style="display: flex; gap: 12px; align-items: center">
    <RouterLink to="/products">Produk</RouterLink>

    <template v-if="user">
      <RouterLink to="/cart">Keranjang</RouterLink>
      <RouterLink to="/addresses">Alamat</RouterLink>
      <span>Halo, {{ user.full_name }} ({{ user.role }})</span>
      <button @click="logout">Logout</button>
    </template>

    <template v-else>
      <RouterLink to="/login">Login</RouterLink>
      <RouterLink to="/register">Register</RouterLink>
    </template>
  </nav>

  <hr />

  <RouterView />
</template>