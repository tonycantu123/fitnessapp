import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { useApp } from '../App'
import { getWorkoutLog, getMacroLog, last7Days, last30Days, getAllLogDates, todayStr } from '../utils/storage'
import { calcTDEE } from '../utils/tdee'

const TABS = ['This Week', 'This Month', 'All Time']

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className="text-white font-black text-2xl mt-1">{value}</p>
      {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(0) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Progress() {
  const { activeProfile } = useApp()
  const [tab, setTab] = useState(0)
  const targets = calcTDEE(activeProfile)

  const dates = useMemo(() => {
    if (tab === 0) return last7Days()
    if (tab === 1) return last30Days()
    // All time — all logged dates
    const all = getAllLogDates(activeProfile.id)
    if (!all.length) return last7Days()
    const start = new Date(all[0])
    const end = new Date()
    const days = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }, [tab, activeProfile.id])

  const workoutData = useMemo(() =>
    dates.map(d => {
      const log = getWorkoutLog(activeProfile.id, d)
      return {
        date: d.slice(5), // MM-DD
        completed: log?.completed ? 1 : 0,
      }
    }), [dates, activeProfile.id])

  const macroData = useMemo(() =>
    dates.map(d => {
      const log = getMacroLog(activeProfile.id, d)
      const cal = log.items.reduce((a, i) => a + (i.calories || 0), 0)
      const pro = log.items.reduce((a, i) => a + (i.protein  || 0), 0)
      return {
        date: d.slice(5),
        calories: cal || null,
        protein:  pro || null,
        targetCal: targets.calories,
        targetPro: targets.protein,
      }
    }), [dates, activeProfile.id, targets])

  // Streaks
  const { streak, longestStreak } = useMemo(() => {
    const allDates = [...dates].reverse()
    let cur = 0, max = 0, temp = 0
    let prevWasComplete = false
    for (const d of allDates) {
      const log = getWorkoutLog(activeProfile.id, d)
      if (log?.completed) {
        temp++
        if (d === todayStr() || prevWasComplete) cur = temp
        max = Math.max(max, temp)
        prevWasComplete = true
      } else {
        if (d !== todayStr()) { temp = 0; prevWasComplete = false }
      }
    }
    return { streak: cur, longestStreak: max }
  }, [dates, activeProfile.id])

  const totalWorkouts = workoutData.filter(d => d.completed).length
  const completionRate = dates.length ? Math.round((totalWorkouts / dates.length) * 100) : 0

  const macroWithData = macroData.filter(d => d.calories)
  const avgCal = macroWithData.length
    ? Math.round(macroWithData.reduce((a, d) => a + d.calories, 0) / macroWithData.length)
    : 0
  const avgPro = macroWithData.length
    ? Math.round(macroWithData.reduce((a, d) => a + d.protein, 0) / macroWithData.length)
    : 0
  const avgCalAdherence = avgCal && targets.calories
    ? Math.round((1 - Math.abs(avgCal - targets.calories) / targets.calories) * 100)
    : 0

  return (
    <div className="page-scroll pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-3xl font-black text-white">Progress</h1>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-5">
        <div className="flex bg-card border border-border rounded-2xl p-1">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === i ? 'bg-accent text-black' : 'text-white/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* Workout consistency */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">Workout Consistency</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutData} barCategoryGap="30%">
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#555', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={tab === 2 ? Math.floor(dates.length / 6) : 'preserveStartEnd'}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" fill="#e8f54e" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-accent font-black text-xl">{streak}</p>
              <p className="text-white/40 text-xs">Current streak</p>
            </div>
            <div>
              <p className="text-white font-black text-xl">{longestStreak}</p>
              <p className="text-white/40 text-xs">Longest streak</p>
            </div>
            <div>
              <p className="text-white font-black text-xl">{completionRate}%</p>
              <p className="text-white/40 text-xs">Completion rate</p>
            </div>
          </div>
        </div>

        {/* Macro adherence */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">Macro Adherence</p>
          {macroWithData.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macroData.filter(d => d.calories)}>
                    <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="calories"  stroke="#e8f54e" strokeWidth={2} dot={false} name="Calories" />
                    <Line type="monotone" dataKey="targetCal" stroke="#e8f54e" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Cal Target" />
                    <Line type="monotone" dataKey="protein"   stroke="#4e9ef5" strokeWidth={2} dot={false} name="Protein (g)" />
                    <Line type="monotone" dataKey="targetPro" stroke="#4e9ef5" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Pro Target" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-white/40 text-xs mt-2">Average calorie adherence: <span className="text-white font-bold">{avgCalAdherence}%</span></p>
            </>
          ) : (
            <p className="text-white/20 text-sm text-center py-6">No macro data yet — start logging food</p>
          )}
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Workouts" value={totalWorkouts} sub={`of ${dates.length} days`} />
          <StatCard label="Avg Daily Cals" value={avgCal || '—'} sub={`target: ${targets.calories}`} />
          <StatCard label="Avg Protein" value={avgPro ? `${avgPro}g` : '—'} sub={`target: ${targets.protein}g`} />
          <StatCard label="Days Tracked" value={macroWithData.length} sub="with food logged" />
        </div>
      </div>
    </div>
  )
}
