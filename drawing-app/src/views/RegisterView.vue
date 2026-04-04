<template>
  <div class="register">

    <h2>Register</h2>

    <input v-model="email" placeholder="Email" />

    <input v-model="username" placeholder="Username" />

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

    <!-- CONFIRM PASSWORD -->
    <div class="password-field">
      <input
        :type="showPassword2 ? 'text' : 'password'"
        v-model="password2"
        placeholder="Confirm Password"
      />
      <button @click="showPassword2 = !showPassword2">
        👁️
      </button>
    </div>

    <button @click="register">Register</button>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const username = ref('')
const password = ref('')
const password2 = ref('')

const showPassword = ref(false)
const showPassword2 = ref(false)

const router = useRouter()

async function register() {
  // 🔥 VALIDATION
  if (!email.value || !password.value || !username.value) {
    alert('All fields are required')
    return
  }

  if (password.value !== password2.value) {
    alert('Passwords do not match')
    return
  }

  if (password.value.length < 6) {
    alert('Password must be at least 6 characters')
    return
  }

  // 🔥 SIGN UP WITH USERNAME METADATA
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        username: username.value
      }
    }
  })

  if (error) {
    alert(error.message)
  } else {
    alert('Check your email for confirmation!')
    router.push('/login')
  }
}
</script>

<style scoped>
.register {
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