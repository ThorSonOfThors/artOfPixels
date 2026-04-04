import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DrawView from '../views/DrawView.vue'
import { supabase } from '../lib/supabase'
import EditProfile from '../views/EditProfile.vue'
import MyGallery from '../views/MyGallery.vue'
import GalleryView from '../views/GalleryView.vue'



const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/draw', component: DrawView, meta: { requiresAuth: true } },
  { path: '/edit-profile', component: EditProfile, meta: { requiresAuth: true } },
  { path: '/my-gallery', component: MyGallery, meta: { requiresAuth: true } },
  { path: '/gallery', component: GalleryView },

  { path: '/edit/:id', component: DrawView}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth) {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return next('/login')
  }

  next()
})

export default router