<template>
  <div class="app-container" tabindex="0" @keydown="handleKey">

    <!-- Mobile menu toggle buttons -->
    <button class="menu-toggle" @click="toggleLeftSidebar" title="Menu">☰</button>
    <button class="right-menu-toggle" @click="toggleRightSidebar" title="Options">⚙️</button>

    <!-- Sidebar overlays -->
    <div v-if="leftSidebarOpen" class="sidebar-overlay" @click="closeSidebars"></div>
    <div v-if="rightSidebarOpen" class="sidebar-overlay" @click="closeSidebars"></div>

    <!-- LEFT PANEL -->
    <div class="sidebar left" :class="{ open: leftSidebarOpen }">
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

          <button
            @click="tool = 'text'"
            :class="{ active: tool === 'text' }"
            title="Add text (drag to create text area)"
          >📝 Text</button>

          <button
            @click="tool = 'magic-wand'"
            :class="{ active: tool === 'magic-wand' }"
            title="Magic wand - select contiguous similar colors"
          >𝄞</button>

          <button
            @click="tool = 'spray'"
            :class="{ active: tool === 'spray' }"
            title="Spray can / Airbrush"
          >⛫💨</button>
        </div>

        <!-- BRUSH + COLORS -->
        <div class="tool-group">

          <div class="brush">
            <label>Brush size:</label>
            <button @click="brushSize--" title="Brush smaller">-</button>
            <span>{{ brushSize }}</span>
            <button @click="brushSize++" title="Brush bigger">+</button>
          </div>
          
          <label>Primary:</label>
            <input type="color" v-model="currentColor" title="Primary color" />
            
            <!-- SWAP BUTTON -->
            <button 
              @click="swapColors" 
              class="swap-btn" 
              title="Swap colors"
            >
              ⇄
            </button>
            
            <label>Gradient:</label>
            <input type="color" v-model="gradientColor" title="Gradient color" />

          <button 
            :class="{ active: useGradient }" 
            @click="useGradient = !useGradient"
            title="Toggle gradient mode"
          >
            gradient 🌈
          </button>

          <!-- Spray can density control -->
          <div v-if="tool === 'spray'" class="spray-control">
            <label>Density:</label>
            <input type="range" v-model.number="sprayDensity" min="1" max="50" />
            <span>{{ sprayDensity }}%</span>
          </div>

          <!-- Magic wand tolerance -->
          <div v-if="tool === 'magic-wand'" class="tolerance-control">
            <label>Tolerance:</label>
            <input type="range" v-model.number="magicWandTolerance" min="0" max="100" />
            <span>{{ magicWandTolerance }}</span>
          </div>
        </div>

        <!-- FILTERS GROUP -->
        <div class="tool-group">
          <button @click="applyBlur" title="Simple blur">🔷 Blur</button>
          <button @click="applySharpen" title="Sharpen filter">✨ Sharpen</button>
          <button @click="applyGaussianBlur" title="Gaussian blur">🌀 Gaussian Blur</button>
        </div>

      </div>

      <!-- CANVAS -->
      <div class="canvas-wrapper">
        
        <!-- Mode Toggle Button for Mobile -->
        <button class="mode-toggle" :class="{ active: isPanMode, pan: isPanMode, draw: !isPanMode }" @click="toggleMode" title="Toggle between drawing and panning">
          {{ isPanMode ? '✋' : '✏️' }}
        </button>

        <div class="middle">
          

          <canvas
            ref="canvas"
            @mousedown="startDrawing"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @mousemove="draw"
            @wheel.prevent="handleWheel"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchEnd"
          ></canvas>
          <button class="arrow" @click="moveUp" @touchstart="moveUp">⬆️</button>
          <button class="arrow" @click="moveLeft" @touchstart="moveLeft">⬅️</button>
          <button class="arrow" @click="moveRight" @touchstart="moveRight">➡️</button>
          <button class="arrow" @click="moveDown" @touchstart="moveDown">⬇️</button>

          
        </div>
       
      </div>

      <!-- PREVIEW WINDOW (Minimap) -->
      <div class="preview-window" v-if="showPreviewWindow" v-show="minimapVisible">
       
        <canvas 
          ref="previewCanvas" 
          class="preview-canvas"
          @click="jumpToPosition"
        ></canvas>
        <div class="preview-controls">
          <button @click="toggleMinimap">Hide</button>
        </div>
      </div>

      <!-- Toggle preview button -->
      <button class="toggle-preview" @click="toggleMinimap" title="Show minimap">
        🗺️
      </button>

    </div>


    <!-- RIGHT PANEL -->
    <div class="sidebar right" :class="{ open: rightSidebarOpen }">
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

    <!-- Text Input Dialog Modal -->
    <div v-if="showTextDialog" class="modal-overlay" @click.self="showTextDialog = false">
      <div class="modal">
        <h3>Enter Text</h3>
        <textarea 
          v-model="textInput" 
          placeholder="Type your text here..."
          rows="4"
          autofocus
        ></textarea>
        
        <div class="modal-controls">
          <label>
            Font Size:
            <input type="number" v-model.number="textSize" min="8" max="100" />
            <small>(0 = auto-fit)</small>
          </label>
          
          <label>
            Font:
            <select v-model="textFont">
              <option value="monospace">Monospace</option>
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="'Courier New'">Courier New</option>
              <option value="'Times New Roman'">Times New Roman</option>
              <option value="Georgia">Georgia</option>
            </select>
          </label>
        </div>
        
        <div class="modal-buttons">
          <button @click="submitText">Add Text</button>
          <button @click="showTextDialog = false">Cancel</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
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
const previewCanvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let previewCtx: CanvasRenderingContext2D | null = null

const CANVAS_SIZE = 600
const PREVIEW_SIZE = 150

// GRID
const gridSize = ref(100)
const visibleSize = ref(100)

//Preview Map
const minimapVisible = ref(true)  // Track minimap visibility


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

