<template>
  <div class="home">

    <!-- HERO -->
    <section class="hero">
      <h1>PixelForge</h1>
      <p>
        Create, share, and explore pixel art in a collaborative environment.
        Draw on a grid, publish your creations, and interact with others through likes and comments.
      </p>

      <div class="cta">
        <router-link to="/draw" class="btn primary">Start Drawing</router-link>
        <router-link to="/gallery" class="btn secondary">Explore Gallery</router-link>
      </div>
    </section>

    <!-- FEATURED -->
    <section class="featured" v-if="topPicture">
      <h2>🔥 Most Liked Artwork</h2>

      <div class="featured-card">
        <canvas ref="featuredCanvas" width="300" height="300"></canvas>

        <div class="info">
          <p><strong>Likes:</strong> ❤️ {{ topPicture.likes_count }}</p>
          <p><strong>Created:</strong> {{ formatDate(topPicture.created_at) }}</p>

          <button @click="openPicture(topPicture.id)">
            View & Edit
          </button>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="features">
      <div class="feature">
        <h3>🎨 Draw</h3>
        <p>Create pixel art using an intuitive grid-based canvas.</p>
      </div>

      <div class="feature">
        <h3>🌍 Share</h3>
        <p>Publish your creations and let others explore your work.</p>
      </div>

      <div class="feature">
        <h3>💬 Interact</h3>
        <p>Like and comment on artworks from other users.</p>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const topPicture = ref<any>(null)
const featuredCanvas = ref<HTMLCanvasElement | null>(null)

// FETCH MOST LIKED
async function loadTopPicture() {
  const { data, error } = await supabase
    .from('pictures')
    .select(`
      *,
      likes(count)
    `)
    .is('deleted_at', null)

  if (error) {
    console.error(error)
    return
  }

  // normalize + sort
  const normalized = (data || []).map((p: any) => ({
    ...p,
    likes_count: p.likes?.[0]?.count || 0
  }))

  normalized.sort((a: any, b: any) => b.likes_count - a.likes_count)

  topPicture.value = normalized[0] || null

  await nextTick()
  renderFeatured()
}

// RENDER CANVAS
function renderFeatured() {
  if (!featuredCanvas.value || !topPicture.value) return

  const ctx = featuredCanvas.value.getContext('2d')
  if (!ctx) return

  const grid = topPicture.value.pixels
  const size = topPicture.value.size
  const pixelSize = featuredCanvas.value.width / size

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = grid[y][x]
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
  }
}

// NAVIGATION
function openPicture(id: string) {
  router.push(`/edit/${id}`)
}

// DATE
function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

onMounted(loadTopPicture)
</script>

<style scoped>
.home {
  color: white;
  background: #1e1e1e;
  min-height: 100vh;
}

/* HERO */
.hero {
  text-align: center;
  padding: 60px 20px;
}

.hero h1 {
  font-size: 42px;
  margin-bottom: 10px;
}

.hero p {
  max-width: 600px;
  margin: auto;
  color: #bbb;
}

.cta {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: white;
}

.primary {
  background: #4caf50;
}

.secondary {
  background: #333;
}

/* FEATURED */
.featured {
  padding: 40px 20px;
  text-align: center;
}

.featured-card {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 30px;
  align-items: center;
  flex-wrap: wrap;
}

canvas {
  border: 2px solid #444;
  border-radius: 10px;
}

.info {
  text-align: left;
}

.info button {
  margin-top: 10px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: #4caf50;
  color: white;
  cursor: pointer;
}

/* FEATURES */
.features {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 40px 20px;
  flex-wrap: wrap;
}

.feature {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 12px;
  width: 220px;
  text-align: center;
}

.feature h3 {
  margin-bottom: 10px;
}
</style>