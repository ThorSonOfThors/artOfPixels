<template>
  <div class="gallery">

    <h2>Gallery</h2>

    <!-- GRID -->
    <div class="grid">
      <div v-for="pic in pictures" :key="pic.id" class="card">

        <!-- PREVIEW -->
        <div class="preview" @click="openPicture(pic.id)">
          <canvas
            :ref="el => renderPreview(el as HTMLCanvasElement | null, pic)"
            width="160"
            height="160"
          ></canvas>
        </div>

        <!-- META -->
        <div class="meta">
          <small>{{ formatDate(pic.created_at) }}</small>
        </div>

        <!-- ACTIONS -->
        <div class="actions">
          <button @click.stop="handleLike(pic.id)">
            ❤️ {{ pic.likes_count || 0 }}
          </button>

          <button @click.stop="toggleComments(pic.id)">
            💬
          </button>

          <button 
            v-if="isOwner(pic)"
            @click.stop="handleDelete(pic.id)"
          >
            🗑️
          </button>
        </div>

        <!-- COMMENTS -->
        <div v-if="openComments[pic.id]" class="comments">

          <div
            v-for="c in commentsMap[pic.id]"
            :key="c.id"
            class="comment"
          >
            <strong>{{ c.username }}:</strong>
            {{ c.content }}
          </div>

          <div class="comment-input">
            <input
              v-model="newComment[pic.id]"
              placeholder="Add comment..."
            />
            <button @click="submitComment(pic.id)">Post</button>
          </div>

        </div>

      </div>
    </div>

    <!-- PAGINATION -->
    <div class="pagination">
      <button @click="prevPage" :disabled="page === 1">⬅️</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="page === totalPages">➡️</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import {getPictures,toggleLike,getComments,addComment,deletePicture} from '../utils/pictures'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const router = useRouter()

// MAIN STATE
const pictures = ref<any[]>([])
const page = ref(1)
const limit = 10
const total = ref(0)

// 🔥 FIXED: reactive maps (not ref)
const openComments = reactive<Record<string, boolean>>({})
const commentsMap = reactive<Record<string, any[]>>({})
const newComment = reactive<Record<string, string>>({})

// COMPUTED
const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / limit))
)

//HELPER
function isOwner(pic: any) {
  return auth.user && pic.user_id === auth.user.id
}

// FETCH
async function load() {
  const res = await getPictures(page.value, limit)
  pictures.value = res.pictures
  total.value = res.total
}

// NAVIGATION
function openPicture(id: string) {
  router.push(`/edit/${id}`)
}

// LIKE (toggle)
async function handleLike(id: string) {
  const liked = await toggleLike(id)

  const pic = pictures.value.find(p => p.id === id)
  if (!pic) return

  pic.likes_count += liked ? 1 : -1
}

// 🔥 FIXED TOGGLE (only one open)
async function toggleComments(id: string) {
  // close others
  Object.keys(openComments).forEach(key => {
    if (key !== id) openComments[key] = false
  })

  openComments[id] = !openComments[id]

  if (openComments[id] && !commentsMap[id]) {
    commentsMap[id] = await getComments(id)
  }
}

// ADD COMMENT
async function submitComment(id: string) {
  const text = newComment[id]
  if (!text) return

  const comment = await addComment(id, text)

  if (!commentsMap[id]) commentsMap[id] = []
  commentsMap[id].push(comment)

  newComment[id] = ''
}

// DELETE
async function handleDelete(id: string) {
  await deletePicture(id)
  load()
}

// PAGINATION
function nextPage() {
  if (page.value < totalPages.value) page.value++
}

function prevPage() {
  if (page.value > 1) page.value--
}

// PREVIEW RENDER
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

// FORMAT DATE
function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

// LIFECYCLE
onMounted(load)
watch(page, load)
</script>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 🔥 full viewport */
  padding: 20px;
  background: #1e1e1e;
  color: white;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  align-items: start; /* 🔥 THIS FIXES IT */
  gap: 20px;
}

/* CARD */
.card {
  background: #2a2a2a;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* PREVIEW */
.preview {
  cursor: pointer;
  display: flex;
  justify-content: center;
}

canvas {
  border: 1px solid #444;
}

/* META */
.meta {
  font-size: 12px;
  color: #bbb;
}

/* ACTIONS */
.actions {
  display: flex;
  justify-content: space-between;
}

/* COMMENTS */
.comments {
  background: #1a1a1a;
  padding: 8px;
  border-radius: 8px;
  overflow: hidden;
}

.comment {
  background: #333;
  padding: 6px;
  border-radius: 6px;
  margin-bottom: 5px;
  font-size: 13px;
  word-break: break-word;
}

/* INPUT FIX */
.comment-input {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.comment-input input {
  flex: 1;
  min-width: 0;
  padding: 6px;
  border-radius: 6px;
  border: none;
}

.comment-input button {
  flex-shrink: 0;
  padding: 6px 10px;
  white-space: nowrap;
}

/* PAGINATION */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>