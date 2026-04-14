import { useState } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useApp } from '../App'
import {
  getMacroLog, saveMacroLog, todayStr,
  getWaterLog, saveWaterLog,
  getFavorites, saveFavorites,
} from '../utils/storage'
import { calcTDEE } from '../utils/tdee'
import { searchFood } from '../utils/quotes'
import BarcodeScanner from '../components/BarcodeScanner'

// ─── Macro Ring ───────────────────────────────────────────────────────────────
function MacroRingFull({ targets, totals }) {
  const data = [
    { name: 'bg',       value: 100,                                               fill: '#1e1e1e' },
    { name: 'calories', value: Math.min((totals.calories/targets.calories)*100,100), fill: '#4da6ff' },
  ]
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="100%"
            startAngle={90} endAngle={-270} data={data} barSize={14}>
            <RadialBar dataKey="value" cornerRadius={12} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{totals.calories}</span>
          <span className="text-white/40 text-xs font-bold">/ {targets.calories} kcal</span>
          <span className="text-accent text-xs font-black mt-1">
            {Math.max(targets.calories-totals.calories,0)} left
          </span>
        </div>
      </div>
      <div className="w-full mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Protein', val: totals.protein, target: targets.protein, unit: 'g', color: '#4e9ef5' },
          { label: 'Carbs',   val: totals.carbs,   target: targets.carbs,   unit: 'g', color: '#f5a04e' },
          { label: 'Fat',     val: totals.fat,      target: targets.fat,     unit: 'g', color: '#f54e9e' },
        ].map(m => (
          <div key={m.label} className="bg-[#1a1a1a] rounded-2xl p-3 text-center">
            <p className="text-xs text-white/40 font-bold uppercase mb-1">{m.label}</p>
            <p className="text-white font-black text-lg leading-none">{m.val}</p>
            <p className="text-white/30 text-xs">/{m.target}{m.unit}</p>
            <div className="h-1 bg-[#2a2a2a] rounded-full mt-2 overflow-hidden">
              <div className="h-full rounded-full"
                style={{ width: `${Math.min((m.val/m.target)*100,100)}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Water Tracker ────────────────────────────────────────────────────────────
function WaterTracker({ profileId, weight }) {
  const goal = Math.round(weight / 2) // lbs/2 = oz
  const [water, setWater] = useState(() => getWaterLog(profileId, todayStr()))

  function addOz(oz) {
    const updated = { oz: Math.min(water.oz + oz, goal * 1.5) }
    setWater(updated)
    saveWaterLog(profileId, todayStr(), updated)
  }

  function reset() {
    const updated = { oz: 0 }
    setWater(updated)
    saveWaterLog(profileId, todayStr(), updated)
  }

  const pct = Math.min((water.oz / goal) * 100, 100)

  return (
    <div className="p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Water Intake</span>
        </div>
        <button onClick={reset} className="text-white/20 text-xs active:text-white/50">Reset</button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4da6ff, #38bdf8)' }} />
        </div>
        <span className="text-white font-black text-sm shrink-0">
          {water.oz}<span className="text-white/40 font-normal">/{goal} oz</span>
        </span>
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {[8, 16, 32].map(oz => (
          <button key={oz} onClick={() => addOz(oz)}
            className="flex-1 py-2.5 bg-[#1a1a1a] border border-border rounded-xl text-white font-bold text-sm active:border-accent/40 transition-all">
            +{oz} oz
          </button>
        ))}
        <button onClick={() => addOz(goal - water.oz)}
          className="px-3 py-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent font-bold text-xs active:scale-95">
          Fill
        </button>
      </div>

      {pct >= 100 && (
        <p className="text-accent text-xs font-bold text-center mt-2">🎉 Daily goal reached!</p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Macros() {
  const { activeProfile } = useApp()
  const [macroLog, setMacroLog] = useState(() => getMacroLog(activeProfile.id, todayStr()))
  const [favorites, setFavorites] = useState(() => getFavorites(activeProfile.id))
  const [foodInput, setFoodInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [weightUnit, setWeightUnit] = useState('g')
  const [logging, setLogging] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const targets = calcTDEE(activeProfile)

  const totals = macroLog.items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories||0),
      protein:  acc.protein  + (item.protein||0),
      carbs:    acc.carbs    + (item.carbs||0),
      fat:      acc.fat      + (item.fat||0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // ─── Log food item ──────────────────────────────────────────────────────────
  function addItem(item) {
    const updated = { items: [...macroLog.items, { ...item, id: Date.now() }] }
    saveMacroLog(activeProfile.id, todayStr(), updated)
    setMacroLog(updated)
  }

  async function logFood() {
    if (!foodInput.trim() || searching) return
    setSearching(true)
    try {
      const results = await searchFood(foodInput)
      setSearchResults(results)
    } catch {
      alert('Could not search foods. Check your connection.')
    } finally {
      setSearching(false)
    }
  }

  function selectSearchResult(r) {
    const grams = parseFloat(weightInput) || r.defaultGrams
    const ratio = grams / 100
    addItem({
      name: `${r.name} (${grams}g)`,
      calories: Math.round(r.per100g.calories * ratio),
      protein:  Math.round(r.per100g.protein  * ratio * 10) / 10,
      carbs:    Math.round(r.per100g.carbs    * ratio * 10) / 10,
      fat:      Math.round(r.per100g.fat      * ratio * 10) / 10,
    })
    setSearchResults(null)
    setFoodInput('')
    setWeightInput('')
  }

  function deleteItem(id) {
    const updated = { items: macroLog.items.filter(i => i.id !== id) }
    saveMacroLog(activeProfile.id, todayStr(), updated)
    setMacroLog(updated)
  }

  function toggleFavorite(item) {
    const exists = favorites.find(f => f.name === item.name)
    let updated
    if (exists) {
      updated = favorites.filter(f => f.name !== item.name)
    } else {
      const { id, ...rest } = item
      updated = [rest, ...favorites]
    }
    saveFavorites(activeProfile.id, updated)
    setFavorites(updated)
  }

  function logFavorite(fav) {
    addItem({ ...fav })
  }

  function handleBarcodeResult(item) {
    addItem(item)
    setShowScanner(false)
  }

  return (
    <div className="page-scroll" style={{ paddingBottom: '7rem' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-3xl font-black text-white">Macros</h1>
        <p className="text-white/40 text-sm">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
      </div>

      <div className="px-4 space-y-4">

        {/* Macro ring */}
        <div className="p-5 bg-card border border-border rounded-2xl">
          <MacroRingFull targets={targets} totals={totals} />
        </div>

        {/* Water tracker */}
        <WaterTracker profileId={activeProfile.id} weight={activeProfile.weight || 170} />

        {/* Favorites chips */}
        {favorites.length > 0 && (
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Quick Add Favorites</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {favorites.map((fav, i) => (
                <button key={i} onClick={() => logFavorite(fav)}
                  className="shrink-0 px-3 py-2 bg-card border border-border rounded-xl text-left active:border-accent/40 transition-all">
                  <p className="text-white text-xs font-bold truncate max-w-[100px]">{fav.name}</p>
                  <p className="text-white/40 text-[10px]">{fav.calories} kcal</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Log food input */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Log Food</p>

          {/* Main input row with barcode button */}
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent"
              placeholder='e.g. "chicken breast" or "oatmeal"'
              value={foodInput}
              onChange={e => setFoodInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && logFood()}
            />
            {/* Barcode scanner button */}
            <button onClick={() => setShowScanner(true)}
              className="w-12 h-12 bg-[#1a1a1a] border border-border rounded-xl flex items-center justify-center active:border-accent/40 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" className="w-5 h-5">
                <path d="M3 9V6a1 1 0 0 1 1-1h3M15 5h3a1 1 0 0 1 1 1v3M3 15v3a1 1 0 0 0 1 1h3M15 19h3a1 1 0 0 0 1-1v-3"/>
                <line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/>
                <line x1="13" y1="8" x2="13" y2="16"/><line x1="16" y1="8" x2="16" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Weight input row */}
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 bg-[#1a1a1a] border border-border rounded-xl px-4 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-accent/60"
              placeholder="Weight (optional — for accuracy)"
              type="number" inputMode="decimal"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
            />
            <button
              onClick={() => setWeightUnit(u => u === 'g' ? 'oz' : 'g')}
              className="px-3 py-2.5 bg-[#1a1a1a] border border-border rounded-xl text-white/60 font-bold text-sm min-w-[48px] active:border-accent/40"
            >
              {weightUnit}
            </button>
          </div>

          <button onClick={logFood} disabled={searching||!foodInput.trim()}
            className="w-full py-3 bg-accent rounded-xl font-black text-white text-sm active:scale-95 disabled:opacity-40 transition-all">
            {searching ? 'Searching…' : 'Search Food'}
          </button>
          <p className="text-white/25 text-xs mt-2 text-center">Search real foods from the food database — free &amp; instant</p>
        </div>

        {/* Food log */}
        {macroLog.items.length > 0 ? (
          <div className="space-y-2">
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Today's Food Log</p>
            {macroLog.items.map(item => {
              const isFav = favorites.some(f => f.name === item.name)
              return (
                <div key={item.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{item.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {item.calories} kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Favorite toggle */}
                    <button onClick={() => toggleFavorite(item)}
                      className={`p-1.5 rounded-lg transition-all ${isFav ? 'text-accent' : 'text-white/20 active:text-accent/60'}`}>
                      <svg viewBox="0 0 24 24" fill={isFav ? '#4da6ff' : 'none'} stroke={isFav ? '#4da6ff' : 'currentColor'} strokeWidth="2" className="w-4 h-4">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                    {/* Delete */}
                    <button onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-white/20 active:text-red-400 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-white/20 text-sm">No food logged yet today</div>
        )}

      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-16 left-0 right-0 mx-4 p-3 bg-[#0d0d0d] border border-border rounded-2xl flex justify-around text-center backdrop-blur-sm">
        <div>
          <p className="text-white font-black text-lg">{Math.max(targets.calories-totals.calories,0)}</p>
          <p className="text-white/40 text-xs font-bold">kcal left</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-[#4e9ef5] font-black text-lg">{Math.max(targets.protein-totals.protein,0)}g</p>
          <p className="text-white/40 text-xs font-bold">protein left</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-white font-black text-lg">{totals.calories}</p>
          <p className="text-white/40 text-xs font-bold">kcal eaten</p>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onResult={handleBarcodeResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Food Search Results Modal */}
      {searchResults !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-5 pb-10 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-black text-base">Select a Food</p>
              <button onClick={() => setSearchResults(null)} className="text-white/40 active:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-6">No results found. Try the barcode scanner or a different name.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((r, i) => (
                  <div key={i} className="p-3 bg-[#1a1a1a] border border-border rounded-2xl">
                    <p className="text-white font-bold text-sm truncate mb-1">{r.name}</p>
                    <p className="text-white/40 text-xs mb-2">Per 100g: {r.per100g.calories} kcal · P:{r.per100g.protein}g · C:{r.per100g.carbs}g · F:{r.per100g.fat}g</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">Serving: {weightInput || r.defaultGrams}g</span>
                      <span className="text-white/50 text-xs ml-1">
                        → {Math.round(r.per100g.calories * ((parseFloat(weightInput) || r.defaultGrams)/100))} kcal
                      </span>
                      <button
                        onClick={() => selectSearchResult(r)}
                        className="ml-auto px-4 py-1.5 bg-accent rounded-xl font-black text-white text-xs active:scale-95">
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
