import { useState, useEffect } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useApp } from '../App'
import { todayStr, getMacroLog, saveMacroLog, getDailyQuote, saveDailyQuote, getWorkoutLog } from '../utils/storage'
import { calcTDEE } from '../utils/tdee'
import { callClaude, parseJSON } from '../utils/api'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const today = new Date()
const todayDay = DAY_NAMES[today.getDay()]

function MacroRing({ targets, totals }) {
  const calPct = Math.min((totals.calories / targets.calories) * 100, 100)
  const data = [
    { name: 'bg',       value: 100, fill: '#1e1e1e' },
    { name: 'calories', value: calPct, fill: '#e8f54e' },
  ]
  const remaining = Math.max(targets.calories - totals.calories, 0)

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={90} endAngle={-270}
            data={data}
            barSize={10}
          >
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
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min((m.val / m.target) * 100, 100)}%`, background: m.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Today({ onLogout }) {
  const { activeProfile, setTab } = useApp()
  const [macroLog, setMacroLog] = useState(() => getMacroLog(activeProfile.id, todayStr()))
  const [foodInput, setFoodInput] = useState('')
  const [logging, setLogging] = useState(false)
  const [quote, setQuote] = useState(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const targets = calcTDEE(activeProfile)

  const totals = macroLog.items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein:  acc.protein  + (item.protein  || 0),
      carbs:    acc.carbs    + (item.carbs    || 0),
      fat:      acc.fat      + (item.fat      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Today's workout summary
  const workoutLog = getWorkoutLog(activeProfile.id, todayStr())
  const plan = activeProfile.workoutPlan
  const todayPlan = plan?.[todayDay]

  // Daily quote
  useEffect(() => {
    const cached = getDailyQuote(activeProfile.id, todayStr())
    if (cached) { setQuote(cached); return }
    setLoadingQuote(true)
    callClaude({
      system: 'You are FORGE, a direct motivational fitness AI. Give ONE short motivational quote or tip for the day (under 20 words). No quotes marks. Just the text.',
      messages: [{ role: 'user', content: `Profile: ${activeProfile.name}, goal: ${activeProfile.goal}. Give me today's motivation.` }],
      maxTokens: 60,
    }).then(text => {
      const q = text.trim()
      setQuote(q)
      saveDailyQuote(activeProfile.id, todayStr(), q)
    }).catch(() => {
      setQuote('Consistency beats intensity. Show up today.')
    }).finally(() => setLoadingQuote(false))
  }, [activeProfile.id])

  async function logFood() {
    if (!foodInput.trim() || logging) return
    setLogging(true)
    try {
      const text = await callClaude({
        system: 'You are a nutrition AI. Return ONLY valid JSON with keys: name, calories, protein, carbs, fat (numbers). No extra text.',
        messages: [{ role: 'user', content: `Estimate macros for: ${foodInput}` }],
        maxTokens: 150,
      })
      const item = parseJSON(text)
      const updated = { items: [...macroLog.items, { ...item, id: Date.now() }] }
      saveMacroLog(activeProfile.id, todayStr(), updated)
      setMacroLog(updated)
      setFoodInput('')
    } catch {
      alert('Could not parse food. Try being more specific.')
    } finally {
      setLogging(false)
    }
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
        <button
          onClick={onLogout}
          className="mt-1 p-2 text-white/30 active:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Daily quote */}
        <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
          {loadingQuote ? (
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent/40 dot-1" />
              <div className="w-2 h-2 rounded-full bg-accent/40 dot-2" />
              <div className="w-2 h-2 rounded-full bg-accent/40 dot-3" />
            </div>
          ) : (
            <p className="text-accent font-bold text-sm">{quote}</p>
          )}
        </div>

        {/* Today's workout card */}
        <button
          onClick={() => setTab('workout')}
          className="w-full p-4 bg-card border border-border rounded-2xl text-left active:border-accent/40 transition-all"
        >
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
                {workoutLog?.completed
                  ? '✅ Completed'
                  : `${todayPlan.exercises?.length || 0} exercises`}
              </p>
            </>
          ) : (
            <p className="text-white font-bold">
              {plan ? 'Rest Day 🛌' : 'No plan yet — generate one!'}
            </p>
          )}
        </button>

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
              placeholder='e.g. "2 eggs and toast"'
              value={foodInput}
              onChange={e => setFoodInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && logFood()}
            />
            <button
              onClick={logFood}
              disabled={logging || !foodInput.trim()}
              className="px-4 py-3 bg-accent rounded-xl font-black text-black text-sm active:scale-95 disabled:opacity-40 transition-all"
            >
              {logging ? '…' : 'Log'}
            </button>
          </div>
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
                  +{macroLog.items.length - 3} more → view all
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
