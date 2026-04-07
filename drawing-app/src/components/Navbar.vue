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
        <!-- Only show UserDropdown, no extra links -->
        <UserDropdown v-if="auth.user" />
        
        <template v-else>
          <router-link to="/login" class="nav-link">Login</router-link>
          <router-link to="/register" class="nav-link btn-primary">Register</router-link>
        </template>
      </div>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu" aria-label="Menu">
        {{ mobileMenuOpen ? '✕' : '☰' }}
      </button>
    </div>

    <!-- Mobile Navigation Menu -->
    <transition name="slide">
      <div v-if="mobileMenuOpen" class="nav-links-mobile">
        
        <div class="mobile-menu-content">
          <div class="mobile-user-email">{{ auth.username  || auth.user?.email}}</div>
          <router-link to="/draw" class="nav-link" @click="closeMobileMenu">Draw</router-link>
          <router-link to="/gallery" class="nav-link" @click="closeMobileMenu">Gallery</router-link>
          
          <!-- On mobile, show dropdown links directly in menu -->
          <template v-if="auth.user">
            
            <router-link to="/my-gallery" class="nav-link" @click="closeMobileMenu">My Artworks</router-link>
            <router-link to="/edit-profile" class="nav-link" @click="closeMobileMenu">Profile Settings</router-link>
            <button @click="handleLogout" class="nav-link btn-primary">Logout</button>
          </template>

          <template v-else>
            <router-link to="/login" class="nav-link" @click="closeMobileMenu">Login</router-link>
            <router-link to="/register" class="nav-link btn-primary" @click="closeMobileMenu">Register</router-link>
          </template>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import UserDropdown from './UserDropdown.vue'

const auth = useAuthStore()
const mobileMenuOpen = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

function handleLogout() {
  auth.logout()
  closeMobileMenu()
}
</script>

<style scoped>
/* Your existing navbar styles here */
/* ... (keep all your existing navbar styles) ... */

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
  width: 100%;
  display: block;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* Logo */
.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-img {
  height: 70px;
  width: auto;
  object-fit: contain;
}

/* Desktop Navigation */
.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 60px;
}

.left {
  flex: 1;
  justify-content: flex-start;
}

.right {
  justify-content: flex-end;
}

/* User Dropdown */
.user-dropdown-component {
  display: block;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: #2ecc2e;
  font-size: 32px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: bold;
  z-index: 1002;
  position: relative;
}

.mobile-menu-btn:hover {
  background: rgba(46, 204, 46, 0.1);
}

/* Nav Links */
.nav-link {
  padding: 0.5rem 1rem;
  color: #e0e0e0;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.15rem;
  transition: all 0.3s ease;
  border-radius: 8px;
  white-space: nowrap;
  margin-left: 30px;
}

.nav-link:hover {
  color: #2ecc2e;
  background: rgba(46, 204, 46, 0.1);
}

/* Active Link */
.router-link-active {
  color: #2ecc2e;
  background: rgba(46, 204, 46, 0.15);
  font-weight: 600;
}

/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #2ecc2e 0%, #27ae60 100%);
  color: #0a0f0a;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: 25px;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: #ffffff;
}

/* ============================================ */
/* FULL SCREEN MOBILE MENU WITH SLIDING */
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
  overflow-y: auto;
  padding: 60px 20px 40px;
}

.mobile-menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 100%;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

/* Mobile Close Button - Only one X button */
.mobile-close-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(46, 204, 46, 0.2);
  border: 2px solid #2ecc2e;
  color: #2ecc2e;
  font-size: 28px;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1003;
}

.mobile-close-btn:hover {
  background: rgba(46, 204, 46, 0.4);
  transform: rotate(90deg);
}

/* Sliding Animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}

/* Mobile Menu Links */
.nav-links-mobile .nav-link {
  font-size: 1.5rem;
  padding: 1rem 2rem;
  width: 100%;
  text-align: center;
  background: rgba(46, 204, 46, 0.1);
  border: 2px solid rgba(46, 204, 46, 0.3);
  white-space: normal;
  display: block;
  margin-left: 0px;
}

.nav-links-mobile .nav-link:active {
  transform: scale(0.98);
  background: rgba(46, 204, 46, 0.2);
}

.nav-links-mobile .btn-primary {
  background: linear-gradient(135deg, #2ecc2e 0%, #27ae60 100%);
  color: #0a0f0a;
  font-weight: 700;
  border: none;
  font-size: 1.5rem;
  padding: 1rem 2rem;
  width: 100%;
}

.nav-links-mobile .btn-primary:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: #ffffff;
}

.mobile-user-email {
  color: #2ecc2e;
  font-size: 1.1rem;
  text-align: center;
  padding: 1rem;
  
  border-radius: 12px;
  width: 100%;
  word-break: break-all;
  
  margin-bottom: 0.5rem;
}

/* ============================================ */
/* MOBILE RESPONSIVE */
/* ============================================ */
@media (max-width: 768px) {
  .nav-container {
    padding: 0.5rem 1rem;
  }
  
  /* Hide desktop nav links on mobile */
  .nav-links {
    display: none !important;
  }
  
  /* Show mobile menu button */
  .mobile-menu-btn {
    display: block !important;
  }
  
  .logo-img {
    height: 50px;
  }
  
  .nav-links-mobile .nav-link {
    font-size: 1.3rem;
    padding: 0.9rem 1.5rem;
  }
  
  .nav-links-mobile .btn-primary {
    font-size: 1.3rem;
    padding: 0.9rem 1.5rem;
  }
  
  .mobile-close-btn {
    width: 45px;
    height: 45px;
    font-size: 24px;
    top: 15px;
    right: 15px;
  }
  
  .mobile-user-email {
    font-size: 1rem;
    padding: 0.8rem;
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .logo-img {
    height: 40px;
  }
  
  .mobile-menu-btn {
    font-size: 24px;
    padding: 5px 10px;
  }
  
  .nav-links-mobile {
    padding: 50px 15px 30px;
  }
  
  .mobile-menu-content {
    gap: 1rem;
  }
  
  .nav-links-mobile .nav-link {
    font-size: 1.2rem;
    padding: 0.8rem 1.2rem;
  }
  
  .nav-links-mobile .btn-primary {
    font-size: 1.2rem;
    padding: 0.8rem 1.2rem;
  }
  
  .mobile-close-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
    top: 10px;
    right: 10px;
  }
  
  .mobile-user-email {
    font-size: 0.9rem;
    padding: 0.7rem;
  }
}

/* Desktop styles */
@media (min-width: 769px) {
  .nav-links-mobile {
    display: none !important;
  }
  
  .mobile-menu-btn {
    display: none !important;
  }
  
  .mobile-close-btn {
    display: none;
  }
}

/* Fix for horizontal scroll */
body, html {
  overflow-x: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
}

#app {
  overflow-x: hidden;
  width: 100%;
}


/* Make sure UserDropdown is visible on desktop */
@media (min-width: 769px) {
  .user-dropdown {
    display: block;
  }
}

/* On mobile, UserDropdown is replaced by direct links in mobile menu */
@media (max-width: 768px) {
  .user-dropdown {
    display: none;
  }
}
</style>