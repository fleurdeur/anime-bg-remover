import { useCallback, useEffect, useRef, useState } from 'react'
import { removeBackground } from '@imgly/background-removal'

type Mode = 'keep' | 'erase'
type ImageState = { url: string; name: string }

const demo = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#dcecff"/><stop offset="1" stop-color="#b9d3ff"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><circle cx="180" cy="650" r="145" fill="#f6dce5"/><circle cx="1000" cy="650" r="120" fill="#d9e8ff"/><g transform="translate(280 120)"><rect x="200" y="280" width="440" height="300" rx="120" fill="#ffcf8a"/><circle cx="420" cy="180" r="130" fill="#f8d2a1"/><path d="M320 130c34-90 170-90 205 0l-22 48c-28-18-120-20-162 0z" fill="#292840"/><circle cx="368" cy="172" r="12"/><circle cx="475" cy="172" r="12"/><path d="M390 215c34 34 85 34 118 0" fill="none" stroke="#7e4d32" stroke-width="12" stroke-linecap="round"/><path d="M315 338c40 44 97 76 150 76s110-32 151-76v150H315z" fill="#2e5fa2"/><path d="M260 420c85-35 165-35 250 0l-16 113H275z" fill="#1d2d53"/><path d="M338 475l-160 182h150l120-154" fill="#3f74d7"/><path d="M544 475l166 182h-150l-118-154" fill="#3f74d7"/></g></svg>`)

