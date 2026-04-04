<template>
  <div class="profile">

    <h2>Edit Profile</h2>

    <!-- EMAIL (readonly) -->
    <div class="field">
      <label>Email</label>
      <input :value="auth.user?.email" disabled />
    </div>

    <!-- USERNAME -->
    <div class="field">
      <label>Username</label>
      <input v-model="username" placeholder="Username" />
    </div>

    <!-- PASSWORD -->
    <div class="field">
      <label>New Password</label>
      <div class="password-wrapper">
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          placeholder="New password"
        />
        <span @click="togglePassword">👁️</span>
      </div>
    </div>

    <!-- CONFIRM PASSWORD -->
    <div class="field">
      <label>Confirm Password</label>
      <div class="password-wrapper">
        <input
          :type="showPassword2 ? 'text' : 'password'"
          v-model="confirmPassword"
          placeholder="Confirm password"
        />
        <span @click="togglePassword2">👁️</span>
      </div>
    </div>

    <!-- ACTION -->
    <button @click="save" :disabled="loading">
      {{ loading ? 'Saving...' : 'Save Changes' }}
    </button>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

// STATE
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const showPassword = ref(false)
const showPassword2 = ref(false)

// INIT
onMounted(() => {
  username.value = auth.username
})

// TOGGLES
function togglePassword() {
  showPassword.value = !showPassword.value
}

function togglePassword2() {
  showPassword2.value = !showPassword2.value
}

// SAVE
async function save() {
  try {
    loading.value = true

    // 🔥 VALIDATION
    if (!username.value) {
      alert('Username required')
      return
    }

    if (password.value && password.value !== confirmPassword.value) {
      alert('Passwords do not match')
      return
    }

    // 🔥 UPDATE USERNAME (profiles table)
    const { error: usernameError } = await supabase
      .from('profiles')
      .update({ username: username.value })
      .eq('id', auth.user.id)

    if (usernameError) throw usernameError

    // 🔥 UPDATE PASSWORD (only if provided)
    if (password.value) {
      const { error: passError } = await supabase.auth.updateUser({
        password: password.value
      })

      if (passError) throw passError
    }

    // 🔥 refresh store
    await auth.fetchProfile()

    alert('Profile updated successfully')

    // reset passwords
    password.value = ''
    confirmPassword.value = ''

  } catch (err: any) {
    alert(err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile {
  max-width: 400px;
  margin: 40px auto;
  background: #1e1e1e;
  padding: 20px;
  border-radius: 12px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-size: 13px;
  color: #aaa;
}

input {
  padding: 8px;
  border-radius: 6px;
  border: none;
  background: #2a2a2a;
  color: white;
}

input:disabled {
  opacity: 0.6;
}

/* PASSWORD INPUT */
.password-wrapper {
  display: flex;
  align-items: center;
  background: #2a2a2a;
  border-radius: 6px;
}

.password-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 8px;
}

.password-wrapper span {
  cursor: pointer;
  padding: 0 10px;
}

/* BUTTON */
button {
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #4caf50;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  background: #45a049;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>