<template>
  <div class="app-container" tabindex="0" @keydown="handleKey">

    <!-- LEFT PANEL -->
    <div class="sidebar left">
      <h3>Grid</h3>

      <label title="Grid resolution">
        Grid:  
        <input type="number" v-model.number="gridSize" min="2" max="300" />
      </label>

      <label title="Zoom level">
        Zoom:
        <input type="number" v-model.number="visibleSize" min="2" />
      </label>

      <h3>History</h3>
      <button @click="undo" title="Undo last action">↩️ Undo</button>
      <button @click="redo" title="Redo last action">↪️ Redo</button>
    </div>


    <!-- CENTER -->
    <div class="center">

      <!-- TOOLBAR -->
      <div class="toolbar">

        <!-- DRAW TOOLS -->
        <div class="tool-group">
          <button
            :class="['tool-btn', { active: isActive('pencil') }]"
            @click="setTool('pencil')"
            title="Freehand drawing"
          >✏️</button>

          <button 
            @click="tool = 'line'" 
            :class="{ active: tool === 'line' }"
            title="Draw straight lines"
          >📏</button>

          <button
            :class="['tool-btn', 'square', getModeFor('square'), { active: isActive('square') }]"
            @click="setTool('square')"
            title="Rectangle tool"
          ></button>

          <button
            :class="['tool-btn', 'circle', getModeFor('circle'), { active: isActive('circle') }]"
            @click="setTool('circle')"
            title="Circle tool"
          ></button>

          <button
            @click="tool = 'select'"
            :class="{ active: tool === 'select' }"
            title="Select / move pixels"
          >Select</button>

          <button 
            @click="tool = 'fill'" 
            :class="{ active: tool === 'fill' }"
            title="Fill area"
          >🧺</button>
        </div>

        <!-- BRUSH + COLORS -->
        <div class="tool-group">

          <div class="brush">
            <label>Brush size:</label>
            <button @click="brushSize--" title="Brush smaller">-</button>
            <span>{{ brushSize }}</span>
            <button @click="brushSize++" title="Brush bigger">+</button>
          </div>
          
          <label>Pick color:</label>
          <input type="color" v-model="currentColor" title="Primary color" />
          <input type="color" v-model="gradientColor" title="Gradient color" />

          <button 
            :class="{ active: useGradient }" 
            @click="useGradient = !useGradient"
            title="Toggle gradient mode"
          >
            gradient 🌈
          </button>
        </div>

      </div>

      <!-- CANVAS -->
      <div class="canvas-wrapper">
        <button class="arrow" @click="moveUp">⬆️</button>

        <div class="middle">
          <button class="arrow" @click="moveLeft">⬅️</button>

          <canvas
            ref="canvas"
            @mousedown="startDrawing"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @mousemove="draw"
            @wheel.prevent="handleWheel"
          ></canvas>

          <button class="arrow" @click="moveRight">➡️</button>
        </div>

        <button class="arrow" @click="moveDown">⬇️</button>
      </div>

    </div>


    <!-- RIGHT PANEL -->
    <div class="sidebar right">
      <h3>Export</h3>

      <button @click="exportToPNG(grid)" title="Export PNG">PNG</button>
      <button @click="exportToFavicon(grid)" title="Export favicon">ICO</button>
      <button @click="exportToSVG(grid)" title="Export SVG">SVG</button>


      <h3>Save</h3>

      <button 
        @click="handleSave" 
        :disabled="saving"
        title="Save to cloud"
      >
        {{ pictureId ? '💾 Update' : '💾 Save' }}
      </button>

      <div v-if="saveMessage">{{ saveMessage }}</div>

      <h3>Import</h3>
      <input type="file" accept="image/*" @change="onFileUpload" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { exportToPNG, exportToFavicon } from '../utils/exportUtils'
import { exportToSVG } from '../utils/exportSVG'
import { savePicture } from '../utils/pictures'
import { useRoute } from 'vue-router'
import { getPictureById, updatePicture } from '../utils/pictures'

const route = useRoute()
const pictureId = ref<string | null>(null)

const saving = ref(false)
const saveMessage = ref('')

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const CANVAS_SIZE = 600

// GRID
const gridSize = ref(100)
const visibleSize = ref(100)

//MOVE STROKE
let strokePixels: { x: number; y: number; color: string }[] = []

//MOVE
type StampPixel = {
  x: number
  y: number
  color: string
}

type BackgroundPixel = {
  x: number
  y: number
  color: string
}