function loadImage(url: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url }) }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sourceRef = useRef<HTMLImageElement | null>(null)
  const maskRef = useRef<Uint8ClampedArray | null>(null)
  const [image, setImage] = useState<ImageState>({ url: demo, name: 'demo-anime.svg' })
  const [mode, setMode] = useState<Mode>('keep')
  const [brush, setBrush] = useState(48)
  const [busy, setBusy] = useState(false)
  const [painting, setPainting] = useState(false)
  const [status, setStatus] = useState('Ready — detect the subject automatically or paint a selection.')

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const source = sourceRef.current
    const mask = maskRef.current
    if (!canvas || !source || !mask) return
    const max = 1100
    const scale = Math.min(1, max / source.naturalWidth)
    canvas.width = Math.round(source.naturalWidth * scale)
    canvas.height = Math.round(source.naturalHeight * scale)
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    const overlay = ctx.createImageData(canvas.width, canvas.height)
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const sx = Math.min(source.naturalWidth - 1, Math.floor(x / scale))
      const sy = Math.min(source.naturalHeight - 1, Math.floor(y / scale))
      if (mask[sy * source.naturalWidth + sx]) { const i = (y * canvas.width + x) * 4; overlay.data[i]=255; overlay.data[i+1]=76; overlay.data[i+2]=103; overlay.data[i+3]=125 }
    }
    ctx.putImageData(overlay, 0, 0)
  }, [])

  const detect = useCallback(async (next = image) => {
    setBusy(true); setStatus('AI is detecting anime, people, and objects…')
    try {
      const source = await loadImage(next.url)
      sourceRef.current = source
      const response = await removeBackground(next.url, { output: { format: 'image/png' } })
      const cutout = await loadImage(URL.createObjectURL(response))
      const work = document.createElement('canvas'); work.width = source.naturalWidth; work.height = source.naturalHeight
      const ctx = work.getContext('2d')!; ctx.drawImage(cutout, 0, 0, work.width, work.height)
      const alpha = ctx.getImageData(0, 0, work.width, work.height).data
      const mask = new Uint8ClampedArray(work.width * work.height)
      for (let i=0; i<mask.length; i++) mask[i] = alpha[i*4+3] > 20 ? 1 : 0
      maskRef.current = mask; render(); setStatus('Subject selected in red. Paint to refine, then export a transparent PNG.')
    } catch (error) {
      console.error(error); setStatus('AI model could not load. You can still paint the subject manually.')
      const source = await loadImage(next.url); sourceRef.current = source; maskRef.current = new Uint8ClampedArray(source.naturalWidth * source.naturalHeight); render()
    } finally { setBusy(false) }
  }, [image, render])

  useEffect(() => { void detect() }, [image.url]) // eslint-disable-line react-hooks/exhaustive-deps

  const paint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current, source = sourceRef.current, mask = maskRef.current
    if (!canvas || !source || !mask) return
    const rect = canvas.getBoundingClientRect(); const x = (event.clientX-rect.left)/rect.width*canvas.width; const y=(event.clientY-rect.top)/rect.height*canvas.height
    const scale = canvas.width/source.naturalWidth; const radius=brush/2; const sx=x/scale, sy=y/scale
    for (let py=Math.max(0,Math.floor(sy-radius)); py<Math.min(source.naturalHeight,Math.ceil(sy+radius)); py++) for (let px=Math.max(0,Math.floor(sx-radius)); px<Math.min(source.naturalWidth,Math.ceil(sx+radius)); px++) if ((px-sx)**2+(py-sy)**2<=radius**2) mask[py*source.naturalWidth+px]=mode==='keep'?1:0
    render()
  }

  const upload = (event: React.ChangeEvent<HTMLInputElement>) => { const file=event.target.files?.[0]; if (!file) return; const url=URL.createObjectURL(file); setImage({url,name:file.name}) }
  const exportPng = async () => { const source=sourceRef.current, mask=maskRef.current; if (!source||!mask) return; const out=document.createElement('canvas'); out.width=source.naturalWidth; out.height=source.naturalHeight; const ctx=out.getContext('2d')!; ctx.drawImage(source,0,0); const pixels=ctx.getImageData(0,0,out.width,out.height); for(let i=0;i<mask.length;i++) pixels.data[i*4+3]=mask[i]?pixels.data[i*4+3]:0; ctx.putImageData(pixels,0,0); const link=document.createElement('a'); link.download='background-removed.png'; link.href=out.toDataURL('image/png'); link.click(); setStatus('Transparent PNG exported.') }

  return <div className="app"><header><div><span className="kicker">AI image editor</span><h1>Anime BG Remover</h1><p>Keep the character. Lose the background.</p></div><div className="header-actions"><label className="button primary">Upload image<input type="file" accept="image/*" onChange={upload}/></label><button className="button" onClick={()=>setImage({url:demo,name:'demo-anime.svg'})}>Use demo</button></div></header><main><aside><section className="card"><h2>Selection mode</h2><div className="modes"><button className={mode==='keep'?'active':''} onClick={()=>setMode('keep')}>Keep subject</button><button className={mode==='erase'?'active':''} onClick={()=>setMode('erase')}>Erase background</button></div><small>{mode==='keep'?'Red paint marks what stays.':'Red paint is removed from the selection.'}</small></section><section className="card"><div className="row"><h2>Brush size</h2><b>{brush}px</b></div><input type="range" min="12" max="160" value={brush} onChange={e=>setBrush(Number(e.target.value))}/></section><section className="card"><h2>Actions</h2><button className="button primary full" onClick={()=>void detect()} disabled={busy}>{busy?'Detecting…':'↻ Auto detect'}</button><button className="button full" onClick={exportPng} disabled={busy}>↓ Export transparent PNG</button></section><p className="privacy">Images are processed in your browser with an ML segmentation model. Nothing is uploaded by this UI.</p></aside><section className="workspace"><div className="workspace-bar"><span className="chip"><i/> Subject overlay</span><span>{busy?'Processing…':status}</span></div><div className="canvas-wrap"><canvas ref={canvasRef} onPointerDown={e=>{setPainting(true); paint(e)}} onPointerMove={e=>painting&&paint(e)} onPointerUp={()=>setPainting(false)} onPointerLeave={()=>setPainting(false)}/></div><div className="hint">Tip: choose <strong>Keep subject</strong> and paint over any missed hair, clothing, or accessories.</div></section></main></div>
}