//for mobile functionality
// Add after other refs
const isPanMode = ref(false) // false = draw mode, true = pan mode
const lastTouchPos = ref<{ x: number; y: number } | null>(null)

const undoStack = ref<CanvasState[]>([])
const redoStack = ref<CanvasState[]>([])

//GRADIENT
const gradientColor = ref('#0000ff')
const useGradient = ref(false)
const originalSelectionStart = ref<{ x: number; y: number } | null>(null)

// OFFSET
const offsetX = ref(0)
const offsetY = ref(0)

// STATE
const drawing = ref(false)
const currentColor = ref('#000000')

// PREVIEW WINDOW
const showPreviewWindow = ref(true)

// SPRAY CAN
const sprayDensity = ref(20)
// Spray
let sprayPreviewPixels: { x: number; y: number; color: string }[] = []  // ← ADD THIS LINE

// MAGIC WAND
const magicWandTolerance = ref(30)

// 🔥 UNIFIED TOOL
const tool = ref<
  | 'pencil'
  | 'fill'
  | 'text'
  | 'select'
  | 'line'
  | 'magic-wand'
  | 'spray'
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

// TEXT TOOL STATE
const showTextDialog = ref(false)
const textInput = ref('')
const textPosition = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
const textSize = ref(16)
const textFont = ref('monospace')
const tempTextRect = ref<{ start: { x: number; y: number }, end: { x: number; y: number } } | null>(null)


// Add these refs with your other refs
const leftSidebarOpen = ref(false)
const rightSidebarOpen = ref(false)

// Add these functions
function toggleLeftSidebar() {
  leftSidebarOpen.value = !leftSidebarOpen.value
}

function toggleRightSidebar() {
  rightSidebarOpen.value = !rightSidebarOpen.value
}

function closeSidebars() {
  leftSidebarOpen.value = false
  rightSidebarOpen.value = false
}

//Mobile helper
// Toggle between draw and pan mode
function toggleMode() {
  isPanMode.value = !isPanMode.value
  saveMessage.value = isPanMode.value ? 'Pan Mode: Move canvas with finger' : 'Draw Mode: Draw with finger'
  setTimeout(() => {
    if (saveMessage.value === 'Pan Mode: Move canvas with finger' || saveMessage.value === 'Draw Mode: Draw with finger') {
      saveMessage.value = ''
    }
  }, 1500)
}

// Handle touch start for drawing/panning
function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  

  
  if (isPanMode.value) {
    lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
  } else {
    // Simulate mouse down for drawing
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true
    })
    canvas.value?.dispatchEvent(mouseEvent)
  }
}

// Handle touch move for drawing/panning
function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  
  if (isPanMode.value && lastTouchPos.value) {
    // Pan mode - move the canvas
    const dx = touch.clientX - lastTouchPos.value.x
    const dy = touch.clientY - lastTouchPos.value.y
    const pixelSize = CANVAS_SIZE / visibleSize.value
    offsetX.value = Math.max(0, Math.min(gridSize.value - visibleSize.value, offsetX.value - Math.round(dx / pixelSize)))
    offsetY.value = Math.max(0, Math.min(gridSize.value - visibleSize.value, offsetY.value - Math.round(dy / pixelSize)))
    lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
    redraw()
    updatePreview()
  } else {
    // Draw mode - simulate mouse move
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true
    })
    canvas.value?.dispatchEvent(mouseEvent)
  }
}

// Handle touch end
function handleTouchEnd(e: TouchEvent) {
  e.preventDefault()
  if (!isPanMode.value) {
    const mouseEvent = new MouseEvent('mouseup', {
      bubbles: true
    })
    canvas.value?.dispatchEvent(mouseEvent)
  }
  lastTouchPos.value = null
}


//SAVE HELPERS
async function handleSave() {
  try {
    saving.value = true
    saveMessage.value = ''

    if (pictureId.value) {
      await updatePicture(pictureId.value, grid.value)
      saveMessage.value = '✅ Updated'
    } else {
      const newPic = await savePicture(grid.value)
      pictureId.value = newPic.id
      saveMessage.value = '✅ Saved'
    }

  } catch (err) {
    console.error(err)
    saveMessage.value = '❌ Save failed'
  } finally {
    saving.value = false
  }
}

//SWAP COLORS
function swapColors() {
  const tempColor = currentColor.value
  const tempGradient = gradientColor.value
  
  currentColor.value = tempGradient
  gradientColor.value = tempColor
  
  saveMessage.value = '🔄 Colors swapped'
  setTimeout(() => {
    if (saveMessage.value === '🔄 Colors swapped') {
      saveMessage.value = ''
    }
  }, 1500)
}

// Helper function to calculate gradient factor
function calculateGradientFactor(
  x: number, 
  y: number, 
  start: { x: number, y: number }, 
  end: { x: number, y: number }
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  
  if (dx === 0 && dy === 0) return 0
  
  const px = x - start.x
  const py = y - start.y
  
  const dotProduct = px * dx + py * dy
  const squaredLength = dx * dx + dy * dy
  
  let t = dotProduct / squaredLength
  t = Math.min(1, Math.max(0, t))
  
  return t
}

function interpolateColor(color1: string, color2: string, t: number): string {
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t)
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t)
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t)
  
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
  updatePreview()
}

function redo() {
  if (redoStack.value.length === 0) return

  undoStack.value.push(cloneState())

  const next = redoStack.value.pop()
  if (!next) return

  applyState(next)

  redraw()
  updatePreview()
}

//MAP PREVIEW HELPER
// Toggle minimap visibility and force redraw
function toggleMinimap() {
  showPreviewWindow.value = !showPreviewWindow.value
  
  // Force preview to redraw when showing
  if (showPreviewWindow.value) {
    setTimeout(() => {
      // Re-get the canvas context
      if (previewCanvas.value) {
        previewCtx = previewCanvas.value.getContext('2d')
        updatePreview()
      }
    }, 50)
  }
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
function drawPixel(gx: number, gy: number, color?: string) {
  const r = (brushSize.value - 0.5) / 2
  const rSquared = r * r
  const useColor = color || currentColor.value

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
        strokePixels.push({ x, y, color: useColor })
      }
    }
  }
}

