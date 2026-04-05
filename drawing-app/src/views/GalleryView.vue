<template>
  <div class="gallery">
    <!-- HERO HEADER -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">Public</span> Gallery
        </h1>
        <p class="hero-subtitle">Your creative collection, beautifully organized</p>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">Artworks</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ pictures.length }}</span>
          <span class="stat-label">On Display</span>
        </div>
      </div>
    </div>

    <!-- PROGRESS BAR -->
    <div v-if="isLoading" class="progress-container">
      <div class="progress-bar" :style="{ width: progressPercentage + '%' }">
        <div class="progress-glow"></div>
      </div>
      <div class="progress-text">{{ Math.floor(progressPercentage) }}%</div>
    </div>

    <!-- FILTER BAR -->
    <div class="filter-bar">
      <div class="filter-group">
        <button 
          class="filter-btn" 
          :class="{ 'active': currentFilter === 'all' }"
          @click="setFilter('all')"
        >
          All
        </button>
        <button 
          class="filter-btn" 
          :class="{ 'active': currentFilter === 'recent' }"
          @click="setFilter('recent')"
        >
          Recent
        </button>
        <button 
          class="filter-btn" 
          :class="{ 'active': currentFilter === 'mostLiked' }"
          @click="setFilter('mostLiked')"
        >
          Most Liked
        </button>
      </div>
      <div class="view-options">
        <button 
          class="view-btn" 
          :class="{ 'active': viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          📱 Grid
        </button>
        <button 
          class="view-btn" 
          :class="{ 'active': viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          📋 List
        </button>
      </div>
    </div>

    <!-- GRID VIEW -->
    <div v-if="viewMode === 'grid'" class="grid-container">
      <div class="grid">
        <!-- SKELETON SCREEN -->
        <div v-if="isLoading && pictures.length === 0" v-for="n in 6" :key="'skeleton-' + n" class="card skeleton">
          <div class="card-image skeleton-canvas"></div>
          <div class="card-content">
            <div class="skeleton-text"></div>
            <div class="skeleton-actions">
              <div class="skeleton-button"></div>
              <div class="skeleton-button"></div>
            </div>
          </div>
        </div>

        <!-- ACTUAL CONTENT -->
        <div v-for="pic in filteredPictures" :key="pic.id" class="card">
          <!-- PREVIEW WITH OVERLAY -->
          <div class="card-image-wrapper">
            <div class="preview" @click="openPicture(pic.id)">
              <canvas
                :ref="el => renderPreview(el as HTMLCanvasElement | null, pic)"
                width="160"
                height="160"
                class="artwork-canvas"
              ></canvas>
            </div>
            <div class="card-overlay">
              <button class="overlay-btn" @click.stop="openPicture(pic.id)">
                🔍 View
              </button>
            </div>
          </div>

          <!-- CARD CONTENT -->
          <div class="card-content">
            <div class="meta">
              <span class="artwork-id">#{{ pic.id.slice(0, 8) }}</span>
              <span class="artwork-date">{{ formatDate(pic.created_at) }}</span>
            </div>

            <!-- ACTIONS WITH OPTIMISTIC UI -->
            <div class="actions">
              <button 
                class="action-btn like-btn"
                @click.stop="handleLike(pic.id)" 
                :disabled="likingInProgress.has(pic.id)"
                :class="{ 'liked': optimisticLikes[pic.id] !== undefined }"
              >
                <span class="btn-icon">❤️</span>
                <span class="btn-text">
                  <span v-if="optimisticLikes[pic.id] !== undefined">
                    {{ optimisticLikes[pic.id] }}
                  </span>
                  <span v-else>
                    {{ pic.likes_count || 0 }}
                  </span>
                </span>
              </button>

              <button 
                class="action-btn comment-btn"
                @click.stop="toggleComments(pic.id)"
                :class="{ 'active': openComments[pic.id] }"
              >
                <span class="btn-icon">💬</span>
                <span class="btn-text">Comment</span>
              </button>

              <button 
                class="action-btn delete-btn"
                @click.stop="handleDelete(pic.id)"
                :disabled="deletingInProgress.has(pic.id)"
              >
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">Delete</span>
              </button>
            </div>

            <!-- COMMENTS SECTION -->
            <Transition name="slide-fade">
              <div v-if="openComments[pic.id]" class="comments-section">
                <div class="comments-header">
                  <span class="comments-title">Comments</span>
                  <span class="comments-count">{{ commentsMap[pic.id]?.length || 0 }}</span>
                </div>
                
                <div class="comments-list">
                  <div
                    v-for="c in commentsMap[pic.id]"
                    :key="c.id"
                    class="comment-item"
                  >
                    <div class="comment-avatar">
                      {{ c.username?.charAt(0).toUpperCase() || 'U' }}
                    </div>
                    <div class="comment-content">
                      <div class="comment-author">{{ c.username }}</div>
                      <div class="comment-text">{{ c.content }}</div>
                    </div>
                  </div>

                  <div v-if="!commentsMap[pic.id]?.length" class="empty-comments">
                    No comments yet. Be the first!
                  </div>
                </div>

                <div class="comment-input-wrapper">
                  <input
                    v-model="newComment[pic.id]"
                    placeholder="Write a comment..."
                    class="comment-input"
                    :disabled="commentingInProgress.has(pic.id)"
                    @keyup.enter="submitComment(pic.id)"
                  />
                  <button 
                    class="submit-comment-btn"
                    @click="submitComment(pic.id)"
                    :disabled="commentingInProgress.has(pic.id)"
                  >
                    Send →
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- LIST VIEW -->
    <div v-else class="list-container">
      <div class="list-view">
        <!-- SKELETON SCREEN -->
        <div v-if="isLoading && pictures.length === 0" v-for="n in 3" :key="'skeleton-list-' + n" class="list-item skeleton-list">
          <div class="list-item-image skeleton-canvas"></div>
          <div class="list-item-content">
            <div class="skeleton-text"></div>
            <div class="skeleton-text" style="width: 40%"></div>
            <div class="skeleton-actions">
              <div class="skeleton-button"></div>
              <div class="skeleton-button"></div>
            </div>
          </div>
        </div>

        <!-- ACTUAL LIST CONTENT -->
        <div v-for="pic in filteredPictures" :key="pic.id" class="list-item">
          <div class="list-item-image-wrapper">
            <div class="list-preview" @click="openPicture(pic.id)">
              <canvas
                :ref="el => renderPreview(el as HTMLCanvasElement | null, pic)"
                width="300"
                height="300"
                class="list-artwork-canvas"
              ></canvas>
            </div>
            <div class="list-item-overlay">
              <button class="overlay-btn" @click.stop="openPicture(pic.id)">
                🔍 View Details
              </button>
            </div>
          </div>

          <div class="list-item-content">
            <div class="list-item-header">
              <div class="list-item-meta">
                <span class="artwork-id">#{{ pic.id.slice(0, 8) }}</span>
                <span class="artwork-date">{{ formatDate(pic.created_at) }}</span>
              </div>
              <div class="list-item-stats">
                <span class="stat-badge">❤️ {{ pic.likes_count || 0 }} likes</span>
                <span class="stat-badge">💬 {{ commentsMap[pic.id]?.length || 0 }} comments</span>
              </div>
            </div>

            <div class="list-actions">
              <button 
                class="action-btn like-btn"
                @click.stop="handleLike(pic.id)" 
                :disabled="likingInProgress.has(pic.id)"
                :class="{ 'liked': optimisticLikes[pic.id] !== undefined }"
              >
                <span class="btn-icon">❤️</span>
                <span class="btn-text">
                  <span v-if="optimisticLikes[pic.id] !== undefined">
                    {{ optimisticLikes[pic.id] }}
                  </span>
                  <span v-else>
                    {{ pic.likes_count || 0 }}
                  </span>
                </span>
              </button>

              <button 
                class="action-btn comment-btn"
                @click.stop="toggleComments(pic.id)"
                :class="{ 'active': openComments[pic.id] }"
              >
                <span class="btn-icon">💬</span>
                <span class="btn-text">Comment</span>
              </button>

              <button 
                class="action-btn delete-btn"
                @click.stop="handleDelete(pic.id)"
                :disabled="deletingInProgress.has(pic.id)"
              >
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">Delete</span>
              </button>
            </div>

            <!-- COMMENTS SECTION IN LIST VIEW -->
            <Transition name="slide-fade">
              <div v-if="openComments[pic.id]" class="comments-section list-comments">
                <div class="comments-header">
                  <span class="comments-title">Comments</span>
                  <span class="comments-count">{{ commentsMap[pic.id]?.length || 0 }}</span>
                </div>
                
                <div class="comments-list">
                  <div
                    v-for="c in commentsMap[pic.id]"
                    :key="c.id"
                    class="comment-item"
                  >
                    <div class="comment-avatar">
                      {{ c.username?.charAt(0).toUpperCase() || 'U' }}
                    </div>
                    <div class="comment-content">
                      <div class="comment-author">{{ c.username }}</div>
                      <div class="comment-text">{{ c.content }}</div>
                    </div>
                  </div>

                  <div v-if="!commentsMap[pic.id]?.length" class="empty-comments">
                    No comments yet. Be the first!
                  </div>
                </div>

                <div class="comment-input-wrapper">
                  <input
                    v-model="newComment[pic.id]"
                    placeholder="Write a comment..."
                    class="comment-input"
                    :disabled="commentingInProgress.has(pic.id)"
                    @keyup.enter="submitComment(pic.id)"
                  />
                  <button 
                    class="submit-comment-btn"
                    @click="submitComment(pic.id)"
                    :disabled="commentingInProgress.has(pic.id)"
                  >
                    Send →
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGINATION -->
    <div class="pagination-container">
      <div class="pagination">
        <button 
          class="page-btn" 
          @click="prevPage" 
          :disabled="page === 1 || isLoading"
          :class="{ 'disabled': page === 1 }"
        >
          ← Previous
        </button>
        
        <div class="page-info">
          <span class="page-current">{{ page }}</span>
          <span class="page-separator">/</span>
          <span class="page-total">{{ totalPages }}</span>
        </div>
        
        <button 
          class="page-btn" 
          @click="nextPage" 
          :disabled="page === totalPages || isLoading"
          :class="{ 'disabled': page === totalPages }"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  toggleLike,
  getComments,
  addComment,
  deletePicture,
  getPictures
} from '../utils/pictures'

