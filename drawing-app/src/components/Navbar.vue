<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">
        <router-link to="/" class="logo-link">
          <img src="../assets/logo.png" alt="Art Of Pixels" class="logo-img" />
        </router-link>
      </div>

      <!-- Desktop Navigation -->
      <div class="nav-links left">
        <router-link to="/draw" class="nav-link">Draw</router-link>
        <router-link to="/gallery" class="nav-link">Gallery</router-link>
      </div>

      <div class="nav-links right">
        <template v-if="auth.user">
          <user-dropdown/>
        </template>

        <template v-else>
          <router-link to="/login" class="nav-link">Login</router-link>
          <router-link to="/register" class="nav-link btn-primary">Register</router-link>
        </template>
      </div>

      <!-- Mobile Menu Button - Now on the RIGHT -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu" aria-label="Menu">
        {{ mobileMenuOpen ? '✕' : '☰' }}
      </button>
    </div>

    <!-- Mobile Navigation Menu - Full Screen -->
    <div class="nav-links-mobile" :class="{ open: mobileMenuOpen }">
      <router-link to="/draw" class="nav-link" @click="closeMobileMenu">Draw</router-link>
      <router-link to="/gallery" class="nav-link" @click="closeMobileMenu">Gallery</router-link>
      
      <template v-if="auth.user">
        <router-link to="/edit-profile" class="nav-link" @click="closeMobileMenu">Edit Profile</router-link>
        <button @click="handleLogout" class="nav-link btn-primary">Logout</button>
      </template>

      <template v-else>
        <router-link to="/login" class="nav-link" @click="closeMobileMenu">Login</router-link>
        <router-link to="/register" class="nav-link btn-primary" @click="closeMobileMenu">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import UserDropdown from './UserDropdown.vue'