function updateSprayPreview(gx: number, gy: number) {
  sprayPreviewPixels = []
  const radius = brushSize.value
  const density = sprayDensity.value / 100
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= radius && Math.random() < density) {
        const x = gx + dx
        const y = gy + dy
        if (x >= 0 && y >= 0 && x < gridSize.value && y < gridSize.value) {
          sprayPreviewPixels.push({ x, y, color: currentColor.value })
        }
      }
    }
  }
}


function applySprayPixelImmediately(gx: number, gy: number) {
  const radius = brushSize.value
  const density = sprayDensity.value / 100
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= radius && Math.random() < density) {
        const x = gx + dx
        const y = gy + dy
        if (x >= 0 && y >= 0 && x < gridSize.value && y < gridSize.value) {
          // Apply DIRECTLY to grid (immediate)
          grid.value[y][x] = currentColor.value
          // Also store for undo/redo
          strokePixels.push({ x, y, color: currentColor.value })
        }
      }
    }
  }
}

// MAGIC WAND SELECTION
function magicWandSelect(startX: number, startY: number) {
  const targetColor = grid.value[startY][startX]
  const queue: [number, number][] = [[startX, startY]]
  const visited = new Set<string>()
  const selected: { x: number; y: number; color: string }[] = []

  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    const key = `${x},${y}`

    if (x < 0 || y < 0 || x >= gridSize.value || y >= gridSize.value) continue
    if (visited.has(key)) continue

    const currentColorHex = grid.value[y][x]
    
    // Check color similarity with tolerance
    const targetRgb = hexToRgb(targetColor)
    const currentRgb = hexToRgb(currentColorHex)
    const diff = Math.sqrt(
      Math.pow(targetRgb.r - currentRgb.r, 2) +
      Math.pow(targetRgb.g - currentRgb.g, 2) +
      Math.pow(targetRgb.b - currentRgb.b, 2)
    )
    const maxDiff = Math.sqrt(3 * 255 * 255) // Max possible difference
    const similarity = 1 - (diff / maxDiff)
    
    if (similarity * 100 >= (100 - magicWandTolerance.value)) {
      visited.add(key)
      selected.push({ x, y, color: currentColorHex })
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
  }

  // Store selection
  activePixels = selected
  backgroundPixels = selected.map(p => ({
    x: p.x,
    y: p.y,
    color: '#ffffff'
  }))
  
  redraw()
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

// FILTERS
function applyBlur() {
  saveState()
  const newGrid = cloneGrid(grid.value)
  const size = gridSize.value
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, count = 0
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const color = grid.value[ny][nx]
            const rgb = hexToRgb(color)
            r += rgb.r
            g += rgb.g
            b += rgb.b
            count++
          }
        }
      }
      
      r = Math.floor(r / count)
      g = Math.floor(g / count)
      b = Math.floor(b / count)
      newGrid[y][x] = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    }
  }
  
  grid.value = newGrid
  redraw()
  updatePreview()
}

function applySharpen() {
  saveState()
  const newGrid = cloneGrid(grid.value)
  const size = gridSize.value
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ]
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const color = grid.value[ny][nx]
            const rgb = hexToRgb(color)
            const k = kernel[dy + 1][dx + 1]
            r += rgb.r * k
            g += rgb.g * k
            b += rgb.b * k
          }
        }
      }
      
      r = Math.min(255, Math.max(0, r))
      g = Math.min(255, Math.max(0, g))
      b = Math.min(255, Math.max(0, b))
      newGrid[y][x] = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    }
  }
  
  grid.value = newGrid
  redraw()
  updatePreview()
}

function applyGaussianBlur() {
  saveState()
  const newGrid = cloneGrid(grid.value)
  const size = gridSize.value
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ]
  const kernelSum = 16
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const color = grid.value[ny][nx]
            const rgb = hexToRgb(color)
            const k = kernel[dy + 1][dx + 1]
            r += rgb.r * k
            g += rgb.g * k
            b += rgb.b * k
          } else {
            const color = grid.value[y][x]
            const rgb = hexToRgb(color)
            const k = kernel[dy + 1][dx + 1]
            r += rgb.r * k
            g += rgb.g * k
            b += rgb.b * k
          }
        }
      }
      
      r = Math.floor(r / kernelSum)
      g = Math.floor(g / kernelSum)
      b = Math.floor(b / kernelSum)
      newGrid[y][x] = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    }
  }
  
  grid.value = newGrid
  redraw()
  updatePreview()
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

  restoreBackground()

  for (const p of activePixels) {
    p.x += dx
    p.y += dy
  }

  backgroundPixels = activePixels.map(p => ({
    x: p.x,
    y: p.y,
    color: grid.value[p.y]?.[p.x] || '#ffffff'
  }))

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
function gradientFloodFill(startX: number, startY: number) {
  const targetColor = grid.value[startY][startX]
  const startColor = currentColor.value
  const endColor = gradientColor.value

  if (!useGradient.value && targetColor === startColor) return
  if (useGradient.value && targetColor === startColor && startColor === endColor) return

  const queue: [number, number, number][] = [[startX, startY, 0]]
  const visited = new Set<string>()
  const maxDistance = Math.max(gridSize.value, gridSize.value)

  while (queue.length > 0) {
    const [x, y, distance] = queue.shift()!
    const key = `${x},${y}`

    if (x < 0 || y < 0 || x >= gridSize.value || y >= gridSize.value) continue
    if (grid.value[y][x] !== targetColor) continue
    if (visited.has(key)) continue
    visited.add(key)

    let t: number
    if (useGradient.value) {
      t = Math.min(1, distance / maxDistance)
    } else {
      t = 0
    }
    
    const color = useGradient.value 
      ? interpolateColor(startColor, endColor, t)
      : startColor
    
    grid.value[y][x] = color

    queue.push([x + 1, y, distance + 1])
    queue.push([x - 1, y, distance + 1])
    queue.push([x, y + 1, distance + 1])
    queue.push([x, y - 1, distance + 1])
  }
}

