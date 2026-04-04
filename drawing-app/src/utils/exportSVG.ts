export function exportToSVG(
  grid: string[][],
  filename: string = 'drawing.svg'
) {
  const size = grid.length

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = grid[y][x]

      // skip white background (optional)
      if (color === '#ffffff') continue

      svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />`
    }
  }

  svg += `</svg>`

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}