let activePixels: StampPixel[] = []
let backgroundPixels: BackgroundPixel[] = []

//UNDO REDO
type CanvasState = {
  grid: string[][]
  activePixels: StampPixel[]
  backgroundPixels: BackgroundPixel[]
  strokePixels: StampPixel[]
  selectionStart: { x: number; y: number } | null
  selectionEnd: { x: number; y: number } | null
}

const undoStack = ref<CanvasState[]>([])
const redoStack = ref<CanvasState[]>([])

//GRADIENT
// Add these with your other refs
const gradientColor = ref('#0000ff') // Second color for gradient
const useGradient = ref(false) // Toggle gradient mode
const originalSelectionStart = ref<{ x: number; y: number } | null>(null)

// OFFSET
const offsetX = ref(0)
const offsetY = ref(0)

// STATE
const drawing = ref(false)
const currentColor = ref('#000000')


// 🔥 UNIFIED TOOL
const tool = ref<
  | 'pencil'
  | 'fill'
  | 'select'
  | 'line'
  | 'square-fill' | 'square-edge' | 'square-off'
  | 'circle-fill' | 'circle-edge' | 'circle-off'
>('pencil')

// BRUSH
const brushSize = ref(1)

// SELECTION
const selectionStart = ref<{ x: number; y: number } | null>(null)
const selectionEnd = ref<{ x: number; y: number } | null>(null)

// DATA
const grid = ref<string[][]>([])

//SAVE HELPERS
async function handleSave() {
  try {
    saving.value = true
    saveMessage.value = ''

    if (pictureId.value) {
      // 🔥 UPDATE existing
      await updatePicture(pictureId.value, grid.value)
      saveMessage.value = '✅ Updated'
    } else {
      // 🔥 CREATE new
      const newPic = await savePicture(grid.value)
      pictureId.value = newPic.id // now becomes edit mode
      saveMessage.value = '✅ Saved'
    }

  } catch (err) {
    console.error(err)
    saveMessage.value = '❌ Save failed'
  } finally {
    saving.value = false
  }
}


//GRADIENT HELPER
// Helper function to interpolate between two colors

// Helper function to calculate gradient factor based on start and end points
function calculateGradientFactor(
  x: number, 
  y: number, 
  start: { x: number, y: number }, 
  end: { x: number, y: number }
): number {
  // Calculate the vector from start to end
  const dx = end.x - start.x
  const dy = end.y - start.y
  
  // If the selection is just a point, return 0
  if (dx === 0 && dy === 0) return 0
  
  // Calculate the vector from start to current point
  const px = x - start.x
  const py = y - start.y
  
  // Project the point onto the line from start to end
  const dotProduct = px * dx + py * dy
  const squaredLength = dx * dx + dy * dy
  
  // Clamp t between 0 and 1
  let t = dotProduct / squaredLength
  t = Math.min(1, Math.max(0, t))
  
  return t
}

function interpolateColor(color1: string, color2: string, t: number): string {
  // Parse hex colors to RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  // Interpolate each channel
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t)
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t)
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t)
  
  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}


//UNDO REDO

function clonePixels<T>(arr: T[]): T[] {
  return arr.map(p => ({ ...p }))
}

function cloneState(): CanvasState {
  return {
    grid: cloneGrid(grid.value),
    activePixels: clonePixels(activePixels),
    backgroundPixels: clonePixels(backgroundPixels),
    strokePixels: clonePixels(strokePixels),
    selectionStart: selectionStart.value
      ? { ...selectionStart.value }
      : null,
    selectionEnd: selectionEnd.value
      ? { ...selectionEnd.value }
      : null
  }
}

function applyState(state: CanvasState) {
  grid.value = cloneGrid(state.grid)
  activePixels = clonePixels(state.activePixels)
  backgroundPixels = clonePixels(state.backgroundPixels)
  strokePixels = clonePixels(state.strokePixels)

  selectionStart.value = state.selectionStart
    ? { ...state.selectionStart }
    : null

  selectionEnd.value = state.selectionEnd
    ? { ...state.selectionEnd }
    : null
}



function cloneGrid(src: string[][]) {
  return src.map(row => [...row])
}

function saveState() {
  undoStack.value.push(cloneState())

  if (undoStack.value.length > 50) {
    undoStack.value.shift()
  }

  redoStack.value = []
}


function undo() {
  if (undoStack.value.length === 0) return

  redoStack.value.push(cloneState())

  const prev = undoStack.value.pop()
  if (!prev) return

  applyState(prev)

  redraw()
}


