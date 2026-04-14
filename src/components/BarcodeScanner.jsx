import { useState, useRef, useEffect } from 'react'

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null)
  const [mode, setMode] = useState('init') // init | scanning | manual | loading | found | error
  const [manualCode, setManualCode] = useState('')
  const [product, setProduct] = useState(null)
  const [servingGrams, setServingGrams] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window

  useEffect(() => {
    if (hasDetector) startCamera()
    else setMode('manual')
    return stopCamera
  }, [])

  function stopCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setMode('scanning')

      const detector = new BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39'] })
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) {
            stopCamera()
            fetchProduct(codes[0].rawValue)
          }
        } catch {}
      }, 600)
    } catch {
      setMode('manual')
    }
  }

  async function fetchProduct(barcode) {
    setMode('loading')
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        const n = p.nutriments || {}
        setProduct({
          barcode,
          name: p.product_name || p.abbreviated_product_name || 'Unknown Product',
          per100g: {
            calories: Math.round(n['energy-kcal_100g'] || n['energy_100g'] / 4.184 || 0),
            protein:  Math.round((n['proteins_100g'] || 0) * 10) / 10,
            carbs:    Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
            fat:      Math.round((n['fat_100g'] || 0) * 10) / 10,
          },
          servingSize: p.serving_size || null,
        })
        setServingGrams(p.serving_quantity ? String(Math.round(p.serving_quantity)) : '100')
        setMode('found')
      } else {
        setErrorMsg(`Barcode ${barcode} not found in database.`)
        setMode('error')
      }
    } catch {
      setErrorMsg('Could not reach Open Food Facts. Check connection.')
      setMode('error')
    }
  }

  function confirmProduct() {
    if (!product) return
    const grams = parseFloat(servingGrams) || 100
    const ratio = grams / 100
    onResult({
      name: `${product.name} (${grams}g)`,
      calories: Math.round(product.per100g.calories * ratio),
      protein:  Math.round(product.per100g.protein  * ratio * 10) / 10,
      carbs:    Math.round(product.per100g.carbs    * ratio * 10) / 10,
      fat:      Math.round(product.per100g.fat      * ratio * 10) / 10,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl overflow-hidden" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-white font-black text-base">Barcode Scanner</p>
          <button onClick={() => { stopCamera(); onClose() }} className="text-white/40 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 64px)' }}>

          {/* Camera stream */}
          {mode === 'scanning' && (
            <div className="relative bg-black">
              <video ref={videoRef} className="w-full" playsInline muted style={{ maxHeight: 280, objectFit: 'cover' }} />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-36 border-2 border-accent rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent rounded-br" />
                  {/* Scan line animation */}
                  <div className="absolute left-1 right-1 h-0.5 bg-accent/70" style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white/70 text-sm">Point at barcode</p>
              </div>
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Loading */}
            {mode === 'loading' && (
              <div className="py-12 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent dot-1" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent dot-2" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent dot-3" />
                </div>
                <p className="text-white/50 text-sm">Looking up product…</p>
              </div>
            )}

            {/* Init / no detector */}
            {mode === 'init' && (
              <div className="py-8 text-center">
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/30 dot-1" />
                  <div className="w-2 h-2 rounded-full bg-white/30 dot-2" />
                  <div className="w-2 h-2 rounded-full bg-white/30 dot-3" />
                </div>
              </div>
            )}

            {/* Product found */}
            {mode === 'found' && product && (
              <div className="space-y-4">
                <div className="p-4 bg-[#1a1a1a] rounded-2xl">
                  <p className="text-white font-black text-base truncate">{product.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">Per 100g: {product.per100g.calories} kcal · P:{product.per100g.protein}g · C:{product.per100g.carbs}g · F:{product.per100g.fat}g</p>
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Serving Size (grams)</label>
                  <input
                    className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-base font-bold focus:outline-none focus:border-accent"
                    type="number" inputMode="decimal"
                    value={servingGrams}
                    onChange={e => setServingGrams(e.target.value)}
                  />
                  {product.servingSize && (
                    <p className="text-white/30 text-xs mt-1">Product serving: {product.servingSize}</p>
                  )}
                </div>
                {/* Preview macros */}
                {servingGrams && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { l: 'Cal', v: Math.round(product.per100g.calories * parseFloat(servingGrams) / 100) },
                      { l: 'Protein', v: `${Math.round(product.per100g.protein * parseFloat(servingGrams) / 100 * 10)/10}g` },
                      { l: 'Carbs',   v: `${Math.round(product.per100g.carbs   * parseFloat(servingGrams) / 100 * 10)/10}g` },
                      { l: 'Fat',     v: `${Math.round(product.per100g.fat     * parseFloat(servingGrams) / 100 * 10)/10}g` },
                    ].map(m => (
                      <div key={m.l} className="bg-[#1a1a1a] rounded-xl p-2">
                        <p className="text-white font-black text-sm">{m.v}</p>
                        <p className="text-white/40 text-[10px]">{m.l}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={confirmProduct}
                  className="w-full py-4 bg-accent rounded-2xl font-black text-white text-base active:scale-[0.98]">
                  Log This Food
                </button>
              </div>
            )}

            {/* Error */}
            {mode === 'error' && (
              <div className="py-6 text-center space-y-3">
                <p className="text-red-400 font-bold">{errorMsg}</p>
                <button onClick={() => setMode('manual')}
                  className="px-5 py-2 border border-border rounded-xl text-white/60 text-sm">
                  Enter Barcode Manually
                </button>
              </div>
            )}

            {/* Manual input — always available as fallback */}
            {(mode === 'scanning' || mode === 'manual' || mode === 'error') && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
                  {mode === 'scanning' ? 'Or enter barcode manually' : 'Enter barcode number'}
                </p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent"
                    placeholder="e.g. 0123456789012"
                    type="number" inputMode="numeric"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                  />
                  <button
                    onClick={() => { stopCamera(); fetchProduct(manualCode) }}
                    disabled={manualCode.length < 8}
                    className="px-4 py-3 bg-accent rounded-xl font-black text-white text-sm disabled:opacity-40 active:scale-95"
                  >
                    Look Up
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 4px; }
          50% { top: calc(100% - 4px); }
        }
      `}</style>
    </div>
  )
}
