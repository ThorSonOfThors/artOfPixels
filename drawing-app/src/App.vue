<template>
  <div id="app">
    <Navbar />

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

// ✅ import types
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

onMounted(async () => {
  const auth = useAuthStore()

  // initial session
  await auth.fetchUser()

  // ✅ properly typed listener
  supabase.auth.onAuthStateChange(
    async (_event: AuthChangeEvent, session: Session | null) => {
      auth.user = session?.user || null

      if (auth.user) {
        await auth.fetchProfile()
      } else {
        auth.username = ''
      }
    }
  )
})
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.page {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>