function redo() {
  if (redoStack.value.length === 0) return

  undoStack.value.push(cloneState())

  const next = redoStack.value.pop()
  if (!next) return

  applyState(next)

  redraw()
}



// 🔥 TOOL HELPERS
function isActive(base: 'pencil' | 'square' | 'circle') {
  if (base === 'pencil') return tool.value === 'pencil'
  return tool.value.startsWith(base)
}

function getModeFor(base: 'square' | 'circle') {
  if (!tool.value.startsWith(base)) return null
  if (tool.value.endsWith('fill')) return 'fill'
  if (tool.value.endsWith('edge')) return 'edge'
  return 'off'
}

function getShape() {
  if (tool.value === 'pencil') return 'pencil'
  if (tool.value.startsWith('square')) return 'square'
  if (tool.value.startsWith('circle')) return 'circle'
}

function getMode() {
  if (tool.value === 'pencil') return 'fill'
  if (tool.value.endsWith('fill')) return 'fill'
  if (tool.value.endsWith('edge')) return 'edge'
  return 'off'
}

function setTool(base: 'pencil' | 'square' | 'circle') {
  if (base === 'pencil') {
    tool.value = 'pencil'
    return
  }

  const states =
    base === 'square'
      ? ['square-fill', 'square-edge', 'square-off']
      : ['circle-fill', 'circle-edge', 'circle-off']

  const index = states.indexOf(tool.value as any)

  if (index === -1) tool.value = states[0] as any
  else tool.value = states[(index + 1) % states.length] as any
}

// INIT GRID
function createGrid(size: number) {
  grid.value = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => '#ffffff')
  )
}

// RESIZE GRID
function resizeGrid(newSize: number) {
  const newGrid: string[][] = []

  for (let y = 0; y < newSize; y++) {
    newGrid[y] = []
    for (let x = 0; x < newSize; x++) {
      newGrid[y][x] = grid.value[y]?.[x] || '#ffffff'
    }
  }

  grid.value = newGrid
  clampOffset()
}

// DRAW PIXEL
function drawPixel(gx: number, gy: number) {
  const r = (brushSize.value - 0.5) / 2
  const rSquared = r * r

  for (let dy = -brushSize.value + 1; dy < brushSize.value; dy++) {
    for (let dx = -brushSize.value + 1; dx < brushSize.value; dx++) {

      if (dx * dx + dy * dy > rSquared) continue

      const x = gx + dx
      const y = gy + dy

      if (
        x >= 0 &&
        y >= 0 &&
        x < gridSize.value &&
        y < gridSize.value
      ) {
        strokePixels.push({ x, y, color: currentColor.value })
      }
    }
  }
}

//LINE
function getLinePixels(x0: number, y0: number, x1: number, y1: number) {
  const pixels: { x: number; y: number; color: string }[] = []

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)

  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1

  let err = dx - dy

  const r = (brushSize.value - 0.5) / 2
  const rSquared = r * r

  while (true) {

    // brush (circle)
    for (let by = -brushSize.value + 1; by < brushSize.value; by++) {
      for (let bx = -brushSize.value + 1; bx < brushSize.value; bx++) {

        if (bx * bx + by * by > rSquared) continue

        pixels.push({
          x: x0 + bx,
          y: y0 + by,
          color: currentColor.value
        })
      }
    }

    if (x0 === x1 && y0 === y1) break

    const e2 = 2 * err

    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }

    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }

  return pixels
}

//MOVE HELPER
function applyPixels(pixels: { x: number; y: number; color: string }[]) {
  for (const p of pixels) {
    if (
      p.x >= 0 &&
      p.y >= 0 &&
      p.x < gridSize.value &&
      p.y < gridSize.value
    ) {
      grid.value[p.y][p.x] = p.color
    }
  }
}

function moveActivePixels(dx: number, dy: number) {
  if (activePixels.length === 0) return

  // 🔥 restore what was underneath
  restoreBackground()

  // move pixels
  for (const p of activePixels) {
    p.x += dx
    p.y += dy
  }

  // 🔥 capture NEW background at new location
  backgroundPixels = activePixels.map(p => ({
    x: p.x,
    y: p.y,
    color: grid.value[p.y]?.[p.x] || '#ffffff'
  }))

  // draw again
  applyPixels(activePixels)

  redraw()
}

function restoreBackground() {
  for (const p of backgroundPixels) {
    if (
      p.x >= 0 &&
      p.y >= 0 &&
      p.x < gridSize.value &&
      p.y < gridSize.value
    ) {
      grid.value[p.y][p.x] = p.color
    }
  }
}