function floodFill(startX: number, startY: number) {
  const targetColor = grid.value[startY][startX]
  const replacementColor = currentColor.value

  if (targetColor === replacementColor) return

  const queue: [number, number][] = [[startX, startY]]

  while (queue.length > 0) {
    const [x, y] = queue.shift()!

    if (x < 0 || y < 0 || x >= gridSize.value || y >= gridSize.value) continue
    if (grid.value[y][x] !== targetColor) continue

    grid.value[y][x] = replacementColor

    queue.push([x + 1, y])
    queue.push([x - 1, y])
    queue.push([x, y + 1])
    queue.push([x, y - 1])
  }
}

// TEXT TOOL FUNCTIONS
function renderTextToGrid(
  text: string, 
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
) {
  if (!text.trim()) return

  const rectX = Math.min(x1, x2)
  const rectY = Math.min(y1, y2)
  const rectWidth = Math.abs(x2 - x1) + 1
  const rectHeight = Math.abs(y2 - y1) + 1

  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = rectWidth
  offscreenCanvas.height = rectHeight
  const offscreenCtx = offscreenCanvas.getContext('2d')
  
  if (!offscreenCtx) return

  let fontSize = textSize.value
  let fit = false
  
  if (textSize.value === 0) {
    fontSize = Math.min(rectWidth, rectHeight) * 0.8
    while (!fit && fontSize > 8) {
      offscreenCtx.font = `${fontSize}px ${textFont.value}`
      const metrics = offscreenCtx.measureText(text)
      if (metrics.width <= rectWidth && fontSize <= rectHeight) {
        fit = true
      } else {
        fontSize -= 2
      }
    }
  }

  offscreenCtx.clearRect(0, 0, rectWidth, rectHeight)
  offscreenCtx.font = `${fontSize}px ${textFont.value}`
  offscreenCtx.fillStyle = currentColor.value
  offscreenCtx.textBaseline = 'middle'
  offscreenCtx.textAlign = 'center'
  offscreenCtx.fillText(text, rectWidth / 2, rectHeight / 2)

  const imageData = offscreenCtx.getImageData(0, 0, rectWidth, rectHeight)
  const data = imageData.data

  const backgroundPixelsToSave: { x: number; y: number; color: string }[] = []

  for (let y = 0; y < rectHeight; y++) {
    for (let x = 0; x < rectWidth; x++) {
      const pixelIndex = (y * rectWidth + x) * 4
      const alpha = data[pixelIndex + 3]
      
      const gridX = rectX + x
      const gridY = rectY + y
      
      if (gridX >= 0 && gridX < gridSize.value && 
          gridY >= 0 && gridY < gridSize.value) {
        
        if (alpha > 10) {
          const existingBackground = backgroundPixelsToSave.find(
            p => p.x === gridX && p.y === gridY
          )
          if (!existingBackground) {
            backgroundPixelsToSave.push({
              x: gridX,
              y: gridY,
              color: grid.value[gridY][gridX]
            })
          }
          
          const r = data[pixelIndex]
          const g = data[pixelIndex + 1]
          const b = data[pixelIndex + 2]
          const alphaFactor = alpha / 255
          
          if (alphaFactor < 1) {
            const bgColor = grid.value[gridY][gridX]
            const bgR = parseInt(bgColor.slice(1, 3), 16)
            const bgG = parseInt(bgColor.slice(3, 5), 16)
            const bgB = parseInt(bgColor.slice(5, 7), 16)
            
            const blendedR = Math.round(r * alphaFactor + bgR * (1 - alphaFactor))
            const blendedG = Math.round(g * alphaFactor + bgG * (1 - alphaFactor))
            const blendedB = Math.round(b * alphaFactor + bgB * (1 - alphaFactor))
            
            grid.value[gridY][gridX] = `#${((1 << 24) + (blendedR << 16) + (blendedG << 8) + blendedB).toString(16).slice(1)}`
          } else {
            grid.value[gridY][gridX] = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
          }
        }
      }
    }
  }

  backgroundPixels = backgroundPixelsToSave
  activePixels = []

  for (let y = rectY; y <= rectY + rectHeight - 1; y++) {
    for (let x = rectX; x <= rectX + rectWidth - 1; x++) {
      if (x >= 0 && x < gridSize.value && y >= 0 && y < gridSize.value) {
        activePixels.push({
          x, y,
          color: grid.value[y][x]
        })
      }
    }
  }
}

function submitText() {
  if (textInput.value.trim() && textPosition.value) {
    const { x1, y1, x2, y2 } = textPosition.value
    renderTextToGrid(textInput.value, x1, y1, x2, y2)
    redraw()
    updatePreview()
  }
  
  showTextDialog.value = false
  textInput.value = ''
  textPosition.value = null
}

