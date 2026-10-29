<script setup>
import { reactive, ref, computed } from 'vue'

const emit = defineEmits(['register-success', 'go-login'])

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  phone: '',
})
const pesan = ref('')
const pesanTipe = ref('')
const loading = ref(false)
const showPassword = ref(false)
const touched = reactive({
  full_name: false,
  email: false,
  password: false,
})

const nameError = computed(() => {
  if (!touched.full_name) return ''
  if (!form.full_name.trim()) return 'Nama lengkap wajib diisi'
  if (form.full_name.trim().length < 2) return 'Minimal 2 karakter'
  return ''
})

const emailError = computed(() => {
  if (!touched.email) return ''
  if (!form.email) return 'Email wajib diisi'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Format email tidak valid'
  return ''
})

const passwordError = computed(() => {
  if (!touched.password) return ''
  if (!form.password) return 'Password wajib diisi'
  if (form.password.length < 6) return 'Minimal 6 karakter'
  return ''
})

const passwordStrength = computed(() => {
  const pw = form.password
  if (!pw) return { level: 0, label: '' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++

  if (score <= 1) return { level: 1, label: 'Lemah' }
  if (score <= 3) return { level: 2, label: 'Cukup' }
  return { level: 3, label: 'Kuat' }
})

const isFormValid = computed(() => {
  return (
    form.full_name.trim() &&
    form.email &&
    form.password &&
    !nameError.value &&
    !emailError.value &&
    !passwordError.value
  )
})

async function register() {
  touched.full_name = true
  touched.email = true
  touched.password = true

  if (!isFormValid.value) return

  loading.value = true
  pesan.value = ''
  pesanTipe.value = ''

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const hasil = await res.json()

    if (res.ok) {
      pesanTipe.value = 'success'
      pesan.value = hasil.message || 'Akun berhasil dibuat! Silakan masuk.'
      form.full_name = ''
      form.email = ''
      form.password = ''
      form.phone = ''
      Object.keys(touched).forEach((k) => (touched[k] = false))
    } else {
      pesanTipe.value = 'error'
      pesan.value = hasil.message || 'Pendaftaran gagal'
    }
  } catch {
    pesanTipe.value = 'error'
    pesan.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-header">
      <h2 class="auth-title">Buat akun baru</h2>
      <p class="auth-subtitle">Sudah punya akun?
        <button type="button" class="link-btn" @click="$emit('go-login')">Masuk di sini</button>
      </p>
    </div>

    <form @submit.prevent="register" class="auth-form" novalidate>
      <div class="field" :class="{ 'has-error': nameError }">
        <label for="reg-name" class="field-label">Nama lengkap</label>
        <input
          id="reg-name"
          v-model="form.full_name"
          type="text"
          placeholder="Nama lengkapmu"
          autocomplete="name"
          class="field-input"
          @blur="touched.full_name = true"
        />
        <p v-if="nameError" class="field-error" role="alert">{{ nameError }}</p>
      </div>

      <div class="field" :class="{ 'has-error': emailError }">
        <label for="reg-email" class="field-label">Email</label>
        <input
          id="reg-email"
          v-model="form.email"
          type="email"
          placeholder="nama@email.com"
          autocomplete="email"
          class="field-input"
          @blur="touched.email = true"
        />
        <p v-if="emailError" class="field-error" role="alert">{{ emailError }}</p>
      </div>

      <div class="field" :class="{ 'has-error': passwordError }">
        <label for="reg-password" class="field-label">Password</label>
        <div class="field-input-wrap">
          <input
            id="reg-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Minimal 6 karakter"
            autocomplete="new-password"
            class="field-input field-input--has-action"
            @blur="touched.password = true"
          />
          <button
            type="button"
            class="field-action"
            :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
        <p v-if="passwordError" class="field-error" role="alert">{{ passwordError }}</p>

        <div v-if="form.password && !passwordError" class="strength">
          <div class="strength-track">
            <div
              class="strength-fill"
              :class="'strength-fill--' + passwordStrength.level"
              :style="{ width: (passwordStrength.level / 3) * 100 + '%' }"
            ></div>
          </div>
          <span class="strength-label" :class="'strength-label--' + passwordStrength.level">
            {{ passwordStrength.label }}
          </span>
        </div>
      </div>

      <div class="field">
        <label for="reg-phone" class="field-label">
          No. telepon
          <span class="field-optional">opsional</span>
        </label>
        <input
          id="reg-phone"
          v-model="form.phone"
          type="tel"
          placeholder="08xxxxxxxxxx"
          autocomplete="tel"
          class="field-input"
        />
      </div>

      <div
        v-if="pesan"
        class="auth-message"
        :class="'auth-message--' + pesanTipe"
        role="alert"
      >
        {{ pesan }}
      </div>

      <button
        type="submit"
        class="btn-primary"
        :disabled="loading"
      >
        <svg v-if="loading" class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        {{ loading ? 'Memproses...' : 'Buat Akun' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-card);
}

.auth-header {
  margin-bottom: var(--space-lg);
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  margin-bottom: var(--space-xs);
}

.auth-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color var(--transition-fast);
}

.link-btn:hover {
  color: var(--color-primary-hover);
}

.link-btn:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.field-label {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
}

.field-optional {
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.field-input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-md);
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}

.field-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.field-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}

.has-error .field-input,
.has-error .field-input:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px var(--color-error-bg);
}

.field-input-wrap {
  position: relative;
}

.field-input--has-action {
  padding-right: 44px;
}

.field-action {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.field-action:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.field-action:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: -2px;
}

.field-error {
  font-size: 0.8125rem;
  color: var(--color-error);
  line-height: 1.4;
}

.strength {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.strength-track {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width var(--transition-normal), background var(--transition-normal);
}

.strength-fill--1 { background: var(--color-error); }
.strength-fill--2 { background: #f59e0b; }
.strength-fill--3 { background: var(--color-success); }

.strength-label {
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 40px;
}

.strength-label--1 { color: var(--color-error); }
.strength-label--2 { color: #d97706; }
.strength-label--3 { color: var(--color-success); }

.auth-message {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  line-height: 1.5;
}

.auth-message--error {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.auth-message--success {
  background: var(--color-success-bg);
  color: var(--color-green-500);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  height: 46px;
  margin-top: var(--space-sm);
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: inherit;
  color: var(--color-text-on-primary);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.985);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 0.8s linear infinite;
}
</style>