//FILL
// Gradient Flood Fill
function gradientFloodFill(startX: number, startY: number) {
  const targetColor = grid.value[startY][startX]
  const startColor = currentColor.value
  const endColor = gradientColor.value

  // Nothing to do if target is already the start color and we're not doing gradient
  if (!useGradient.value && targetColor === startColor) return
  if (useGradient.value && targetColor === startColor && startColor === endColor) return

  const queue: [number, number, number][] = [] // [x, y, distance]
  queue.push([startX, startY, 0])
  
  const visited = new Set<string>()
  const maxDistance = Math.max(gridSize.value, gridSize.value) // Maximum possible distance

  while (queue.length > 0) {
    const [x, y, distance] = queue.shift()!
    const key = `${x},${y}`

    // bounds check
    if (
      x < 0 ||
      y < 0 ||
      x >= gridSize.value ||
      y >= gridSize.value
    ) continue

    // only fill matching color
    if (grid.value[y][x] !== targetColor) continue
    
    // Avoid revisiting
    if (visited.has(key)) continue
    visited.add(key)

    // Calculate gradient factor based on distance from start point
    let t: number
    if (useGradient.value) {
      // Normalize distance to a value between 0 and 1
      // We use a radial gradient that spreads outward
      t = Math.min(1, distance / maxDistance)
      
      // Optional: Add easing for smoother transition
      // t = Math.sin(t * Math.PI / 2) // Ease out
      // t = 1 - Math.pow(1 - t, 2) // Quadratic ease out
    } else {
      t = 0 // No gradient, use start color
    }
    
    // Interpolate between start and end color
    const color = useGradient.value 
      ? interpolateColor(startColor, endColor, t)
      : startColor
    
    // paint
    grid.value[y][x] = color

    // 4-direction BFS with distance tracking
    queue.push([x + 1, y, distance + 1])
    queue.push([x - 1, y, distance + 1])
    queue.push([x, y + 1, distance + 1])
    queue.push([x, y - 1, distance + 1])
  }
}

function floodFill(startX: number, startY: number) {
  const targetColor = grid.value[startY][startX]
  const replacementColor = currentColor.value

  // ✅ nothing to do
  if (targetColor === replacementColor) return

  const queue: [number, number][] = []
  queue.push([startX, startY])

  while (queue.length > 0) {
    const [x, y] = queue.shift()!

    // bounds check
    if (
      x < 0 ||
      y < 0 ||
      x >= gridSize.value ||
      y >= gridSize.value
    ) continue

    // only fill matching color
    if (grid.value[y][x] !== targetColor) continue

    // paint
    grid.value[y][x] = replacementColor

    // 4-direction BFS
    queue.push([x + 1, y])
    queue.push([x - 1, y])
    queue.push([x, y + 1])
    queue.push([x, y - 1])
  }
}


//ADD IMAGE
function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  saveState() // 🔥 important (undo support)
  importImageToViewport(file)
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map(v => v.toString(16).padStart(2, '0'))
      .join('')
  )
}


function importImageToViewport(file: File) {
  const img = new Image()
  const reader = new FileReader()

  reader.onload = (e) => {
    img.src = e.target?.result as string
  }

  img.onload = () => {
    const size = visibleSize.value

    // offscreen canvas = ONLY visible area
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // optional: preserve pixel sharpness
    ctx.imageSmoothingEnabled = false

    // scale image into visible window
    ctx.drawImage(img, 0, 0, size, size)

    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data

    // 🔥 write ONLY into visible part of grid
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = x + offsetX.value
        const gy = y + offsetY.value

        if (
          gx < 0 ||
          gy < 0 ||
          gx >= gridSize.value ||
          gy >= gridSize.value
        ) continue

        const i = (y * size + x) * 4

        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]

        if (a < 10) {
          grid.value[gy][gx] = '#ffffff'
        } else {
          grid.value[gy][gx] = rgbToHex(r, g, b)
        }
      }
    }

    redraw()
  }

  reader.readAsDataURL(file)
}


