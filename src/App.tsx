import { useEffect, useMemo, useRef, useState } from 'react'

type ToolMode = 'keep' | 'erase'
type LoadedImage = {
  src: string
  width: number
  height: number
  name: string
}

const buildDemoImage = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#dfeeff"/>
          <stop offset="100%" stop-color="#bcd8ff"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <circle cx="870" cy="290" r="90" fill="#fef4d4" opacity="0.45"/>
      <circle cx="380" cy="350" r="150" fill="#dff5d6" opacity="0.55"/>
      <g transform="translate(280 120)">
        <rect x="200" y="280" width="440" height="300" rx="120" fill="#ffcf8a"/>
        <circle cx="420" cy="180" r="130" fill="#f8d2a1"/>
        <path d="M320 130c34-90 170-90 205 0l-22 48c-28-18-120-20-162 0l-21-48Z" fill="#2a2940"/>
        <circle cx="368" cy="172" r="12" fill="#1d1d22"/>
        <circle cx="475" cy="172" r="12" fill="#1d1d22"/>
        <path d="M390 215c34 34 85 34 118 0" fill="none" stroke="#7e4d32" stroke-width="12" stroke-linecap="round"/>
        <path d="M315 338c40 44 97 76 150 76s110-32 151-76v150H315V338Z" fill="#2e5fa2"/>
        <path d="M260 420c85-35 165-35 250 0l-16 113H275l-15-113Z" fill="#1d2d53"/>
        <path d="M338 475l-160 182h150l120-154" fill="#3f74d7"/>
        <path d="M544 475l166 182h-150l-118-154" fill="#3f74d7"/>
      </g>
      <g opacity="0.9">
        <circle cx="160" cy="620" r="120" fill="#f3dbe5"/>
        <circle cx="1000" cy="660" r="90" fill="#d7e6ff"/>
      </g>
    </svg>
  `

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const makeMask = (width: number, height: number) => new Uint8ClampedArray(width * height)

const createImageAsset = (src: string, name: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [image, setImage] = useState<LoadedImage>({
    src: buildDemoImage(),
    width: 1200,
    height: 900,
    name: 'sample-image.png',
  })
  const [tool, setTool] = useState<ToolMode>('keep')
  const [brushSize, setBrushSize] = useState(32)
  const [mask, setMask] = useState<Uint8ClampedArray>(makeMask(1200, 900))
  const [isPointerDown, setIsPointerDown] = useState(false)
  const [status, setStatus] = useState('Upload or use the sample image to remove the background.')
  const [isExporting, setIsExporting] = useState(false)

  const maskRef = useRef<Uint8ClampedArray>(makeMask(1200, 900))

  useEffect(() => {
    const renderImage = async () => {
      const img = await createImageAsset(image.src, image.name)
      const width = img.naturalWidth || image.width
      const height = img.naturalHeight || image.height
      const nextMask = makeMask(width, height)
      maskRef.current = nextMask
      setMask(nextMask)
      drawCanvas(img, nextMask)
      autoSelectSubject(img, nextMask)
    }

    renderImage().catch((error) => {
      console.error(error)
      setStatus('Could not load the image. Please try another one.')
    })
  }, [image.src])

  const drawCanvas = (img: HTMLImageElement, nextMask: Uint8ClampedArray) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const maxWidth = 980
    const scale = Math.min(1, maxWidth / img.naturalWidth)
    const width = Math.max(320, Math.round(img.naturalWidth * scale))
    const height = Math.max(240, Math.round(img.naturalHeight * scale))

    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const overlayCanvas = document.createElement('canvas')
    overlayCanvas.width = width
    overlayCanvas.height = height
    const overlayCtx = overlayCanvas.getContext('2d')
    if (!overlayCtx) return

    const overlay = overlayCtx.createImageData(width, height)
    const data = overlay.data

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const xInSource = Math.min(Math.round((x / width) * img.naturalWidth), img.naturalWidth - 1)
        const yInSource = Math.min(Math.round((y / height) * img.naturalHeight), img.naturalHeight - 1)
        const sourceIndex = yInSource * img.naturalWidth + xInSource
        const maskValue = nextMask[sourceIndex] ?? 0

        if (maskValue === 1) {
          const index = (y * width + x) * 4
          data[index] = 255
          data[index + 1] = 92
          data[index + 2] = 110
          data[index + 3] = 160
        }
      }
    }

    overlayCtx.putImageData(overlay, 0, 0)
    ctx.drawImage(overlayCanvas, 0, 0)
  }

  const autoSelectSubject = (img: HTMLImageElement, nextMask: Uint8ClampedArray) => {
    const width = img.naturalWidth
    const height = img.naturalHeight
    const sampleX = Math.round(width * 0.5)
    const sampleY = Math.round(height * 0.5)
    const sampleSize = Math.min(width, height) * 0.16

    const sampleR = clamp(sampleX - sampleSize, 0, width - 1)
    const sampleL = clamp(sampleX + sampleSize, 0, width - 1)
    const sampleT = clamp(sampleY - sampleSize, 0, height - 1)
    const sampleB = clamp(sampleY + sampleSize, 0, height - 1)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, width, height).data

    let r = 0
    let g = 0
    let b = 0
    let count = 0

    for (let y = sampleT; y <= sampleB; y += 1) {
      for (let x = sampleR; x <= sampleL; x += 1) {
        const idx = (y * width + x) * 4
        r += data[idx]
        g += data[idx + 1]
        b += data[idx + 2]
        count += 1
      }
    }

    const targetR = r / count
    const targetG = g / count
    const targetB = b / count

    const centerX = width * 0.5
    const centerY = height * 0.5
    const radius = Math.min(width, height) * 0.42

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = x - centerX
        const dy = y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const idx = y * width + x

        const colorIndex = idx * 4
        const rr = data[colorIndex]
        const gg = data[colorIndex + 1]
        const bb = data[colorIndex + 2]

        const colorDistance = Math.abs(rr - targetR) + Math.abs(gg - targetG) + Math.abs(bb - targetB)
        const isMainSubject = distance < radius && colorDistance < 220

        if (isMainSubject) {
          nextMask[idx] = 1
        }
      }
    }

    setMask(nextMask)
    if (canvasRef.current) {
      const current = canvasRef.current.getContext('2d')
      if (current) {
        current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }

    drawCanvas(img, nextMask)
    setStatus('AI subject detection is ready. Paint to refine or keep the suggested selection.')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPointerDown) return
      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height
      paintAt(x, y)
    }

    const handlePointerUp = () => setIsPointerDown(false)

    canvas.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isPointerDown, tool, brushSize])

  const paintAt = (x: number, y: number) => {
    if (!canvasRef.current) return

    const activeCanvas = canvasRef.current
    const width = activeCanvas.width
    const height = activeCanvas.height
    const radius = brushSize / 2

    const img = new Image()
    img.src = image.src

    const nextMask = maskRef.current

    for (let py = Math.max(0, Math.floor(y - radius)); py <= Math.min(height - 1, Math.ceil(y + radius)); py += 1) {
      for (let px = Math.max(0, Math.floor(x - radius)); px <= Math.min(width - 1, Math.ceil(x + radius)); px += 1) {
        const dx = px - x
        const dy = py - y
        if (dx * dx + dy * dy <= radius * radius) {
          const sourceX = Math.min(Math.max(Math.round((px / width) * img.naturalWidth), 0), img.naturalWidth - 1)
          const sourceY = Math.min(Math.max(Math.round((py / height) * img.naturalHeight), 0), img.naturalHeight - 1)
          const index = sourceY * img.naturalWidth + sourceX
          nextMask[index] = tool === 'keep' ? 1 : 0
        }
      }
    }

    setMask(new Uint8ClampedArray(nextMask))
    maskRef.current = nextMask
    drawCanvas(img, nextMask)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    setIsPointerDown(true)
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * event.currentTarget.width
    const y = ((event.clientY - rect.top) / rect.height) * event.currentTarget.height
    paintAt(x, y)
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result || '')
      setImage({ src, width: 1200, height: 900, name: file.name })
      setStatus(`Loaded ${file.name}. The app is ready to process it.`)
    }
    reader.readAsDataURL(file)
  }

  const handleReset = () => {
    setImage({ src: buildDemoImage(), width: 1200, height: 900, name: 'sample-image.png' })
    setStatus('Sample image reset. Background removal is ready again.')
  }

  const exportImage = () => {
    const canvas = document.createElement('canvas')
    const img = new Image()
    img.src = image.src

    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const maskValue = maskRef.current[i / 4] ?? 0
        if (maskValue === 0) {
          data[i + 3] = 0
        }
      }

      ctx.putImageData(imageData, 0, 0)
      const link = document.createElement('a')
      link.download = 'bg-removed.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      setStatus('PNG exported with the background removed.')
      setIsExporting(false)
    }

    setIsExporting(true)
  }

  const statusText = useMemo(() => status, [status])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI content editor</p>
          <h1>Anime BG Remover</h1>
        </div>
        <div className="actions">
          <label className="primary-button upload-label">
            Upload
            <input type="file" accept="image/*" onChange={handleUpload} />
          </label>
          <button className="ghost-button" type="button" onClick={handleReset}>
            Reset demo
          </button>
        </div>
      </header>

      <main className="editor-panel">
        <aside className="controls-panel">
          <div className="card">
            <h2>Selection mode</h2>
            <div className="toggle-group">
              <button
                type="button"
                className={tool === 'keep' ? 'segment active' : 'segment'}
                onClick={() => setTool('keep')}
              >
                Keep subject
              </button>
              <button
                type="button"
                className={tool === 'erase' ? 'segment active' : 'segment'}
                onClick={() => setTool('erase')}
              >
                Erase background
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Brush</h2>
            <label htmlFor="brush-range" className="slider-label">
              Size: <span>{brushSize}px</span>
            </label>
            <input
              id="brush-range"
              type="range"
              min="10"
              max="80"
              step="2"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
          </div>

          <div className="card">
            <h2>Quick actions</h2>
            <button className="primary-button wide" type="button" onClick={() => autoSelectSubject(new Image(), maskRef.current)}>
              Auto detect
            </button>
            <button className="ghost-button wide" type="button" onClick={exportImage} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export PNG'}
            </button>
          </div>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <span className="badge">Selected subject shown in red</span>
            <span className="status-text">{statusText}</span>
          </div>
          <div ref={containerRef} className="canvas-frame">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerLeave={() => setIsPointerDown(false)}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
