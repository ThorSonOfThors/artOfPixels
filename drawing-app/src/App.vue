<template>
  <div id="app">
    <Navbar />

    <!-- 🔥 MAIN CONTENT WRAPPER -->
    <main class="page">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'

onMounted(async () => {
  const auth = useAuthStore()

  // initial session
  await auth.fetchUser()

  // auth listener
  supabase.auth.onAuthStateChange(async (_event, session) => {
    auth.user = session?.user || null

    if (auth.user) {
      await auth.fetchProfile()
    } else {
      auth.username = ''
    }
  })
})
</script>

<style>
/* 🔥 Ensure App takes full space */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

/* 🔥 Main content fills remaining space */
.page {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>