// SHAPES
function applyShape() {
  if (!selectionStart.value || !selectionEnd.value) return
  if (getMode() === 'off') return

  const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x)
  const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y)

  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const rx = (x2 - x1) / 2
  const ry = (y2 - y1) / 2

  let pixels: { x: number; y: number; color: string }[] = []

  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {

      let inside = false

      if (getShape() === 'square') inside = true
      else {
        const dx = (x - cx) / (rx || 1)
        const dy = (y - cy) / (ry || 1)
        inside = dx * dx + dy * dy <= 1
      }

      if (!inside) continue

if (getMode() === 'fill') {
  let color = currentColor.value
  
  // Calculate gradient color if enabled
  if (useGradient.value) {
    let t: number
    
    if (getShape() === 'square') {
      // ✅ Use directional gradient based on start and end points
      if (originalSelectionStart.value && selectionEnd.value) {
        t = calculateGradientFactor(x, y, originalSelectionStart.value, selectionEnd.value)
      } else {
        // Fallback to left-to-right if original selection is not available
        t = (x - x1) / (x2 - x1)
      }
    } else {
      // Radial gradient from center for circle
      const dxCenter = (x - cx) / (rx || 1)
      const dyCenter = (y - cy) / (ry || 1)
      const dist = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter)
      t = Math.min(1, Math.max(0, dist))
    }
    
    color = interpolateColor(currentColor.value, gradientColor.value, t)
  }
  
  pixels.push({ x, y, color })
}

      else if (getMode() === 'edge') {
        let isEdge = false

        if (getShape() === 'square') {
          const thickness = brushSize.value

          isEdge =
            x - x1 < thickness ||
            x2 - x < thickness ||
            y - y1 < thickness ||
            y2 - y < thickness
        }

        else {
          const dx = (x - cx) / (rx || 1)
          const dy = (y - cy) / (ry || 1)
          const dist = dx * dx + dy * dy

          const thickness = brushSize.value / Math.max(rx, ry)
          isEdge = Math.abs(dist - 1) <= thickness
        }

        if (isEdge) {
          let color = currentColor.value
          
          // For edge mode, you might want gradient along the edge
          // Calculate gradient color if enabled
            if (useGradient.value && originalSelectionStart.value && selectionEnd.value) {
              let t: number
              
              if (getShape() === 'square') {
                // Use directional gradient based on start and end points
                t = calculateGradientFactor(x, y, originalSelectionStart.value, selectionEnd.value)
              } else {
                // Radial gradient from center for circle
                const dxCenter = (x - cx) / (rx || 1)
                const dyCenter = (y - cy) / (ry || 1)
                const dist = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter)
                t = Math.min(1, Math.max(0, dist))
              }
              
              color = interpolateColor(currentColor.value, gradientColor.value, t)
            }
          
          pixels.push({ x, y, color })
        }
      }
    }
  }

  // Apply the pixels
  backgroundPixels = pixels.map(p => ({
    x: p.x,
    y: p.y,
    color: grid.value[p.y]?.[p.x] || '#ffffff'
  }))

  applyPixels(pixels)
  activePixels = pixels
}

// REDRAW
function redraw() {
  if (!ctx) return

  const pixelSize = CANVAS_SIZE / visibleSize.value
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  for (let y = 0; y < visibleSize.value; y++) {
    for (let x = 0; x < visibleSize.value; x++) {
      const gx = x + offsetX.value
      const gy = y + offsetY.value

      ctx.fillStyle = grid.value[gy]?.[gx] || '#ffffff'
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)

      ctx.strokeStyle = '#ccc'
      ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
  }


  // ===== PREVIEW =====
  //Select Previewx
  if (tool.value === 'select' && selectionStart.value && selectionEnd.value) {
    const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x)
    const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y)

    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 2

    const pixelSize = CANVAS_SIZE / visibleSize.value

    ctx.strokeRect(
      (x1 - offsetX.value) * pixelSize,
      (y1 - offsetY.value) * pixelSize,
      (x2 - x1 + 1) * pixelSize,
      (y2 - y1 + 1) * pixelSize
    )
  }

  // ===== PENCIL PREVIEW =====
  if (
    drawing.value &&
    getShape() === 'pencil' &&
    strokePixels.length > 0
  ) {
    ctx.fillStyle = currentColor.value // or currentColor with alpha

    for (const p of strokePixels) {
      const vx = p.x - offsetX.value
      const vy = p.y - offsetY.value

      // skip offscreen
      if (
        vx < 0 ||
        vy < 0 ||
        vx >= visibleSize.value ||
        vy >= visibleSize.value
      ) continue

      ctx.fillRect(
        vx * pixelSize,
        vy * pixelSize,
        pixelSize,
        pixelSize
      )
    }
  }