const router = useRouter()

// STATE
const pictures = ref<any[]>([])
const page = ref(1)
const limit = 10
const total = ref(0)
const isLoading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const currentFilter = ref<'all' | 'recent' | 'mostLiked'>('all')

// PROGRESS BAR STATE
const progressPercentage = ref(0)
let progressInterval: number | null = null

// OPTIMISTIC UI STATE
const optimisticLikes = reactive<Record<string, number>>({})
const likingInProgress = ref(new Set<string>())
const deletingInProgress = ref(new Set<string>())
const commentingInProgress = ref(new Set<string>())

// COMMENTS STATE
const openComments = reactive<Record<string, boolean>>({})
const commentsMap = reactive<Record<string, any[]>>({})
const newComment = reactive<Record<string, string>>({})

// COMPUTED
const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / limit))
)

// FILTERED PICTURES
const filteredPictures = computed(() => {
  if (currentFilter.value === 'all') {
    return pictures.value
  } else if (currentFilter.value === 'recent') {
    return [...pictures.value].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } else if (currentFilter.value === 'mostLiked') {
    const maxLikes = Math.max(...pictures.value.map(p => p.likes_count || 0), 0)
    if (maxLikes === 0) return pictures.value
    return pictures.value.filter(p => (p.likes_count || 0) === maxLikes)
  }
  return pictures.value
})

