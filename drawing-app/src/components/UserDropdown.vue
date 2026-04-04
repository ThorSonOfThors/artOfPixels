<template>
  <div class="dropdown" ref="dropdownRef">
    <!-- TRIGGER -->
    <div class="trigger" @click="toggle">
      👤 {{ auth.username }}
      <span class="arrow">▾</span>
    </div>

    <!-- MENU -->
    <div v-if="open" class="menu">
      <div class="item" @click="go('/edit-profile')">
        ✏️ Edit Profile
      </div>

      <div class="item" @click="go('/my-gallery')">
        🖼️ My Gallery
      </div>

      <div class="divider"></div>

      <div class="item logout" @click="logout">
        🚪 Logout
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)


async function logout() {
  await auth.logout()
  open.value = false
  router.push('/login')
}


// toggle
function toggle() {
  open.value = !open.value
}

// navigation
function go(path: string) {
  open.value = false
  router.push(path)
}

// click outside
function handleClickOutside(e: MouseEvent) {
  if (!dropdownRef.value) return
  if (!dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
}

/* trigger */
.trigger {
  cursor: pointer;
  padding: 8px 12px;
  background: #2a2a2a;
  border-radius: 8px;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}

.trigger:hover {
  background: #3a3a3a;
}

.arrow {
  font-size: 12px;
}

/* menu */
.menu {
  position: absolute;
  right: 0;
  top: 110%;
  background: #1f1f1f;
  border-radius: 10px;
  padding: 8px;
  min-width: 160px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
  z-index: 100;
}

/* items */
.item {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.item:hover {
  background: #333;
}

.logout:hover {
  background: #5a1a1a;
}

/* divider */
.divider {
  height: 1px;
  background: #444;
  margin: 6px 0;
}
</style>