// ===== LINE PREVIEW (pixel-perfect) =====
if (
  tool.value === 'line' &&
  selectionStart.value &&
  selectionEnd.value
) {
  ctx.fillStyle = 'rgba(0,0,255,0.4)'

  let x0 = selectionStart.value.x
  let y0 = selectionStart.value.y
  let x1 = selectionEnd.value.x
  let y1 = selectionEnd.value.y

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)

  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1

  let err = dx - dy

  const r = (brushSize.value - 0.5) / 2
  const rSquared = r * r

  while (true) {

    // ===== BRUSH (circle) =====
    for (let by = -brushSize.value + 1; by < brushSize.value; by++) {
      for (let bx = -brushSize.value + 1; bx < brushSize.value; bx++) {

        // circular brush mask
        if (bx * bx + by * by > rSquared) continue

        const px = x0 + bx
        const py = y0 + by

        const vx = px - offsetX.value
        const vy = py - offsetY.value

        // skip offscreen
        if (
          vx < 0 ||
          vy < 0 ||
          vx >= visibleSize.value ||
          vy >= visibleSize.value
        ) continue

        ctx.fillRect(
          vx * pixelSize,
          vy * pixelSize,
          pixelSize,
          pixelSize
        )
      }
    }

    if (x0 === x1 && y0 === y1) break

    const e2 = 2 * err

    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }

    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }

  return // 🔥 prevent other preview logic
}


  // ===== SHAPE PREVIEW =====
  if (
    selectionStart.value &&
    selectionEnd.value &&
    getShape() !== 'pencil' &&
    getMode() !== 'off'
  ) {
    const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x)
    const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y)

    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2
    const rx = (x2 - x1) / 2
    const ry = (y2 - y1) / 2

    ctx.fillStyle = 'rgba(0,0,255,0.2)'

    const thickness = brushSize.value

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {

        // ===== INSIDE CHECK =====
        let inside = false

        if (getShape() === 'square') {
          inside = true
        } else {
          const dx = (x - cx) / (rx || 1)
          const dy = (y - cy) / (ry || 1)
          inside = dx * dx + dy * dy <= 1
        }

        if (!inside) continue

        // ===== DRAW DECISION =====
        let draw = false

        if (getMode() === 'fill') {
          draw = true
        }

        else if (getMode() === 'edge') {

          if (getShape() === 'square') {
            draw =
              x - x1 < thickness ||
              x2 - x < thickness ||
              y - y1 < thickness ||
              y2 - y < thickness
          }

          else {
            const dx = (x - cx) / (rx || 1)
            const dy = (y - cy) / (ry || 1)
            const dist = dx * dx + dy * dy

            const normThickness = thickness / Math.max(rx, ry)
            draw = Math.abs(dist - 1) <= normThickness
          }
        }

        if (!draw) continue

        // ===== SCREEN SPACE =====
        const vx = x - offsetX.value
        const vy = y - offsetY.value

        // skip offscreen pixels (important)
        if (
          vx < 0 ||
          vy < 0 ||
          vx >= visibleSize.value ||
          vy >= visibleSize.value
        ) continue

        ctx.fillRect(
          vx * pixelSize,
          vy * pixelSize,
          pixelSize,
          pixelSize
        )
      }
    }
  }
}

// MOUSE
function getMousePos(e: MouseEvent) {
  if (!canvas.value) return null
  const rect = canvas.value.getBoundingClientRect()
  const pixelSize = CANVAS_SIZE / visibleSize.value

  return {
    x: Math.floor((e.clientX - rect.left) / pixelSize),
    y: Math.floor((e.clientY - rect.top) / pixelSize),
  }
}

function startDrawing(e: MouseEvent) {
  drawing.value = true
  const pos = getMousePos(e)
  if (!pos) return

  const gx = pos.x + offsetX.value
  const gy = pos.y + offsetY.value
  
  saveState()

  if (tool.value === 'select') {
    selectionStart.value = { x: gx, y: gy }
    selectionEnd.value = { x: gx, y: gy }
  }
  if (tool.value === 'fill') {
    // Use gradient flood fill if gradient is enabled
    if (useGradient.value) {
      gradientFloodFill(gx, gy)
    } else {
      floodFill(gx, gy)
    }
  }else if(tool.value === 'line'){
    selectionStart.value = { x: gx, y: gy }
    selectionEnd.value = { x: gx, y: gy }
  }else if (getShape() === 'pencil') drawPixel(gx, gy)
  else {
    originalSelectionStart.value = { x: gx, y: gy }
    selectionStart.value = { x: gx, y: gy }
    selectionEnd.value = { x: gx, y: gy }
  }

  redraw()
}