// PROGRESS BAR ANIMATION
function startProgressAnimation() {
  progressPercentage.value = 0
  
  if (progressInterval) clearInterval(progressInterval)
  
  const duration = 2000
  const startTime = Date.now()
  
  progressInterval = window.setInterval(() => {
    const elapsed = Date.now() - startTime
    let progress = (elapsed / duration) * 100
    
    progress = 100 * (1 - Math.pow(1 - Math.min(progress, 100) / 100, 2.5))
    
    progressPercentage.value = Math.min(progress, 99.5)
    
    if (elapsed >= duration) {
      clearInterval(progressInterval!)
      progressInterval = null
    }
  }, 16)
}

function stopProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  progressPercentage.value = 100
  setTimeout(() => {
    progressPercentage.value = 0
  }, 200)
}

// FETCH ONLY USER PICTURES
async function load() {
  isLoading.value = true
  startProgressAnimation()
  
  try {
    const res = await getPictures(page.value, limit)
    pictures.value = res.pictures
    total.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    stopProgressAnimation()
    isLoading.value = false
  }
}


// FILTER HANDLER
function setFilter(filter: 'all' | 'recent' | 'mostLiked') {
  currentFilter.value = filter
}

// NAVIGATION
function openPicture(id: string) {
  router.push(`/edit/${id}`)
}

