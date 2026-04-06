<template>
  <div class="home">
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title logo-title">
          <img src="../assets/logo.png" alt="Art Of Pixels" class="hero-logo" />
        </h1>
        <p class="hero-subtitle">
          Create, share, and explore pixel art in a collaborative environment.
          Draw on a grid, publish your creations, and interact with others through likes and comments.
        </p>
        <div class="cta-buttons">
          <router-link to="/draw" class="btn btn-primary">
            <span class="btn-icon">🎨</span>
            Start Drawing
          </router-link>
          <router-link to="/gallery" class="btn btn-secondary">
            <span class="btn-icon">🖼️</span>
            Explore Gallery
          </router-link>
        </div>
      </div>
      <div class="hero-stats" v-if="!loading && topPicture">
        <div class="stat-item">
          <span class="stat-value">{{ topPicture.likes || 0 }}</span>
          <span class="stat-label">Likes</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ topPicture.size }}x{{ topPicture.size }}</span>
          <span class="stat-label">Resolution</span>
        </div>
      </div>
    </section>

    <!-- FEATURED ARTWORK -->
    <section class="featured-section">
      <div class="section-header">
        <h2 class="section-title">
          <label class="fire-label">🔥 </label>
          <span class="fire-icon"></span>
          Most Liked Artwork
        </h2>
        <div class="section-line"></div>
      </div>

      <!-- LOADING STATE -->
      <div v-if="loading" class="featured-card skeleton-card">
        <div class="featured-image">
          <div class="skeleton canvas-skeleton"></div>
        </div>
        <div class="featured-info">
          <div class="skeleton text-lg"></div>
          <div class="skeleton text-md"></div>
          <div class="skeleton text-sm"></div>
          <div class="skeleton button-skeleton"></div>
        </div>
      </div>

      <!-- CONTENT -->
      <div v-else-if="topPicture" class="featured-card">
        <div class="featured-image">
          <canvas 
            :key="topPicture?.id"
            :ref="renderFeatured"
            width="300" 
            height="300"
            class="featured-canvas"
          ></canvas>
          <div class="image-overlay">
            <button class="view-btn" @click="openPicture(topPicture.id)">
              View Details
            </button>
          </div>
        </div>

        <div class="featured-info">
          <div class="artwork-header">
            <span class="artwork-badge">🏆 Top Rated</span>
            <span class="artwork-id">#{{ topPicture.id.slice(0, 8) }}</span>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">❤️</div>
              <div class="stat-details">
                <span class="stat-value">{{ topPicture.likes || 0 }}</span>
                <span class="stat-label">Likes</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-details">
                <span class="stat-value">{{ formatDate(topPicture.created_at) }}</span>
                <span class="stat-label">Created</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎨</div>
              <div class="stat-details">
                <span class="stat-value">{{ topPicture.size }}x{{ topPicture.size }}</span>
                <span class="stat-label">Grid Size</span>
              </div>
            </div>
          </div>

          <button class="action-button" @click="openPicture(topPicture.id)">
            <span class="btn-icon">🔍</span>
            View & Edit Artwork
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🎨</div>
        <h3>No artworks yet</h3>
        <p>Be the first to create and share your pixel art!</p>
        <router-link to="/draw" class="btn btn-primary">Create Your First Artwork</router-link>
      </div>
    </section>

    <!-- FEATURES GRID -->
    <section class="features-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="sparkle-icon">✨</span>
          Features
        </h2>
        <div class="section-line"></div>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>Draw</h3>
          <p>Create pixel art using an intuitive grid-based canvas with real-time preview.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🌍</div>
          <h3>Share</h3>
          <p>Publish your creations and let others explore your unique artwork.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <h3>Interact</h3>
          <p>Like and comment on artworks from other users in the community.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📦</div>
          <h3>Export & Import</h3>
          <p>Export your art as SVG, PNG, or favicon. Import any image and convert it to pixel art.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMostLikedPicture } from '../utils/pictures'
import type { ComponentPublicInstance } from 'vue'

const router = useRouter()
const topPicture = ref<any>(null)
const loading = ref(true)

// ULTRA-FAST RENDERER - Direct pixel manipulation
function renderCanvas(canvas: HTMLCanvasElement | null, picture: any) {
  if (!canvas || !picture) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const grid: string[][] = picture.pixels
  const size = picture.size

  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    console.error('Invalid grid data')
    return
  }

  const canvasSize = 300
  const pixelSize = canvasSize / size

  // Disable image smoothing for crisp pixels
  ctx.imageSmoothingEnabled = false
  
  // Clear canvas
  ctx.clearRect(0, 0, canvasSize, canvasSize)

  // Batch render for better performance
  for (let y = 0; y < size; y++) {
    const row = grid[y]
    if (!row) continue
    
    for (let x = 0; x < size; x++) {
      const color = row[x] || '#000000'
      ctx.fillStyle = color
      ctx.fillRect(
        Math.floor(x * pixelSize), 
        Math.floor(y * pixelSize), 
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      )
    }
  }
}


function renderFeatured(
  el: Element | ComponentPublicInstance | null
) {
  // we only care about real DOM canvas
  if (!(el instanceof HTMLCanvasElement)) return
  if (!topPicture.value) return

  renderCanvas(el, topPicture.value)
}

// FETCH MOST LIKED PICTURE
async function loadTopPicture() {
  loading.value = true

  try {
    const data = await getMostLikedPicture()
    topPicture.value = data || null

   
  } catch (error) {
    console.error('Error loading top picture:', error)
  } finally {
    loading.value = false
  }
}

