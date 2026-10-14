<script setup>
import { ref } from 'vue'
import Login from './Login.vue'
import Register from './Register.vue'

const halaman = ref('login')
const user = ref(JSON.parse(localStorage.getItem('user')))

function logout() {
  localStorage.removeItem('user')
  user.value = null
}
</script>

<template>
  <div v-if="user">
    <h2>Halo, {{ user.full_name }}</h2>
    <p>Email: {{ user.email }} | Role: {{ user.role }}</p>
    <button @click="logout">Logout</button>
  </div>

  <div v-else>
    <button @click="halaman = 'login'">Login</button>
    <button @click="halaman = 'register'">Register</button>

    <Login v-if="halaman === 'login'" @login-success="user = $event" />
    <Register v-else />
  </div>
</template>