// LIKE WITH OPTIMISTIC UI
async function handleLike(id: string) {
  if (likingInProgress.value.has(id)) return
  
  const pic = pictures.value.find(p => p.id === id)
  if (!pic) return
  
  const currentLikes = optimisticLikes[id] !== undefined ? optimisticLikes[id] : pic.likes_count
  const newLikesCount = (currentLikes || 0) + 1
  optimisticLikes[id] = newLikesCount
  likingInProgress.value.add(id)
  
  try {
    const liked = await toggleLike(id)
    
    if (liked) {
      optimisticLikes[id] = (currentLikes || 0) + 1
      pic.likes_count = (pic.likes_count || 0) + 1
    } else {
      optimisticLikes[id] = currentLikes
      pic.likes_count = currentLikes
    }
  } catch (error) {
    optimisticLikes[id] = currentLikes
    pic.likes_count = currentLikes
    console.error('Failed to toggle like:', error)
  } finally {
    likingInProgress.value.delete(id)
    setTimeout(() => {
      delete optimisticLikes[id]
    }, 1000)
  }
}

// COMMENTS
async function toggleComments(id: string) {
  // Only close other comment sections, don't affect card sizes
  Object.keys(openComments).forEach(key => {
    if (key !== id) openComments[key] = false
  })

  openComments[id] = !openComments[id]

  if (openComments[id] && !commentsMap[id]) {
    commentsMap[id] = await getComments(id)
  }
}

// ADD COMMENT WITH OPTIMISTIC UI
async function submitComment(id: string) {
  const text = newComment[id]
  if (!text || commentingInProgress.value.has(id)) return
  
  const tempId = 'temp-' + Date.now() + '-' + Math.random()
  const optimisticComment = {
    id: tempId,
    username: 'You',
    content: text,
    isOptimistic: true
  }
  
  if (!commentsMap[id]) commentsMap[id] = []
  commentsMap[id].push(optimisticComment)
  commentingInProgress.value.add(id)
  newComment[id] = ''
  
  try {
    const comment = await addComment(id, text)
    const index = commentsMap[id].findIndex(c => c.id === tempId)
    if (index !== -1) {
      commentsMap[id][index] = comment
    }
  } catch (error) {
    const index = commentsMap[id].findIndex(c => c.id === tempId)
    if (index !== -1) {
      commentsMap[id].splice(index, 1)
    }
    console.error('Failed to add comment:', error)
  } finally {
    commentingInProgress.value.delete(id)
  }
}

// DELETE WITH OPTIMISTIC UI
async function handleDelete(id: string) {
  if (!confirm('Delete this artwork? This action cannot be undone.')) return
  if (deletingInProgress.value.has(id)) return
  
  const picIndex = pictures.value.findIndex(p => p.id === id)
  const deletedPic = pictures.value[picIndex]
  pictures.value.splice(picIndex, 1)
  deletingInProgress.value.add(id)
  
  try {
    await deletePicture(id)
    total.value = Math.max(0, total.value - 1)
  } catch (error) {
    if (deletedPic) {
      pictures.value.splice(picIndex, 0, deletedPic)
    }
    console.error('Failed to delete picture:', error)
  } finally {
    deletingInProgress.value.delete(id)
  }
}

// PAGINATION
function nextPage() {
  if (page.value < totalPages.value && !isLoading.value) page.value++
}

function prevPage() {
  if (page.value > 1 && !isLoading.value) page.value--
}

// PREVIEW
function renderPreview(canvas: HTMLCanvasElement | null, pic: any) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const grid: string[][] = pic.pixels
  const size = pic.size
  const pixelSize = canvas.width / size

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = grid[y][x]
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
  }
}

// DATE
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// LIFECYCLE
onMounted(load)
watch(page, load)
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.gallery {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
}

/* HERO SECTION */
.hero-section {
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  padding: 48px 32px;
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
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 16px;
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
  margin-bottom: 32px;
}

.hero-stats {
  display: inline-flex;
  gap: 32px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 16px 32px;
  border-radius: 100px;
  border: 1px solid rgba(76, 175, 80, 0.2);
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

/* PROGRESS BAR */
.progress-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(76, 175, 80, 0.1);
  z-index: 1000;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  position: fixed;
  top: 12px;
  right: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #4caf50;
  background: rgba(0, 0, 0, 0.8);
  padding: 4px 10px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  font-family: monospace;
  letter-spacing: 0.5px;
  z-index: 1000;
}