// NAVIGATION
function openPicture(id: string) {
  if (id) {
    router.push(`/edit/${id}`)
  }
}

// DATE FORMATTING
function formatDate(date: string) {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(() => {
  loadTopPicture()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
}


.logo-title {
  display: flex;
  justify-content: center;   /* horizontal center */
  align-items: center;
  width: 100%;
  text-align: center;
}

/* Hero logo (bigger than navbar) */
.hero-logo {
  height: 200px;     /* main size */
  width: auto;
  object-fit: contain;
}


/* HERO SECTION - Optimized */
.hero-section {
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  padding: 60px 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 0%, rgba(76, 175, 80, 0.1), transparent);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  font-size: 18px;
  color: #a0a0a0;
  line-height: 1.6;
  margin-bottom: 32px;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 20px;
}

.hero-stats {
  display: inline-flex;
  gap: 32px;
  background: rgba(255, 255, 255, 0.05);
  padding: 16px 32px;
  border-radius: 100px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  margin-top: 40px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #4caf50;
}

.stat-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
}

/* FEATURED SECTION */
.featured-section {
  padding: 60px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #ffffff, #a0a0a0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.fire-label {
  background: none;              /* remove gradient */
  -webkit-background-clip: initial;
  background-clip: initial;
  color: initial;                /* restore default emoji color */
}


.fire-icon, .sparkle-icon {
  font-size: 40px;
}

.section-line {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  margin: 16px auto 0;
  border-radius: 2px;
}

/* FEATURED CARD - Optimized (removed backdrop-filter and expensive transforms) */
.featured-card {
  background: rgba(30, 30, 30, 0.9);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  gap: 40px;
  padding: 40px;
  transition: border-color 0.2s;
}

.featured-card:hover {
  border-color: rgba(76, 175, 80, 0.3);
}

.featured-image {
  position: relative;
  flex-shrink: 0;
}

/* CRITICAL: Canvas rendering optimizations */
.featured-canvas {
  display: block;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  /* Optimize rendering */
  image-rendering: crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  /* Prevent layout shifts */
  width: 300px;
  height: 300px;
}

/* Remove hover scale transform that causes repaints */


.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 16px;
  pointer-events: none;
}

.featured-image:hover .image-overlay {
  opacity: 1;
  pointer-events: auto;
}

.view-btn {
  padding: 10px 20px;
  background: #4caf50;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.view-btn:hover {
  background: #45a049;
}

.featured-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.artwork-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.artwork-badge {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.artwork-id {
  font-family: monospace;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s;
}

.stat-card:hover {
  background: rgba(76, 175, 80, 0.1);
}

.stat-icon {
  font-size: 28px;
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-details .stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #4caf50;
}

.stat-details .stat-label {
  font-size: 11px;
  color: #888;
}

.action-button {
  background: linear-gradient(135deg, #4caf50, #45a049);
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s;
  margin-top: 8px;
}

.action-button:hover {
  transform: translateX(4px);
}

.btn-arrow {
  transition: transform 0.2s;
}

.action-button:hover .btn-arrow {
  transform: translateX(4px);
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 24px;
  margin-bottom: 12px;
}

.empty-state p {
  color: #888;
  margin-bottom: 24px;
}

/* FEATURES SECTION */
.features-section {
  padding: 60px 32px;
  background: rgba(0, 0, 0, 0.2);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(30, 30, 30, 0.9);
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s, transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: rgba(76, 175, 80, 0.3);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 22px;
  margin-bottom: 12px;
  color: #4caf50;
}

.feature-card p {
  color: #a0a0a0;
  line-height: 1.5;
  font-size: 14px;
}

/* SKELETON LOADING - Optimized */
.skeleton-card {
  pointer-events: none;
}

.skeleton {
  background: linear-gradient(
    90deg,
    #2a2a2a 25%,
    #3a3a3a 50%,
    #2a2a2a 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

.canvas-skeleton {
  width: 300px;
  height: 300px;
  border-radius: 16px;
}

.text-lg {
  width: 200px;
  height: 24px;
  margin-bottom: 12px;
}

.text-md {
  width: 160px;
  height: 20px;
  margin-bottom: 12px;
}

.text-sm {
  width: 120px;
  height: 16px;
  margin-bottom: 12px;
}

.button-skeleton {
  width: 180px;
  height: 48px;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* SCROLLBAR */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #4caf50;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}



.sparkle-icon {
  background: none;              /* remove gradient */
  -webkit-background-clip: initial;
  background-clip: initial;
  color: initial;                /* restore default emoji color */
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }
  .hero-logo {
    height: 150px;
  }
  
  .hero-subtitle {
    font-size: 14px;
  }
  
  .hero-stats {
    padding: 12px 24px;
    gap: 16px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .featured-section {
    padding: 40px 20px;
  }
  
  .section-title {
    font-size: 28px;
  }
  
  .featured-card {
    flex-direction: column;
    padding: 24px;
    gap: 24px;
  }
  
  .featured-canvas {
    width: 100%;
    height: auto;
    max-width: 300px;
    margin: 0 auto;
  }
  
  .canvas-skeleton {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .features-section {
    padding: 40px 20px;
  }
  
  .features-grid {
    gap: 16px;
  }
  
  .feature-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .hero-logo {
    height: 178px;
  }
}






</style>