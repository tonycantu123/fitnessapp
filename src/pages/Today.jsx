import { useState, useEffect } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useApp } from '../App'
import {
  todayStr, getMacroLog, saveMacroLog,
  getDailyQuote, saveDailyQuote,
  getDailyVerse, saveDailyVerse,
  getWorkoutLog, calcStreak,
  getCelebratedMilestones,
  getSupplements, getSupplementLog, saveSupplementLog,
  getWeeklyReport, saveWeeklyReport, getWeekStr,
} from '../utils/storage'
import { calcTDEE } from '../utils/tdee'
import { getTodayQuote, getTodayVerse, generateAlgoReport, searchFood } from '../utils/quotes'
import MilestoneCelebration from '../components/MilestoneCelebration'
import WeeklyReport from '../components/WeeklyReport'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const todayDay = DAY_NAMES[new Date().getDay()]
const MILESTONES = [7, 30, 60, 90]
const SUPP_TIMES = ['Morning','Pre-workout','Post-workout','Evening','Night']

// ─── Macro Ring ───────────────────────────────────────────────────────────────
function MacroRing({ targets, totals }) {
  const calPct = Math.min((totals.calories / targets.calories) * 100, 100)
  const data = [
    { name: 'bg',       value: 100,    fill: '#1e1e1e' },
    { name: 'calories', value: calPct, fill: '#4da6ff' },
  ]
  const remaining = Math.max(targets.calories - totals.calories, 0)
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
            startAngle={90} endAngle={-270} data={data} barSize={10}>
            <RadialBar dataKey="value" cornerRadius={10} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{remaining}</span>
          <span className="text-[9px] text-white/40 font-bold uppercase">kcal left</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {[
          { label: 'Protein', val: totals.protein, target: targets.protein, unit: 'g', color: '#4e9ef5' },
          { label: 'Carbs',   val: totals.carbs,   target: targets.carbs,   unit: 'g', color: '#f5a04e' },
          { label: 'Fat',     val: totals.fat,      target: targets.fat,     unit: 'g', color: '#f54e9e' },
        ].map(m => (
          <div key={m.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/50 font-semibold">{m.label}</span>
              <span className="text-white font-bold">{m.val}<span className="text-white/40">/{m.target}{m.unit}</span></span>
            </div>
            <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min((m.val/m.target)*100,100)}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Supplement Settings Modal ────────────────────────────────────────────────
function SupplementSettings({ profileId, onClose }) {
  const [supps, setSupps] = useState(() => getSupplements(profileId))
  const [name, setName] = useState('')
  const [time, setTime] = useState('Morning')

  function add() {
    if (!name.trim()) return
    const updated = [...supps, { id: Date.now(), name: name.trim(), time }]
    setSupps(updated)
    saveSupplements(profileId, updated)
    setName('')
  }

  function remove(id) {
    const updated = supps.filter(s => s.id !== id)
    setSupps(updated)
    saveSupplements(profileId, updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-white font-black text-lg">Supplements</p>
          <button onClick={onClose} className="text-white/40 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="space-y-3 mb-5">
          <input
            className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent"
            placeholder="Supplement name (e.g. Creatine)"
            value={name} onChange={e => setName(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUPP_TIMES.map(t => (
              <button key={t} onClick={() => setTime(t)}
                className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  time === t ? 'border-accent bg-accent/10 text-accent' : 'border-border text-white/50'
                }`}>{t}</button>
            ))}
          </div>
          <button onClick={add} disabled={!name.trim()}
            className="w-full py-3 bg-accent rounded-xl font-black text-white text-sm disabled:opacity-40 active:scale-[0.98]">
            Add Supplement
          </button>
        </div>
        <div className="space-y-2">
          {supps.length === 0 && <p className="text-white/30 text-sm text-center py-4">No supplements added yet</p>}
          {supps.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-border rounded-xl">
              <div>
                <p className="text-white font-bold text-sm">{s.name}</p>
                <p className="text-white/40 text-xs">{s.time}</p>
              </div>
              <button onClick={() => remove(s.id)} className="text-white/20 active:text-red-400 p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Food Search Results Modal ────────────────────────────────────────────────
function FoodSearchModal({ results, onSelect, onClose }) {
  const [grams, setGrams] = useState({})
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-5 pb-10 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-black text-base">Select a Food</p>
          <button onClick={onClose} className="text-white/40 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {results.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">No results found. Try the barcode scanner or a more specific name.</p>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => {
              const g = parseFloat(grams[i]) || r.defaultGrams
              const ratio = g / 100
              return (
                <div key={i} className="p-3 bg-[#1a1a1a] border border-border rounded-2xl">
                  <p className="text-white font-bold text-sm truncate mb-1">{r.name}</p>
                  <p className="text-white/40 text-xs mb-2">Per 100g: {r.per100g.calories} kcal · P:{r.per100g.protein}g · C:{r.per100g.carbs}g · F:{r.per100g.fat}g</p>
                  <div className="flex gap-2 items-center">
                    <input
                      className="w-20 bg-[#111] border border-border rounded-lg px-2 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-accent"
                      type="number" placeholder="g"
                      value={grams[i] ?? r.defaultGrams}
                      onChange={e => setGrams(prev => ({ ...prev, [i]: e.target.value }))}
                    />
                    <span className="text-white/30 text-xs">g</span>
                    <span className="text-white/50 text-xs ml-1">{Math.round(r.per100g.calories * ratio)} kcal · P:{(r.per100g.protein * ratio).toFixed(1)}g</span>
                    <button
                      onClick={() => onSelect({
                        name: `${r.name} (${g}g)`,
                        calories: Math.round(r.per100g.calories * ratio),
                        protein:  Math.round(r.per100g.protein  * ratio * 10) / 10,
                        carbs:    Math.round(r.per100g.carbs    * ratio * 10) / 10,
                        fat:      Math.round(r.per100g.fat      * ratio * 10) / 10,
                      })}
                      className="ml-auto px-3 py-1.5 bg-accent rounded-xl font-black text-white text-xs active:scale-95">
                      Add
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Today({ onLogout }) {
  const { activeProfile, setTab } = useApp()
  const [macroLog, setMacroLog] = useState(() => getMacroLog(activeProfile.id, todayStr()))
  const [foodInput, setFoodInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [quote] = useState(() => {
    const cached = getDailyQuote(activeProfile.id, todayStr())
    if (cached) return cached
    const q = getTodayQuote()
    saveDailyQuote(activeProfile.id, todayStr(), q)
    return q
  })
  const [verse] = useState(() => {
    const cached = getDailyVerse(todayStr())
    if (cached) return cached
    const v = getTodayVerse()
    saveDailyVerse(todayStr(), v)
    return v
  })
  const [milestone, setMilestone] = useState(null)
  const [weeklyReport, setWeeklyReport] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showSuppSettings, setShowSuppSettings] = useState(false)
  const [supplements, setSupplements] = useState(() => getSupplements(activeProfile.id))
  const [suppLog, setSuppLog] = useState(() => getSupplementLog(activeProfile.id, todayStr()))

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

  const workoutLog = getWorkoutLog(activeProfile.id, todayStr())
  const plan = activeProfile.workoutPlan
  const todayPlan = plan?.[todayDay]
  const { currentStreak } = calcStreak(activeProfile.id)

  // ─── Milestone check ──────────────────────────────────────────────────────
  useEffect(() => {
    if (currentStreak === 0) return
    const celebrated = getCelebratedMilestones(activeProfile.id)
    const hit = MILESTONES.find(m => m === currentStreak && !celebrated.includes(m))
    if (hit) setMilestone(hit)
  }, [currentStreak, activeProfile.id])

  // ─── Weekly report (auto on Sundays — algorithmic, no API) ───────────────
  useEffect(() => {
    const isSunday = new Date().getDay() === 0
    if (!isSunday) return
    const weekStr = getWeekStr()
    const existing = getWeeklyReport(activeProfile.id, weekStr)
    if (existing) { setWeeklyReport(existing); setShowReport(true); return }
    generateWeeklyReport(weekStr)
  }, [activeProfile.id])

  function generateWeeklyReport(weekStr) {
    try {
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10)
      })
      const workouts = last7.map(d => getWorkoutLog(activeProfile.id, d))
      const macros   = last7.map(d => getMacroLog(activeProfile.id, d))
      const workoutsCompleted = workouts.filter(w => w?.completed).length
      const workoutRate = Math.round((workoutsCompleted / 7) * 100)
      const macroTotals = macros.map(m => m.items.reduce((a, i) => ({ cal: a.cal + (i.calories||0), pro: a.pro + (i.protein||0) }), { cal: 0, pro: 0 }))
      const daysWithFood = macroTotals.filter(m => m.cal > 0)
      const avgCal = daysWithFood.length ? Math.round(daysWithFood.reduce((a, m) => a + m.cal, 0) / daysWithFood.length) : 0
      const avgProtein = daysWithFood.length ? Math.round(daysWithFood.reduce((a, m) => a + m.pro, 0) / daysWithFood.length) : 0
      const stats = { workoutsCompleted, workoutRate, avgCal, avgProtein }
      const report = generateAlgoReport(stats, targets, weekStr)
      saveWeeklyReport(activeProfile.id, weekStr, report)
      setWeeklyReport(report)
      setShowReport(true)
    } catch (err) {
      console.error('Weekly report error', err)
    }
  }

  // ─── Food search (Open Food Facts — free) ────────────────────────────────
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

  function addFoodItem(item) {
    const updated = { items: [...macroLog.items, { ...item, id: Date.now() }] }
    saveMacroLog(activeProfile.id, todayStr(), updated)
    setMacroLog(updated)
    setSearchResults(null)
    setFoodInput('')
  }

  // ─── Supplements ──────────────────────────────────────────────────────────
  function toggleSupplement(id) {
    const updated = { ...suppLog, [id]: !suppLog[id] }
    setSuppLog(updated)
    saveSupplementLog(activeProfile.id, todayStr(), updated)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-scroll pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm font-medium">{greeting},</p>
          <h1 className="text-3xl font-black text-white">{activeProfile.name}</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 rounded-full">
              <span className="text-base leading-none">🔥</span>
              <span className="text-orange-400 font-black text-sm">{currentStreak}</span>
            </div>
          )}
          <button onClick={onLogout} className="p-2 text-white/30 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Motivational quote */}
        <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
          <p className="text-accent font-bold text-sm">{quote}</p>
        </div>

        {/* Bible verse */}
        <div className="p-4 bg-[#141420] border border-[#2a2a4a] rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✝️</span>
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Verse of the Day</span>
          </div>
          {verse && (
            <>
              <p className="text-white text-sm italic leading-relaxed">"{verse.text}"</p>
              <p className="text-white/40 text-xs font-bold mt-2">— {verse.reference}</p>
            </>
          )}
        </div>

        {/* Today's workout */}
        <button onClick={() => setTab('workout')}
          className="w-full p-4 bg-card border border-border rounded-2xl text-left active:border-accent/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Today's Workout</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" className="w-4 h-4">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          {todayPlan ? (
            <>
              <p className="text-white font-black text-lg">{todayPlan.focus}</p>
              <p className="text-white/40 text-sm mt-0.5">
                {workoutLog?.completed ? '✅ Completed' : `${todayPlan.exercises?.length||0} exercises`}
                {todayPlan.injuryNote && <span className="ml-2 text-orange-400">🩹 Modified</span>}
              </p>
            </>
          ) : (
            <p className="text-white font-bold">{plan ? 'Rest Day 🛌' : 'No plan yet — generate one!'}</p>
          )}
        </button>

        {/* Supplements card */}
        {supplements.length > 0 && (
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Supplements</span>
              <button onClick={() => setShowSuppSettings(true)}
                className="text-accent/60 text-xs font-bold active:text-accent">Manage</button>
            </div>
            <div className="space-y-2">
              {supplements.map(s => (
                <button key={s.id} onClick={() => toggleSupplement(s.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    suppLog[s.id] ? 'border-accent/30 bg-accent/5 opacity-60' : 'border-border bg-[#1a1a1a]'
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    suppLog[s.id] ? 'bg-accent border-accent' : 'border-white/20'
                  }`}>
                    {suppLog[s.id] && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-bold text-sm ${suppLog[s.id] ? 'line-through text-white/40' : 'text-white'}`}>{s.name}</p>
                    <p className="text-white/30 text-xs">{s.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {supplements.length === 0 && (
          <button onClick={() => setShowSuppSettings(true)}
            className="w-full p-3 border border-dashed border-[#2a2a2a] rounded-2xl text-white/25 text-sm text-center">
            + Add supplement reminders
          </button>
        )}

        {/* Macro ring */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Today's Macros</p>
          <MacroRing targets={targets} totals={totals} />
        </div>

        {/* Quick log food */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Quick Log Food</p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent"
              placeholder='e.g. "chicken breast" or "banana"'
              value={foodInput}
              onChange={e => setFoodInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && logFood()}
            />
            <button onClick={logFood} disabled={searching || !foodInput.trim()}
              className="px-4 py-3 bg-accent rounded-xl font-black text-white text-sm active:scale-95 disabled:opacity-40 transition-all">
              {searching ? '…' : 'Search'}
            </button>
          </div>
          <p className="text-white/25 text-xs mt-2">Search real foods from the food database</p>
          {macroLog.items.length > 0 && (
            <div className="mt-3 space-y-1">
              {macroLog.items.slice(-3).map(item => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-white/60 truncate max-w-[60%]">{item.name}</span>
                  <span className="text-white/40">{item.calories} kcal</span>
                </div>
              ))}
              {macroLog.items.length > 3 && (
                <button onClick={() => setTab('macros')} className="text-accent/70 text-xs font-semibold">
                  +{macroLog.items.length-3} more → view all
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Weekly report button (Sundays) */}
      {weeklyReport && !showReport && new Date().getDay() === 0 && (
        <div className="px-4 mt-4">
          <button onClick={() => setShowReport(true)}
            className="w-full py-3 border border-accent/30 bg-accent/5 rounded-2xl text-accent font-bold text-sm active:scale-[0.98]">
            📊 View This Week's Report
          </button>
        </div>
      )}

      {/* Overlays */}
      {milestone && (
        <MilestoneCelebration
          days={milestone} profileId={activeProfile.id}
          onClose={() => setMilestone(null)}
        />
      )}
      {showReport && weeklyReport && (
        <WeeklyReport report={weeklyReport} onClose={() => setShowReport(false)} />
      )}
      {showSuppSettings && (
        <SupplementSettings
          profileId={activeProfile.id}
          onClose={() => {
            setSupplements(getSupplements(activeProfile.id))
            setShowSuppSettings(false)
          }}
        />
      )}
      {searchResults !== null && (
        <FoodSearchModal
          results={searchResults}
          onSelect={addFoodItem}
          onClose={() => setSearchResults(null)}
        />
      )}
    </div>
  )
}