//ADD IMAGE
function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  saveState()
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

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, size, size)

    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = x + offsetX.value
        const gy = y + offsetY.value

        if (gx < 0 || gy < 0 || gx >= gridSize.value || gy >= gridSize.value) continue

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
    updatePreview()
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
        
        if (useGradient.value) {
          let t: number
          
          if (getShape() === 'square') {
            if (originalSelectionStart.value && selectionEnd.value) {
              t = calculateGradientFactor(x, y, originalSelectionStart.value, selectionEnd.value)
            } else {
              t = (x - x1) / (x2 - x1)
            }
          } else {
            const dxCenter = (x - cx) / (rx || 1)
            const dyCenter = (y - cy) / (ry || 1)
            const dist = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter)
            t = Math.min(1, Math.max(0, dist))
          }
          
          color = interpolateColor(currentColor.value, gradientColor.value, t)
        }
        
        pixels.push({ x, y, color })
      } else if (getMode() === 'edge') {
        let isEdge = false

        if (getShape() === 'square') {
          const thickness = brushSize.value
          isEdge = x - x1 < thickness || x2 - x < thickness || y - y1 < thickness || y2 - y < thickness
        } else {
          const dx = (x - cx) / (rx || 1)
          const dy = (y - cy) / (ry || 1)
          const dist = dx * dx + dy * dy
          const thickness = brushSize.value / Math.max(rx, ry)
          isEdge = Math.abs(dist - 1) <= thickness
        }

        if (isEdge) {
          let color = currentColor.value
          if (useGradient.value && originalSelectionStart.value && selectionEnd.value) {
            let t: number
            if (getShape() === 'square') {
              t = calculateGradientFactor(x, y, originalSelectionStart.value, selectionEnd.value)
            } else {
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

  backgroundPixels = pixels.map(p => ({
    x: p.x,
    y: p.y,
    color: grid.value[p.y]?.[p.x] || '#ffffff'
  }))

  applyPixels(pixels)
  activePixels = pixels
}

// PREVIEW WINDOW (Minimap)
function updatePreview() {
  if (!previewCtx || !previewCanvas.value) return
  
  const previewSize = PREVIEW_SIZE
  const gridW = gridSize.value
  const gridH = gridSize.value
  
  previewCanvas.value.width = previewSize
  previewCanvas.value.height = previewSize
  previewCtx.clearRect(0, 0, previewSize, previewSize)
  
  const cellW = previewSize / gridW
  const cellH = previewSize / gridH
  
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      previewCtx.fillStyle = grid.value[y]?.[x] || '#ffffff'
      previewCtx.fillRect(x * cellW, y * cellH, cellW, cellH)
    }
  }
  
  // Draw viewport rectangle
  const viewX = offsetX.value * cellW
  const viewY = offsetY.value * cellW
  const viewW = visibleSize.value * cellW
  const viewH = visibleSize.value * cellH
  
  previewCtx.strokeStyle = 'red'
  previewCtx.lineWidth = 2
  previewCtx.strokeRect(viewX, viewY, viewW, viewH)
}

function jumpToPosition(e: MouseEvent) {
  if (!previewCanvas.value) return
  
  const rect = previewCanvas.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  
  offsetX.value = Math.floor(x * gridSize.value - visibleSize.value / 2)
  offsetY.value = Math.floor(y * gridSize.value - visibleSize.value / 2)
  
  clampOffset()
  redraw()
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

  // Select Preview
  if (tool.value === 'select' && selectionStart.value && selectionEnd.value) {
    const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x)
    const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y)

    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 2

    ctx.strokeRect(
      (x1 - offsetX.value) * pixelSize,
      (y1 - offsetY.value) * pixelSize,
      (x2 - x1 + 1) * pixelSize,
      (y2 - y1 + 1) * pixelSize
    )
  }

  // Text Preview
  if (tool.value === 'text' && selectionStart.value && selectionEnd.value) {
    const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x)
    const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y)

    ctx.strokeStyle = 'green'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.strokeRect(
      (x1 - offsetX.value) * pixelSize,
      (y1 - offsetY.value) * pixelSize,
      (x2 - x1 + 1) * pixelSize,
      (y2 - y1 + 1) * pixelSize
    )
    
    ctx.setLineDash([])
  }

  // Pencil Preview
  if (drawing.value && getShape() === 'pencil' && strokePixels.length > 0) {
    ctx.fillStyle = currentColor.value

    for (const p of strokePixels) {
      const vx = p.x - offsetX.value
      const vy = p.y - offsetY.value

      if (vx < 0 || vy < 0 || vx >= visibleSize.value || vy >= visibleSize.value) continue

      ctx.fillRect(vx * pixelSize, vy * pixelSize, pixelSize, pixelSize)
    }
  }


  // ===== SPRAY PREVIEW =====
  if (drawing.value && tool.value === 'spray' && sprayPreviewPixels.length > 0) {
    ctx.globalAlpha = 0.5  // Semi-transparent preview
    
    for (const p of sprayPreviewPixels) {
      const vx = p.x - offsetX.value
      const vy = p.y - offsetY.value
      
      if (vx >= 0 && vy >= 0 && vx < visibleSize.value && vy < visibleSize.value) {
        ctx.fillStyle = currentColor.value
        ctx.fillRect(vx * pixelSize, vy * pixelSize, pixelSize, pixelSize)
      }
    }
    
    ctx.globalAlpha = 1.0  // Reset opacity
  }
  
  // Line Preview
  if (tool.value === 'line' && selectionStart.value && selectionEnd.value) {
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
      for (let by = -brushSize.value + 1; by < brushSize.value; by++) {
        for (let bx = -brushSize.value + 1; bx < brushSize.value; bx++) {
          if (bx * bx + by * by > rSquared) continue
          const px = x0 + bx
          const py = y0 + by
          const vx = px - offsetX.value
          const vy = py - offsetY.value
          if (vx < 0 || vy < 0 || vx >= visibleSize.value || vy >= visibleSize.value) continue
          ctx.fillRect(vx * pixelSize, vy * pixelSize, pixelSize, pixelSize)
        }
      }
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; x0 += sx }
      if (e2 < dx) { err += dx; y0 += sy }
    }
    return
  }

  // Shape Preview
  if (selectionStart.value && selectionEnd.value && getShape() !== 'pencil' && getMode() !== 'off') {
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
        let inside = false
        if (getShape() === 'square') inside = true
        else {
          const dx = (x - cx) / (rx || 1)
          const dy = (y - cy) / (ry || 1)
          inside = dx * dx + dy * dy <= 1
        }
        if (!inside) continue
        
        let draw = false
        if (getMode() === 'fill') draw = true
        else if (getMode() === 'edge') {
          if (getShape() === 'square') {
            draw = x - x1 < thickness || x2 - x < thickness || y - y1 < thickness || y2 - y < thickness
          } else {
            const dx = (x - cx) / (rx || 1)
            const dy = (y - cy) / (ry || 1)
            const dist = dx * dx + dy * dy
            const normThickness = thickness / Math.max(rx, ry)
            draw = Math.abs(dist - 1) <= normThickness
          }
        }
        if (!draw) continue
        
        const vx = x - offsetX.value
        const vy = y - offsetY.value
        if (vx < 0 || vy < 0 || vx >= visibleSize.value || vy >= visibleSize.value) continue
        ctx.fillRect(vx * pixelSize, vy * pixelSize, pixelSize, pixelSize)
      }
    }
  }
}

