// exportUtils.ts

export function exportToPNG(
  grid: string[][],
  pixelSize: number = 10,
  filename: string = 'drawing.png'
) {
  const size = grid.length

  const canvas = document.createElement('canvas')
  canvas.width = size * pixelSize
  canvas.height = size * pixelSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // draw grid
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = grid[y][x]
      ctx.fillRect(
        x * pixelSize,
        y * pixelSize,
        pixelSize,
        pixelSize
      )
    }
  }

  // download
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}



export function exportToFavicon(
  grid: string[][],
  filename: string = 'favicon.png'
) {
  const size = grid.length

  // favicon standard sizes: 16, 32, 64
  const targetSize = 64

  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scale = targetSize / size

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = grid[y][x]
      ctx.fillRect(
        Math.floor(x * scale),
        Math.floor(y * scale),
        Math.ceil(scale),
        Math.ceil(scale)
      )
    }
  }

  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}