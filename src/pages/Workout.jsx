import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { saveProfile, getWorkoutLog, saveWorkoutLog, todayStr, dateStr } from '../utils/storage'
import { callClaude, parseJSON } from '../utils/api'

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function getWeekDays() {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  // Align to Monday-based week
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + i)
    days.push(d)
  }
  return days
}

const WEEK_DAYS = getWeekDays()
const todayDate = new Date()

function ExerciseCard({ exercise, checked, onCheck }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${checked ? 'border-accent/30 opacity-70' : 'border-border'}`}>
      <div
        className="flex items-center gap-3 p-4"
        onClick={() => setExpanded(e => !e)}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onCheck()}
          onClick={e => e.stopPropagation()}
          className="w-5 h-5 rounded accent-yellow-300 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base truncate ${checked ? 'line-through text-white/40' : 'text-white'}`}>
            {exercise.name}
          </p>
          <p className="text-white/40 text-sm">
            {exercise.sets} sets × {exercise.reps} · Rest {exercise.rest}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"
          className={`w-4 h-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {expanded && exercise.notes && (
        <div className="px-4 pb-4">
          <p className="text-white/50 text-sm bg-[#1a1a1a] rounded-xl p-3">{exercise.notes}</p>
        </div>
      )}
    </div>
  )
}

function RestDayCard() {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl text-center">
      <p className="text-5xl mb-3">🛌</p>
      <p className="text-white font-black text-xl mb-2">Rest Day</p>
      <p className="text-white/40 text-sm">Recovery is where growth happens. Prioritize sleep, hydration, and light movement.</p>
      <div className="mt-4 space-y-2 text-left">
        {['Get 7–9 hours of sleep', 'Walk 10 min', 'Stretch or foam roll', 'Stay hydrated (1 oz per lb of body weight)'].map(tip => (
          <div key={tip} className="flex items-center gap-2 text-sm text-white/50">
            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            {tip}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Workout() {
  const { activeProfile, refreshProfile } = useApp()
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date()
    // Map JS day (0=Sun) to Mon-based index
    return (d.getDay() + 6) % 7
  })
  const [generating, setGenerating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [checkedExercises, setCheckedExercises] = useState({})

  const plan = activeProfile.workoutPlan
  const selectedDate = WEEK_DAYS[selectedDay]
  const selectedDateStr = dateStr(selectedDate)
  const selectedDayName = DAY_NAMES[selectedDay]
  const isToday = selectedDateStr === todayStr()

  const dayPlan = plan?.[selectedDayName]
  const workoutLog = getWorkoutLog(activeProfile.id, selectedDateStr)

  // Load checked state from log
  useEffect(() => {
    if (workoutLog?.exercises) {
      const map = {}
      workoutLog.exercises.forEach((ex, i) => { map[i] = ex.checked })
      setCheckedExercises(map)
    } else {
      setCheckedExercises({})
    }
  }, [selectedDay, selectedDateStr])

  async function generatePlan() {
    setGenerating(true)
    try {
      const p = activeProfile
      const prompt = `Generate a complete 7-day workout plan for this person. Return ONLY valid JSON.

Profile:
- Name: ${p.name}
- Goal: ${p.goal}
- Physique goal: ${p.physiqueGoal || 'not specified'}
- Sport: ${p.sport || 'none'}
- Goal description: ${p.goalDescription || 'not specified'}
- Current routine: ${p.currentRoutine || 'none'}
- Fitness level: ${p.fitnessLevel}
- Has gym: ${p.hasGym}
- Activity level: ${p.activityLevel}
- Age: ${p.age}, Gender: ${p.gender}, Weight: ${p.weight} lbs

JSON format (all 7 days, Mon–Sun):
{
  "Monday": {
    "focus": "Chest & Triceps",
    "exercises": [
      { "name": "Bench Press", "sets": "4", "reps": "8-10", "rest": "90s", "notes": "Keep back flat, lower bar to chest" }
    ]
  },
  "Tuesday": { ... },
  ...
}

Rules:
- Include sport-specific training if sport is provided (e.g. agility drills for basketball, rotational strength for golf)
- If no gym: use bodyweight/home exercises only
- 4–6 exercises per training day, 1–2 rest days per week
- Rest days must have: { "focus": "Rest", "exercises": [] }
- Tailor to fitness level (beginner = simpler movements, more rest)`

      const text = await callClaude({
        system: 'You are an expert fitness coach. Return only valid JSON workout plans. No explanations.',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2500,
      })

      const newPlan = parseJSON(text)
      const updated = { ...activeProfile, workoutPlan: newPlan }
      saveProfile(updated)
      refreshProfile()
    } catch (err) {
      alert('Failed to generate plan. Try again.')
      console.error(err)
    } finally {
      setGenerating(false)
      setShowConfirm(false)
    }
  }

  function toggleExercise(idx, exercises) {
    const next = { ...checkedExercises, [idx]: !checkedExercises[idx] }
    setCheckedExercises(next)

    const allDone = exercises.every((_, i) => next[i])
    const logData = {
      completed: allDone,
      exercises: exercises.map((ex, i) => ({ ...ex, checked: !!next[i] })),
    }
    saveWorkoutLog(activeProfile.id, selectedDateStr, logData)
  }

  const completedCount = Object.values(checkedExercises).filter(Boolean).length

  return (
    <div className="page-scroll pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-3xl font-black text-white">Workout</h1>
      </div>

      {/* 7-day selector */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {WEEK_DAYS.map((d, i) => {
            const dStr = dateStr(d)
            const log = getWorkoutLog(activeProfile.id, dStr)
            const isSelected = i === selectedDay
            const isTodayDay = dStr === todayStr()
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl min-w-[52px] transition-all border ${
                  isSelected
                    ? 'bg-accent border-accent text-black'
                    : isTodayDay
                    ? 'border-accent/40 bg-accent/5 text-white'
                    : 'border-border bg-card text-white/50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{DAY_NAMES[i].slice(0,3)}</span>
                <span className="text-base font-black mt-0.5">{d.getDate()}</span>
                {log?.completed && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-black' : 'bg-accent'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {!plan ? (
          /* No plan yet */
          <div className="p-6 bg-card border border-border rounded-2xl text-center">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-white font-black text-xl mb-2">No Plan Yet</p>
            <p className="text-white/40 text-sm mb-4">Generate your personalized AI workout plan based on your profile.</p>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="w-full py-4 bg-accent rounded-2xl font-black text-black text-lg active:scale-[0.98] disabled:opacity-60 accent-glow"
            >
              {generating ? 'Generating Plan…' : 'Generate My Plan'}
            </button>
          </div>
        ) : dayPlan && dayPlan.exercises.length === 0 ? (
          <RestDayCard />
        ) : dayPlan ? (
          <>
            {/* Day header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-black text-xl">{dayPlan.focus}</p>
                <p className="text-white/40 text-sm">
                  {completedCount}/{dayPlan.exercises.length} completed
                  {workoutLog?.completed ? ' · ✅ Done!' : ''}
                </p>
              </div>
              {isToday && workoutLog?.completed && (
                <div className="px-3 py-1 bg-accent/20 border border-accent/40 rounded-full">
                  <span className="text-accent text-xs font-black">COMPLETE</span>
                </div>
              )}
            </div>

            {/* Exercises */}
            <div className="space-y-3">
              {dayPlan.exercises.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  exercise={ex}
                  checked={!!checkedExercises[i]}
                  onCheck={() => toggleExercise(i, dayPlan.exercises)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="p-6 bg-card border border-border rounded-2xl text-center">
            <p className="text-white/40">No plan for {selectedDayName}</p>
          </div>
        )}

        {/* Regenerate */}
        {plan && (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 border border-border rounded-2xl text-white/40 text-sm font-semibold active:border-white/20 transition-all"
          >
            Regenerate Plan
          </button>
        )}
      </div>

      {/* Confirm regenerate dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm">
            <p className="text-white font-black text-lg mb-2">Regenerate Plan?</p>
            <p className="text-white/40 text-sm mb-6">Your current plan will be replaced. Workout logs are kept.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-border rounded-2xl text-white font-bold"
              >
                Cancel
              </button>
              <button
                onClick={generatePlan}
                disabled={generating}
                className="flex-1 py-3 bg-accent rounded-2xl font-black text-black disabled:opacity-60"
              >
                {generating ? 'Generating…' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