// MOUSE
// MOUSE - Fixed to account for CSS scaling
function getMousePos(e: MouseEvent | TouchEvent) {
  if (!canvas.value) return null
  
  const rect = canvas.value.getBoundingClientRect()
  const canvasActualSize = CANVAS_SIZE // 600px actual canvas resolution
  const canvasDisplayWidth = rect.width // CSS display width
  
  // Calculate the scale factor between actual canvas resolution and displayed size
  const scale = canvasActualSize / canvasDisplayWidth
  
  let clientX, clientY
  
  if (e instanceof TouchEvent) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  // Calculate position relative to canvas, then scale to actual canvas coordinates
  let canvasX = (clientX - rect.left) * scale
  let canvasY = (clientY - rect.top) * scale
  
  // Convert to grid coordinates
  const pixelSize = CANVAS_SIZE / visibleSize.value
  let x = Math.floor(canvasX / pixelSize)
  let y = Math.floor(canvasY / pixelSize)
  
  // Clamp to visible area
  x = Math.max(0, Math.min(visibleSize.value - 1, x))
  y = Math.max(0, Math.min(visibleSize.value - 1, y))
  
  return { x, y }
}

function startDrawing(e: MouseEvent) {
  drawing.value = true
  const pos = getMousePos(e)
  if (!pos) return

  const gx = pos.x + offsetX.value
  const gy = pos.y + offsetY.value
  
  saveState()

  if (tool.value === 'magic-wand') {
    magicWandSelect(gx, gy)
    drawing.value = false
    redraw()
    return
  }
  else if (tool.value === 'text') {
    tempTextRect.value = {
      start: { x: gx, y: gy },
      end: { x: gx, y: gy }
    }
    selectionStart.value = { x: gx, y: gy }
    selectionEnd.value = { x: gx, y: gy }
  }
  else if (tool.value === 'select') {
    selectionStart.value = { x: gx, y: gy }
    selectionEnd.value = { x: gx, y: gy }
  }
  else if (tool.value === 'fill') {
    if (useGradient.value) {
      gradientFloodFill(gx, gy)
    } else {
      floodFill(gx, gy)
    }
    updatePreview()
  }
  else if (tool.value === 'line') {
    selectionStart.value = { x: gx, y: gy }
    selectionEnd.value = { x: gx, y: gy }
  }
  else if (tool.value === 'spray') {
    applySprayPixelImmediately(gx, gy)
    redraw()
    updatePreview()
  }
  else if (getShape() === 'pencil') {
    drawPixel(gx, gy)
  }
  else {
    originalSelectionStart.value = { x: gx, y: gy }
    selectionStart.value = { x: gx, y: gy }
    selectionEnd.value = { x: gx, y: gy }
  }

  redraw()
}

function stopDrawing() {
  if (tool.value === 'text') {
    if (tempTextRect.value) {
      const x1 = tempTextRect.value.start.x
      const y1 = tempTextRect.value.start.y
      const x2 = tempTextRect.value.end.x
      const y2 = tempTextRect.value.end.y
      
      textPosition.value = { x1, y1, x2, y2 }
      showTextDialog.value = true
      
      selectionStart.value = null
      selectionEnd.value = null
      tempTextRect.value = null
    }
    
    drawing.value = false
    redraw()
    return
  }
  else if (tool.value === 'select') {
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
          activePixels.push({ x, y, color })
          backgroundPixels.push({ x, y, color: '#ffffff' })
        }
      }

      redraw()
    }

    selectionStart.value = null
    selectionEnd.value = null
    drawing.value = false
    return
  }
  else if (tool.value === 'fill') {
    drawing.value = false
    updatePreview()
    redraw()
    return
  }
  else if (tool.value === 'line') {
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
      activePixels = pixels
    }

    selectionStart.value = null
    selectionEnd.value = null
    drawing.value = false
    redraw()
    updatePreview()
    return
  }
  else if (tool.value === 'spray') {
    sprayPreviewPixels = []
    
    // Store the final stroke for undo/redo
    if (strokePixels.length > 0) {
      backgroundPixels = strokePixels.map(p => ({
        x: p.x,
        y: p.y,
        color: '#ffffff'  // Background is whatever was there before (we don't track it individually)
      }))
      activePixels = [...strokePixels]
    }
    
    strokePixels = []
    drawing.value = false
    redraw()
    updatePreview()
    return
  }
  else if (getShape() !== 'pencil') {
    applyShape()
    selectionStart.value = null
    selectionEnd.value = null
  }
  else if (getShape() === 'pencil') {
    if (strokePixels.length > 0) {
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
    updatePreview()
    return
  }

  sprayPreviewPixels = []
  drawing.value = false
  updatePreview()
  redraw()
}

function draw(e: MouseEvent) {
  if (!drawing.value) return

  const pos = getMousePos(e)
  if (!pos) return

  const gx = pos.x + offsetX.value
  const gy = pos.y + offsetY.value

  if (tool.value === 'text') {
    if (tempTextRect.value) {
      tempTextRect.value.end = { x: gx, y: gy }
      selectionEnd.value = { x: gx, y: gy }
    }
  }
  else if (tool.value === 'select') {
    selectionEnd.value = { x: gx, y: gy }
  }
  else if (tool.value === 'line') {
    selectionEnd.value = { x: gx, y: gy }
  }
  else if (tool.value === 'spray') {
    applySprayPixelImmediately(gx, gy)  // Draw immediately during drag
    updateSprayPreview(gx, gy)          // Update preview at current position
    redraw() 
  }
  else if (getShape() === 'pencil') {
    drawPixel(gx, gy)
  }
  else {
    selectionEnd.value = { x: gx, y: gy }
  }

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
  updatePreview()
}

