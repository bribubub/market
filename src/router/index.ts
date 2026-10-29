import { createRouter, createWebHistory } from 'vue-router'
import Login from '../Login.vue'
import Register from '../Register.vue'
import ProductsView from '../views/ProductsView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import CartView from '../views/CartView.vue'
import AddressesView from '../views/AddressesView.vue'
import { getToken } from '../auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/products' },
    { path: '/products', name: 'products', component: ProductsView },
    { path: '/products/:id', name: 'product-detail', component: ProductDetailView },
    { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true } },
    { path: '/addresses', name: 'addresses', component: AddressesView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login },
    { path: '/register', name: 'register', component: Register },
  ],
})

// Halaman bertanda requiresAuth hanya bisa dibuka kalau sudah ada token
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router