function stopDrawing() {
  if (tool.value === 'select') {
    if (selectionStart.value && selectionEnd.value) {

      const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x)
      const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x)
      const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y)
      const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y)

      activePixels = []
      backgroundPixels = []

      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {

          const color = grid.value[y]?.[x]
          if (!color) continue

          // store selected pixels
          activePixels.push({ x, y, color })

          // store background (white after cut)
          backgroundPixels.push({
            x,
            y,
            color: '#ffffff'
          })

          // 🔥 CUT (this is what you're missing)
          
        }
      }

      redraw()
    }

    selectionStart.value = null
    selectionEnd.value = null
    drawing.value = false
    return
  }


  if (tool.value === 'fill') {
    drawing.value = false
    redraw()
    return
  }

  if (tool.value === 'line') {
    if (selectionStart.value && selectionEnd.value) {

      const pixels = getLinePixels(
        selectionStart.value.x,
        selectionStart.value.y,
        selectionEnd.value.x,
        selectionEnd.value.y
      )

      backgroundPixels = pixels.map(p => ({
        x: p.x,
        y: p.y,
        color: grid.value[p.y]?.[p.x] || '#ffffff'
      }))
      applyPixels(pixels)

      activePixels = pixels // 🔥 STORE IT
    }

    selectionStart.value = null
    selectionEnd.value = null

    drawing.value = false
    redraw()
    return
  }


  if (getShape() !== 'pencil') {
    applyShape()
    
    selectionStart.value = null
    selectionEnd.value = null
  }

  if (getShape() === 'pencil') {

    if (strokePixels.length > 0) {

      // 🔥 capture background
      backgroundPixels = strokePixels.map(p => ({
        x: p.x,
        y: p.y,
        color: grid.value[p.y]?.[p.x] || '#ffffff'
      }))

      applyPixels(strokePixels)

      activePixels = strokePixels
    }

    strokePixels = []

    drawing.value = false
    redraw()
    return
  }



  drawing.value = false

  redraw()
}

function draw(e: MouseEvent) {
  if (!drawing.value) return

  const pos = getMousePos(e)
  if (!pos) return

  const gx = pos.x + offsetX.value
  const gy = pos.y + offsetY.value

  if (tool.value === 'select') {
    selectionEnd.value = { x: gx, y: gy }
  }


  if (tool.value === 'line') {
    selectionEnd.value = { x: gx, y: gy }
  }else if (getShape() === 'pencil') {
    drawPixel(gx, gy)
  }else selectionEnd.value = { x: gx, y: gy }

  redraw()
}

// NAVIGATION
function handleWheel(e: WheelEvent) {
  const pos = getMousePos(e)
  if (!pos) return

  if (e.deltaY < 0 && visibleSize.value > 2) visibleSize.value--
  else if (e.deltaY > 0 && visibleSize.value < gridSize.value) visibleSize.value++
  else return

  offsetX.value = Math.floor(pos.x + offsetX.value - visibleSize.value / 2)
  offsetY.value = Math.floor(pos.y + offsetY.value - visibleSize.value / 2)

  clampOffset()
  redraw()
}

function moveLeft() { offsetX.value--; clampOffset(); redraw() }
function moveRight() { offsetX.value++; clampOffset(); redraw() }
function moveUp() { offsetY.value--; clampOffset(); redraw() }
function moveDown() { offsetY.value++; clampOffset(); redraw() }

function handleKey(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'z') {
    undo()
    return
  }

  if (e.ctrlKey && e.key === 'y') {
    redo()
    return
  }

  if (e.key === 'w') moveUp()
  if (e.key === 's') moveDown()
  if (e.key === 'a') moveLeft()
  if (e.key === 'd') moveRight()

  if (e.key === 'ArrowUp') moveActivePixels(0, -1)
  if (e.key === 'ArrowDown') moveActivePixels(0, 1)
  if (e.key === 'ArrowLeft') moveActivePixels(-1, 0)
  if (e.key === 'ArrowRight') moveActivePixels(1, 0)



}

function clampOffset() {
  const maxOffset = gridSize.value - visibleSize.value
  offsetX.value = Math.max(0, Math.min(offsetX.value, maxOffset))
  offsetY.value = Math.max(0, Math.min(offsetY.value, maxOffset))
}

// INIT
onMounted(async () => {
  if (canvas.value) {
    canvas.value.width = CANVAS_SIZE
    canvas.value.height = CANVAS_SIZE
    ctx = canvas.value.getContext('2d')
  }

  const id = route.params.id as string | undefined

  if (id) {
    // EDIT MODE
    pictureId.value = id

    const pic = await getPictureById(id)

    grid.value = pic.pixels
    gridSize.value = pic.size
    visibleSize.value = pic.size

  } else {
    // CREATE MODE
    createGrid(gridSize.value)
  }

  redraw()
  canvas.value?.focus()
})

