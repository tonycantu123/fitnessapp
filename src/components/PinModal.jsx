import { useState } from 'react'

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function PinModal({ profileName, onSuccess, onCancel }) {
  const [entered, setEntered] = useState('')
  const [shake, setShake] = useState(false)

  function press(d) {
    if (d === '⌫') {
      setEntered(e => e.slice(0, -1))
      return
    }
    if (d === '') return
    const next = entered + d
    setEntered(next)
    if (next.length === 4) {
      onSuccess(next)
        .then(ok => {
          if (!ok) {
            setShake(true)
            setEntered('')
            setTimeout(() => setShake(false), 500)
          }
        })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10">
        <div className="text-center mb-6">
          <p className="text-white/60 text-sm mb-1">Enter PIN for</p>
          <p className="text-white text-xl font-bold">{profileName}</p>
        </div>

        {/* PIN dots */}
        <div className={`flex justify-center gap-4 mb-8 ${shake ? 'animate-pulse' : ''}`}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                entered.length > i
                  ? 'bg-accent border-accent'
                  : 'bg-transparent border-white/30'
              }`}
            />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {DIGITS.map((d, i) => (
            <button
              key={i}
              onClick={() => press(d)}
              className={`pin-btn h-16 rounded-2xl text-2xl font-bold transition-all ${
                d === ''
                  ? 'opacity-0 pointer-events-none'
                  : d === '⌫'
                  ? 'bg-transparent text-white/60'
                  : 'bg-[#1c1c1c] text-white border border-border active:bg-[#222]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full mt-4 py-3 text-white/40 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