function moveLeft() { offsetX.value--; clampOffset(); redraw(); updatePreview() }
function moveRight() { offsetX.value++; clampOffset(); redraw(); updatePreview() }
function moveUp() { offsetY.value--; clampOffset(); redraw(); updatePreview() }
function moveDown() { offsetY.value++; clampOffset(); redraw(); updatePreview() }

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
  
  if (previewCanvas.value) {
    previewCtx = previewCanvas.value.getContext('2d')
  }

  const id = route.params.id as string | undefined

  if (id) {
    pictureId.value = id
    const pic = await getPictureById(id)
    grid.value = pic.pixels
    gridSize.value = pic.size
    visibleSize.value = pic.size
  } else {
    createGrid(gridSize.value)
  }

  redraw()
  updatePreview()
  canvas.value?.focus()
})

// Watch for minimap visibility changes
watch(minimapVisible, (newVisible) => {
  if (newVisible) {
    // When minimap becomes visible, force a preview update
    nextTick(() => {
      updatePreview()
    })
  }
})

watch(gridSize, () => {
  resizeGrid(gridSize.value)
  if (visibleSize.value > gridSize.value) visibleSize.value = gridSize.value
  redraw()
  updatePreview()
})

watch(visibleSize, () => {
  clampOffset()
  redraw()
  updatePreview()
})

watch(grid, () => {
  updatePreview()
}, { deep: true })
</script>

<style scoped>
/* Mobile First Base Styles */
* {
  box-sizing: border-box;
}


html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e1e;
  color: #eee;
  font-family: sans-serif;
  position: relative;
  overflow: hidden;
}

/* SIDEBARS - Hidden by default on mobile, accessible via buttons */
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 85%;
  max-width: 280px;
  background: #2a2a2a;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  z-index: 1000;
  transition: transform 0.3s ease;
  box-shadow: 2px 0 8px rgba(0,0,0,0.3);
}

.sidebar.left {
  left: 0;
  transform: translateX(-100%);
  border-right: 1px solid #444;
}

.sidebar.left.open {
  transform: translateX(0);
}

.sidebar.right {
  right: 0;
  transform: translateX(100%);
  border-left: 1px solid #444;
}

.sidebar.right.open {
  transform: translateX(0);
}

/* Sidebar toggle buttons for mobile */
/* Sidebar toggle buttons for mobile - Positioned below toolbar */
.menu-toggle {
  position: fixed;
  top: 140px; /* Below navbar (adjust based on your navbar height) */
  left: 10px;
  z-index: 102;
  background: #0084ff;
  padding: 8px 12px;
  font-size: 20px;
  border-radius: 8px;
}

.right-menu-toggle {
  position: fixed;
  top: 140px; /* Below navbar (adjust based on your navbar height) */
  left: 70px;
  z-index: 102;
  background: #0084ff;
  padding: 8px 12px;
  font-size: 20px;
  border-radius: 8px;
}

/* Overlay when sidebar is open */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
}

.sidebar h3 {
  margin-top: 10px;
  margin-bottom: 5px;
  font-size: 14px;
  color: #bbb;
}

/* CENTER - Takes full width on mobile */
/* CENTER - Takes full width on mobile */
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  flex: 1;
  width: 100%;
  overflow: hidden;
  padding-top: 60px; /* Space for mobile menu buttons */
}

/* Add this new class for navbar offset */
.navbar-offset {
  padding-top: 70px; /* Space for fixed navbar on mobile */
}

/* TOOLBAR - Horizontal scrollable on mobile */
/* TOOLBAR - Horizontal scrollable on mobile */
.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #333;
  border-bottom: 1px solid #444;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  position: fixed;
  top: 60px; /* Push below navbar (adjust based on your navbar height) */
  left: 0;
  right: 0;
  z-index: 50;
}

.toolbar::-webkit-scrollbar {
  height: 3px;
}

.tool-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* CANVAS WRAPPER - Responsive */
.canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  overflow: auto;
  margin-top: 10px; /* Offset for navbar + toolbar */
}

.middle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

/* BUTTONS - Larger touch targets */
button {
  background: #444;
  color: white;
  border: none;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 16px;
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
}

button:active {
  transform: scale(0.96);
}

button.active {
  background: #0084ff;
}

/* TOOL BUTTONS */
.tool-btn {
  width: 48px;
  height: 48px;
  font-size: 20px;
}

/* ARROWS - Navigation buttons */
.arrow {
  margin: 5px;
  font-size: 24px;
  padding: 12px;
  min-width: 50px;
}

/* INPUTS - Mobile friendly */
input[type="number"] {
  width: 70px;
  padding: 8px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #555;
  background: #444;
  color: white;
}

input[type="color"] {
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

/* BRUSH CONTROLS */
.brush {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #3a3a3a;
  padding: 5px 10px;
  border-radius: 8px;
}

.brush span {
  min-width: 30px;
  text-align: center;
  font-size: 16px;
}

/* SPRAY & TOLERANCE CONTROLS */
.spray-control, .tolerance-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #3a3a3a;
  padding: 5px 10px;
  border-radius: 8px;
}

.spray-control input, .tolerance-control input {
  width: 100px;
}

/* PREVIEW WINDOW - Mobile optimized */
.preview-window {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 8px;
  z-index: 200;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  max-width: calc(100% - 20px);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
  color: #ccc;
}

.close-preview {
  background: #444;
  padding: 4px 8px;
  font-size: 12px;
  min-width: auto;
  min-height: auto;
}

