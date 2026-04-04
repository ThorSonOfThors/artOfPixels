<template>
  <nav class="navbar">
    <div class="left">
      <router-link to="/">Home</router-link>
      <router-link to="/draw">Draw</router-link>
      <router-link to="/gallery">Gallery</router-link>
    </div>

    <div class="right">
      <template v-if="auth.user">
        <user-dropdown/>
      </template>

      <template v-else>
        <router-link to="/login">Login</router-link>
        <router-link to="/register">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import UserDropdown from './UserDropdown.vue'


const auth = useAuthStore()
const router = useRouter()


</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 10px 20px;
  background: #222;
  color: white;
}

a {
  margin-right: 15px;
  color: white;
  text-decoration: none;
}

.username {
  margin-right: 10px;
}
</style>