<template>
  <div class="login">

    <h2>Login</h2>

    <input v-model="email" placeholder="Email" />

    <!-- PASSWORD -->
    <div class="password-field">
      <input
        :type="showPassword ? 'text' : 'password'"
        v-model="password"
        placeholder="Password"
      />
      <button @click="showPassword = !showPassword">
        👁️
      </button>
    </div>

    <button @click="login">Login</button>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const router = useRouter()
const auth = useAuthStore()

async function login() {
  if (!email.value || !password.value) {
    alert('All fields are required')
    return
  }

  try {
    await auth.login(email.value, password.value)
    router.push('/draw')
  } catch (err: any) {
    alert(err.message)
  }
}
</script>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 300px;
  margin: auto;
  padding-top: 50px;
}

input {
  padding: 8px;
  border-radius: 6px;
  border: none;
}

button {
  padding: 8px;
  border-radius: 6px;
  background: #444;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background: #666;
}

/* PASSWORD FIELD */
.password-field {
  display: flex;
  align-items: center;
}

.password-field input {
  flex: 1;
}

.password-field button {
  margin-left: 5px;
}
</style>