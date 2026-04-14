import { useState } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useApp } from '../App'
import { getMacroLog, saveMacroLog, todayStr } from '../utils/storage'
import { calcTDEE } from '../utils/tdee'
import { callClaude, parseJSON } from '../utils/api'

function MacroRingFull({ targets, totals }) {
  const pct = v => Math.min((v / targets.calories) * 100, 100)

  const data = [
    { name: 'bg',       value: 100,                     fill: '#1e1e1e' },
    { name: 'calories', value: pct(totals.calories),    fill: '#4da6ff' },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="68%" outerRadius="100%"
            startAngle={90} endAngle={-270}
            data={data} barSize={14}
          >
            <RadialBar dataKey="value" cornerRadius={12} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{totals.calories}</span>
          <span className="text-white/40 text-xs font-bold">/ {targets.calories} kcal</span>
          <span className="text-accent text-xs font-black mt-1">
            {Math.max(targets.calories - totals.calories, 0)} left
          </span>
        </div>
      </div>
      {/* Macro bars */}
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
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min((m.val/m.target)*100,100)}%`, background: m.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Macros() {
  const { activeProfile } = useApp()
  const [macroLog, setMacroLog] = useState(() => getMacroLog(activeProfile.id, todayStr()))
  const [foodInput, setFoodInput] = useState('')
  const [logging, setLogging] = useState(false)

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

  async function logFood() {
    if (!foodInput.trim() || logging) return
    setLogging(true)
    try {
      const text = await callClaude({
        system: 'You are a nutrition AI. Return ONLY valid JSON with keys: name (string), calories (number), protein (number), carbs (number), fat (number). No extra text or markdown.',
        messages: [{ role: 'user', content: `Estimate macros for: ${foodInput}` }],
        maxTokens: 150,
      })
      const item = parseJSON(text)
      const updated = { items: [...macroLog.items, { ...item, id: Date.now() }] }
      saveMacroLog(activeProfile.id, todayStr(), updated)
      setMacroLog(updated)
      setFoodInput('')
    } catch {
      alert('Could not estimate macros. Try being more specific (e.g. "200g grilled chicken breast").')
    } finally {
      setLogging(false)
    }
  }

  function deleteItem(id) {
    const updated = { items: macroLog.items.filter(i => i.id !== id) }
    saveMacroLog(activeProfile.id, todayStr(), updated)
    setMacroLog(updated)
  }

  return (
    <div className="page-scroll pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-3xl font-black text-white">Macros</h1>
        <p className="text-white/40 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Macro ring */}
        <div className="p-5 bg-card border border-border rounded-2xl">
          <MacroRingFull targets={targets} totals={totals} />
        </div>

        {/* Log food input */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Log Food</p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent"
              placeholder='e.g. "chicken breast 6oz with rice"'
              value={foodInput}
              onChange={e => setFoodInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && logFood()}
            />
            <button
              onClick={logFood}
              disabled={logging || !foodInput.trim()}
              className="px-5 py-3 bg-accent rounded-xl font-black text-black text-sm active:scale-95 disabled:opacity-40 transition-all shrink-0"
            >
              {logging ? '…' : 'Add'}
            </button>
          </div>
          <p className="text-white/25 text-xs mt-2">Describe food in plain English — AI estimates the macros</p>
        </div>

        {/* Food log */}
        {macroLog.items.length > 0 ? (
          <div className="space-y-2">
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Today's Food Log</p>
            {macroLog.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{item.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {item.calories} kcal · P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                  </p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-white/20 active:text-red-400 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-white/20 text-sm">
            No food logged yet today
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-16 left-0 right-0 mx-4 p-3 bg-[#0d0d0d] border border-border rounded-2xl flex justify-around text-center backdrop-blur-sm">
        <div>
          <p className="text-white font-black text-lg">{Math.max(targets.calories - totals.calories, 0)}</p>
          <p className="text-white/40 text-xs font-bold">kcal left</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-[#4e9ef5] font-black text-lg">{Math.max(targets.protein - totals.protein, 0)}g</p>
          <p className="text-white/40 text-xs font-bold">protein left</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-white font-black text-lg">{totals.calories}</p>
          <p className="text-white/40 text-xs font-bold">kcal eaten</p>
        </div>
      </div>
    </div>
  )
}