watch(gridSize, () => {
  resizeGrid(gridSize.value)
  if (visibleSize.value > gridSize.value) visibleSize.value = gridSize.value
  redraw()
})

watch(visibleSize, () => {
  clampOffset()
  redraw()
})
</script>

<style scoped>
.app-container {
  display: grid;
  grid-template-columns: 220px 1fr 220px;
  height: 100vh;
  background: #1e1e1e;
  color: #eee;
  font-family: sans-serif;
}

/* SIDEBARS */
.sidebar {
  padding: 15px;
  background: #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-right: 1px solid #444;
}

.sidebar.right {
  border-right: none;
  border-left: 1px solid #444;
}

.sidebar h3 {
  margin-top: 10px;
  margin-bottom: 5px;
  font-size: 14px;
  color: #bbb;
}

/* CENTER */
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* TOOLBAR */
.toolbar {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #333;
  border-bottom: 1px solid #444;
  width: 98%;
  justify-content: center;
}

/* CANVAS AREA */
.canvas-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.middle {
  display: flex;
  align-items: center;
}

/* BUTTONS */
button {
  background: #444;
  color: white;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 6px;
}

button:hover {
  background: #555;
}

button.active {
  background: #0084ff;
}

/* TOOL BUTTONS */
.tool-btn {
  width: 40px;
  height: 40px;
  font-size: 18px;
}

/* SPECIAL SHAPES */
.tool-btn.square {
  background: linear-gradient(to bottom, #aaa, #777);
}

.tool-btn.circle {
  border-radius: 50%;
  background: linear-gradient(to bottom, #aaa, #777);
}

/* ARROWS */
.arrow {
  margin: 5px;
  font-size: 18px;
}

/* INPUTS */
input[type="number"] {
  width: 80px;
}

input[type="color"] {
  width: 100%;
  height: 30px;
  border: none;
}

/* BRUSH */
.brush-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
html, body, #app {
  height: 100%;
  margin: 0;
}


.app-container {
  display: grid;
  grid-template-columns: 220px 1fr 220px;
  height: 100%;
  background: #1e1e1e;
  color: #eee;
  overflow: hidden; /* prevents stray scroll gaps */
}

/* SIDEBARS */
.sidebar {
  padding: 15px;
  background: #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.sidebar.right {
  border-left: 1px solid #444;
}

.sidebar.left {
  border-right: 1px solid #444;
}

/* CENTER */
.center {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* TOOLBAR */
.toolbar {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background: #333;
  border-bottom: 1px solid #444;
}

/* GROUPING */
.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* BRUSH */
.brush {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* CANVAS AREA (this is key fix) */
.canvas-wrapper {
  flex: 1; /* 🔥 fills remaining space */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* CENTER ROW */
.middle {
  display: flex;
  align-items: center;
}

/* BUTTONS */
button {
  background: #444;
  color: white;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 6px;
}

button:hover {
  background: #555;
}

button.active {
  background: #0084ff;
}

/* TOOL BUTTONS */
.tool-btn {
  width: 40px;
  height: 40px;
  font-size: 18px;
}

/* SHAPES */
.tool-btn.square {
  background: linear-gradient(to bottom, #aaa, #777);
}

.tool-btn.circle {
  border-radius: 50%;
  background: linear-gradient(to bottom, #aaa, #777);
}

/* ARROWS */
.arrow {
  margin: 5px;
}

/* INPUTS */
input[type="number"] {
  width: 70px;
}

input[type="color"] {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: none;
}



/* Minimal version - cleaner UI */



/* Simple text indicators instead of pseudo-elements */
.tool-btn.square.fill::before {
  content: '■';
  font-size: 20px;
}

.tool-btn.square.edge::before {
  content: '□';
  font-size: 20px;
}

.tool-btn.square.off::before {
  content: '✕';
  font-size: 20px;
}

.tool-btn.circle.fill::before {
  content: '●';
  font-size: 20px;
}

.tool-btn.circle.edge::before {
  content: '○';
  font-size: 22px;
}

.tool-btn.circle.off::before {
  content: '✕';
  font-size: 20px;
}

/* Active state */
.tool-btn.square.active,
.tool-btn.circle.active {
  outline: 2px solid white;
  outline-offset: 2px;
  transform: scale(1.05);
}
</style>