const auth = useAuthStore()
const mobileMenuOpen = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  } else {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

function handleLogout() {
  auth.logout()
  closeMobileMenu()
}

// Clean up on component unmount
watch(() => mobileMenuOpen.value, (isOpen) => {
  if (!isOpen) {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #0a0f0a 0%, #0d1a0d 100%);
  border-bottom: 2px solid #2ecc2e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Logo Styles - Always on LEFT */
.logo {
  order: 1;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.logo-link:hover {
  transform: scale(1.05);
}

.logo-img {
  height: 90px;
  width: auto;
  object-fit: contain;
}

/* Desktop Navigation */
.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.left {
  flex: 1;
  justify-content: flex-start;
  order: 2;
}

.right {
  justify-content: flex-end;
  order: 3;
}

/* Mobile Menu Button - On the RIGHT */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: #2ecc2e;
  font-size: 32px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  z-index: 1002;
  order: 4;
  font-weight: bold;
}

.mobile-menu-btn:hover {
  background: rgba(46, 204, 46, 0.1);
  transform: scale(1.05);
}

.mobile-menu-btn:active {
  transform: scale(0.95);
}

/* Base Link Styles */
.nav-link {
  position: relative;
  padding: 0.5rem 1rem;
  color: #e0e0e0;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  border-radius: 8px;
  white-space: nowrap;
}

/* Link Hover Effects */
.nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #2ecc2e, #27ae60);
  transition: width 0.3s ease;
}

.nav-link:hover::before {
  width: 70%;
}

.nav-link:hover {
  color: #2ecc2e;
  background: rgba(46, 204, 46, 0.1);
  transform: translateY(-1px);
}

/* Active Link State */
.router-link-active {
  color: #2ecc2e;
  background: rgba(46, 204, 46, 0.15);
  font-weight: 600;
}

.router-link-active::before {
  width: 70%;
  height: 2px;
  background: linear-gradient(90deg, #2ecc2e, #27ae60);
}

/* Primary Button Style */
.btn-primary {
  background: linear-gradient(135deg, #2ecc2e 0%, #27ae60 100%);
  color: #0a0f0a;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: 25px;
  box-shadow: 0 2px 8px rgba(46, 204, 46, 0.3);
}

.btn-primary::before {
  display: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 46, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Focus States */
.nav-link:focus-visible {
  outline: 2px solid #2ecc2e;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ============================================ */
/* MOBILE MENU STYLES - FULL SCREEN */
/* ============================================ */
.nav-links-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a0f0a 0%, #0d1a0d 100%);
  z-index: 1001;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  padding: 80px 20px;
}

.nav-links-mobile.open {
  transform: translateX(0);
  display: flex !important;
}

.nav-links-mobile .nav-link {
  font-size: 1.8rem;
  padding: 1.2rem 2rem;
  width: 85%;
  max-width: 350px;
  text-align: center;
  color: #e0e0e0;
  text-decoration: none;
  border-radius: 16px;
  transition: all 0.3s ease;
  background: rgba(46, 204, 46, 0.1);
  border: 2px solid rgba(46, 204, 46, 0.3);
  white-space: normal;
  font-weight: 600;
}

.nav-links-mobile .nav-link:hover,
.nav-links-mobile .nav-link:active {
  background: rgba(46, 204, 46, 0.25);
  transform: scale(1.05);
  color: #2ecc2e;
}

.nav-links-mobile .btn-primary {
  background: linear-gradient(135deg, #2ecc2e 0%, #27ae60 100%);
  color: #0a0f0a;
  font-weight: 700;
  border: none;
  font-size: 1.8rem;
  padding: 1.2rem 2rem;
  width: 85%;
  max-width: 350px;
}

.nav-links-mobile .btn-primary:hover,
.nav-links-mobile .btn-primary:active {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: #ffffff;
  transform: scale(1.05);
}

/* Remove the close button since hamburger turns into X */
.nav-links-mobile .close-menu-btn {
  display: none;
}

/* ============================================ */
/* MOBILE RESPONSIVE BREAKPOINTS */
/* ============================================ */
@media (max-width: 768px) {
  .nav-container {
    padding: 0.75rem 1rem;
    justify-content: space-between;
  }

  /* Hide desktop nav links */
  .nav-links {
    display: none;
  }

  /* Show mobile menu button on RIGHT */
  .mobile-menu-btn {
    display: block;
  }

  /* Logo stays on LEFT */
  .logo {
    order: 1;
  }

  .mobile-menu-btn {
    order: 2;
  }

  /* Ensure mobile menu is hidden by default */
  .nav-links-mobile {
    display: flex;
  }
  
  .nav-links-mobile:not(.open) {
    display: flex !important;
    transform: translateX(100%);
  }

  .logo-img {
    height: 60px;
  }
  
  .nav-links-mobile .nav-link {
    font-size: 1.5rem;
    padding: 1rem 1.5rem;
  }
  
  .nav-links-mobile .btn-primary {
    font-size: 1.5rem;
    padding: 1rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0.5rem 1rem;
  }

  .logo-img {
    height: 50px;
  }

  .mobile-menu-btn {
    font-size: 28px;
    padding: 6px 10px;
  }

  .nav-links-mobile .nav-link {
    font-size: 1.3rem;
    padding: 0.9rem 1.2rem;
    width: 90%;
  }

  .nav-links-mobile .btn-primary {
    font-size: 1.3rem;
    padding: 0.9rem 1.2rem;
    width: 90%;
  }
  
  .nav-links-mobile {
    gap: 1.5rem;
    padding: 60px 20px;
  }
}

/* Desktop styles - ensure mobile menu is hidden */
@media (min-width: 769px) {
  .nav-links-mobile {
    display: none !important;
  }
  
  .mobile-menu-btn {
    display: none !important;
  }
}

/* Smooth Scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #0a0f0a;
}

::-webkit-scrollbar-thumb {
  background: #2ecc2e;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #27ae60;
}

/* Prevent scroll on body when menu is open */
body.menu-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
}
</style>