.preview-canvas {
  width: 120px;
  height: 120px;
  cursor: pointer;
  border: 1px solid #555;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}

.preview-controls {
  margin-top: 6px;
  text-align: center;
}

.toggle-preview {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: #0084ff;
  padding: 12px;
  font-size: 20px;
  z-index: 201;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* CANVAS - Responsive sizing */
/* CANVAS - Fixed sizing to prevent offset */
canvas {
  width: 600px;
  height: 600px;
  max-width: 100%;
  height: auto;
  cursor: crosshair;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: block;
  margin: 0 auto;
}

/* Fix for mobile canvas scaling */
@media (max-width: 768px) {
  canvas {
    width: 100%;
    height: auto;
    max-width: 500px;
    touch-action: none;
  }
}
/* Modal - Mobile friendly */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  color: #eee;
}

.modal h3 {
  margin-top: 0;
  font-size: 18px;
}

.modal textarea {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: #444;
  color: white;
  border: 1px solid #666;
  border-radius: 8px;
  font-family: monospace;
  resize: vertical;
  font-size: 14px;
}

.modal-controls {
  margin: 15px 0;
}

.modal-controls label {
  display: block;
  margin: 12px 0;
  font-size: 14px;
}

.modal-controls input,
.modal-controls select {
  margin-left: 10px;
  padding: 8px;
  background: #444;
  color: white;
  border: 1px solid #666;
  border-radius: 6px;
  font-size: 14px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.modal-buttons button {
  padding: 10px 20px;
  font-size: 14px;
}

small {
  display: block;
  font-size: 11px;
  color: #aaa;
  margin-top: 4px;
}

/* Simple text indicators */
.tool-btn.square.fill::before,
.tool-btn.square.edge::before,
.tool-btn.square.off::before,
.tool-btn.circle.fill::before,
.tool-btn.circle.edge::before,
.tool-btn.circle.off::before {
  font-size: 22px;
}

/* Active state */
.tool-btn.square.active,
.tool-btn.circle.active {
  outline: 2px solid white;
  outline-offset: 2px;
  transform: scale(1.05);
}

/* Utility classes */
.hidden-mobile {
  display: none;
}

/* Tablet and Desktop styles */
@media (min-width: 768px) {
  .app-container {
    display: grid;
    grid-template-columns: 220px 1fr 220px;
    flex-direction: row;
  }
  
  .menu-toggle,
  .right-menu-toggle {
    display: none;
  }
  
  .sidebar {
    position: relative;
    transform: translateX(0) !important;
    width: auto;
    max-width: none;
    z-index: auto;
    box-shadow: none;
  }
  
  .sidebar.left {
    transform: translateX(0);
  }
  
  .sidebar.right {
    transform: translateX(0);
  }
  
  .sidebar-overlay {
    display: none;
  }
  
  .center {
    padding-top: 0;
  }
  
  .toolbar {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    overflow-x: visible;
    flex-wrap: wrap;
    white-space: normal;
  }
  
  .tool-group {
    display: flex;
    flex-wrap: wrap;
  }
  
  button {
    padding: 6px 10px;
    min-width: auto;
    min-height: auto;
  }
  
  .tool-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .arrow {
    font-size: 18px;
    padding: 6px 10px;
  }
  
  .preview-window {
    bottom: 20px;
    right: 240px;
  }
  
  .preview-canvas {
    width: 150px;
    height: 150px;
  }
  
  .toggle-preview {
    bottom: 20px;
    right: 20px;
  }
  
  input[type="color"] {
    width: 32px;
    height: 32px;
  }
}

/* Small mobile devices */
@media (max-width: 480px) {
  .tool-group {
    gap: 4px;
  }
  
  button {
    padding: 8px 10px;
    font-size: 14px;
  }
  
  .tool-btn {
    width: 42px;
    height: 42px;
    font-size: 18px;
  }
  
  .brush span {
    min-width: 25px;
  }
  
  .spray-control input, 
  .tolerance-control input {
    width: 70px;
  }
  
  .preview-canvas {
    width: 100px;
    height: 100px;
  }
  
  .modal {
    padding: 16px;
  }
}



/* Mobile - Move arrows under the grid */
@media (max-width: 768px) {
  .canvas-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  /* Reorder the arrows to be under the grid */
  .canvas-wrapper .arrow:first-child {
    order: 3; /* Up arrow goes to bottom */
  }
  
  .middle {
    display: flex;
    flex-direction: column;
    align-items: center;
    order: 2;
  }
  
  /* Move the bottom arrow to the bottom */
  .canvas-wrapper .arrow:last-child {
    order: 4;
    margin-top: 10px;
  }
  
  /* Ensure canvas stays in middle */
  .middle canvas {
    order: 1;
  }
  
  /* Style the arrow buttons on mobile */
  .arrow {
    margin: 5px auto;
    width: 60px;
  }
  
  /* Horizontal arrows inside middle */
  .middle .arrow {
    display: inline-block;
    margin: 0 10px;
  }
  
  /* Make arrow layout vertical on mobile */
  .middle {
    flex-direction: column;
  }
  
  .middle .arrow:first-child {
    margin-bottom: 10px;
  }
  
  .middle .arrow:last-child {
    margin-top: 10px;
  }
}


/* Touch-specific styles */
@media (max-width: 768px) {
  canvas {
    touch-action: none; /* Prevent scrolling when drawing */
  }
  
  .mode-toggle {
    position: fixed;
    bottom: 80px;
    right: 10px;
    background: #0084ff;
    padding: 12px;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    z-index: 200;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  .mode-toggle.active {
    background: #ff9800;
  }
  
  .mode-toggle.pan {
    background: #ff9800;
  }
  
  .mode-toggle.draw {
    background: #0084ff;
  }
}





/* Add to your existing CSS */
@media (max-width: 768px) {
  .arrow {
    min-width: 60px;
    min-height: 60px;
    font-size: 28px;
    touch-action: manipulation;
  }
  
  .tool-btn {
    min-width: 50px;
    min-height: 50px;
  }
  
  button {
    touch-action: manipulation;
  }
  
  .mode-toggle {
    position: fixed;
    bottom: 80px;
    right: 10px;
    background: #0084ff;
    padding: 12px;
    border-radius: 50%;
    width: 55px;
    height: 55px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    z-index: 200;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    cursor: pointer;
  }
  
  .mode-toggle.active {
    background: #ff9800;
  }
}



</style>