/* FILTER BAR */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-btn {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.filter-btn:hover {
  border-color: #4caf50;
  color: #4caf50;
}

.filter-btn.active {
  background: #4caf50;
  border-color: #4caf50;
  color: white;
}

.view-options {
  display: flex;
  gap: 8px;
}

.view-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.view-btn.active {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
  color: #4caf50;
}

/* GRID CONTAINER */
.grid-container {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* CARD */
.card {
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  height: fit-content;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(76, 175, 80, 0.3);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

/* CARD IMAGE */
.card-image-wrapper {
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
}

.preview {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a1a, #0d0d0d);
}

.artwork-canvas {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s;
}

.card:hover .artwork-canvas {
  transform: scale(1.02);
}

.card-overlay {
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
  transition: opacity 0.3s;
}

.card-image-wrapper:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  padding: 10px 20px;
  background: #4caf50;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.overlay-btn:hover {
  transform: scale(1.05);
  background: #45a049;
}

/* CARD CONTENT */
.card-content {
  padding: 16px;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 12px;
}

.artwork-id {
  font-family: monospace;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.artwork-date {
  color: #888;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #ccc;
  font-size: 13px;
}

.action-btn:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4caf50;
  color: #4caf50;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.like-btn.liked {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
  color: #4caf50;
  animation: pulse 0.3s;
}

.comment-btn.active {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4caf50;
  color: #4caf50;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* COMMENTS SECTION */
.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comments-title {
  font-size: 13px;
  font-weight: 600;
  color: #ccc;
}

.comments-count {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.comments-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.comment-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-author {
  font-size: 12px;
  font-weight: 600;
  color: #4caf50;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 13px;
  color: #ccc;
  line-height: 1.4;
}

.empty-comments {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 13px;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  transition: all 0.2s;
}

.comment-input:focus {
  outline: none;
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

.submit-comment-btn {
  padding: 8px 16px;
  background: #4caf50;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.submit-comment-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateX(2px);
}

/* LIST VIEW STYLES */
.list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.list-item {
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  gap: 32px;
  padding: 32px;
}

.list-item:hover {
  transform: translateY(-4px);
  border-color: rgba(76, 175, 80, 0.3);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.list-item-image-wrapper {
  position: relative;
  flex-shrink: 0;
}

.list-preview {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a1a1a, #0d0d0d);
  border-radius: 16px;
  overflow: hidden;
}

.list-artwork-canvas {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s;
  width: 300px;
  height: 300px;
}

.list-item:hover .list-artwork-canvas {
  transform: scale(1.02);
}

.list-item-overlay {
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
  transition: opacity 0.3s;
  border-radius: 16px;
}

.list-item-image-wrapper:hover .list-item-overlay {
  opacity: 1;
}

.list-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.list-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.list-item-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.list-item-stats {
  display: flex;
  gap: 16px;
}

.stat-badge {
  padding: 6px 12px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 20px;
  font-size: 13px;
  color: #4caf50;
}

.list-actions {
  display: flex;
  gap: 12px;
  max-width: 400px;
}

.list-comments {
  margin-top: 0;
}

/* SKELETON */
.skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-list {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  display: flex;
  gap: 32px;
  padding: 32px;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.skeleton-canvas {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
}

.skeleton-text {
  height: 12px;
  background: #2a2a2a;
  border-radius: 6px;
  margin-bottom: 12px;
  width: 60%;
}

.skeleton-actions {
  display: flex;
  gap: 8px;
}

.skeleton-button {
  flex: 1;
  height: 36px;
  background: #2a2a2a;
  border-radius: 8px;
}

/* TRANSITIONS */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* PAGINATION */
.pagination-container {
  padding: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.page-btn {
  padding: 10px 24px;
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  color: #4caf50;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.page-btn:hover:not(.disabled) {
  background: #4caf50;
  color: white;
  transform: translateX(0);
}

.page-btn.disabled,
.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.page-current {
  color: #4caf50;
  font-size: 20px;
  font-weight: 700;
}

.page-separator {
  color: #666;
}

.page-total {
  color: #888;
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

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
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
  
  .filter-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .grid-container {
    padding: 20px;
  }
  
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .pagination {
    gap: 16px;
  }
  
  .page-btn {
    padding: 8px 16px;
  }

  .list-item {
    flex-direction: column;
    padding: 20px;
  }

  .list-artwork-canvas {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }

  .list-actions {
    max-width: 100%;
  }

  .list-item-header {
    flex-direction: column;
  }

  .list-container {
    padding: 20px;
  }
}
</style>