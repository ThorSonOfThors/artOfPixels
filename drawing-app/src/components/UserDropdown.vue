<template>
  <div class="user-dropdown">
    <button class="dropdown-trigger" @click="toggleDropdown">
      <div class="user-avatar">
        <span>{{ auth.user?.username?.charAt(0).toUpperCase() || 'U' }}</span>
      </div>
      <span class="username">{{ auth?.username || 'User' }}</span>
      <span class="dropdown-arrow" :class="{ 'open': isOpen }">▼</span>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <div class="dropdown-header">
          <div class="user-avatar-large">
            {{ auth.user?.username?.charAt(0).toUpperCase() || 'U' }}
          </div>
          <div class="user-details">
            <p class="user-name">{{ auth.user?.username }}</p>
            <p class="user-email">{{ auth.user?.email }}</p>
          </div>
        </div>
        
        <div class="dropdown-divider"></div>
        
        <router-link to="/my-gallery" class="dropdown-item" @click="closeDropdown">
          <span>🖼️</span>
          <span>My Artworks</span>
        </router-link>
        
        <router-link to="/edit-profile" class="dropdown-item" @click="closeDropdown">
          <span>⚙️</span>
          <span>Profile Settings</span>
        </router-link>
        
        <div class="dropdown-divider"></div>
        
        <button class="dropdown-item logout-item" @click="handleLogout">
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const isOpen = ref(false)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

async function handleLogout() {
  await auth.logout()
  closeDropdown()
  router.push('/')
}

function handleClickOutside(event: MouseEvent) {
  const dropdown = document.querySelector('.user-dropdown')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  color: #e0e0e0;
  font-weight: 600;
}

.dropdown-trigger:hover {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
  transform: translateY(-2px);
}

.dropdown-trigger:active {
  transform: translateY(0);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4caf50, #45a049);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  color: white;
}

.username {
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.3s ease;
  color: #4caf50;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

/* DROPDOWN MENU */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 280px;
  background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 1001;
  backdrop-filter: blur(10px);
}

.dropdown-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(76, 175, 80, 0.05);
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4caf50, #45a049);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: #888;
  word-break: break-all;
}

.dropdown-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.5), transparent);
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #e0e0e0;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  text-align: left;
  font-weight: 500;
}

.dropdown-item:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  padding-left: 24px;
}

.dropdown-item span:first-child {
  font-size: 18px;
  width: 24px;
}

.logout-item {
  color: #ff6b6b;
}

.logout-item:hover {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* Dropdown animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Focus styles for accessibility */
.dropdown-trigger:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

.dropdown-item:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: -2px;
}
</style>