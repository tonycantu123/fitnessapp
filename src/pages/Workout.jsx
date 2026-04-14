import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { saveProfile, getWorkoutLog, saveWorkoutLog, todayStr, dateStr, getPlanGenCount, incrementPlanGenCount, PLAN_GEN_LIMIT } from '../utils/storage'
import { callClaude, parseJSON } from '../utils/api'

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function getWeekDays() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + i)
    days.push(d)
  }
  return days
}

const WEEK_DAYS = getWeekDays()

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, checked, onCheck, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${checked ? 'border-accent/30 opacity-70' : 'border-border'}`}>
      <div className="flex items-center gap-3 p-4" onClick={() => setExpanded(e => !e)}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onCheck()}
          onClick={e => e.stopPropagation()}
          className="w-5 h-5 rounded shrink-0"
          style={{ accentColor: '#4da6ff' }}
        />
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base truncate ${checked ? 'line-through text-white/40' : 'text-white'}`}>
            {exercise.name}
          </p>
          <p className="text-white/40 text-sm">
            {exercise.sets} sets × {exercise.reps} · Rest {exercise.rest}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-1 text-white/20 active:text-red-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <svg viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {expanded && exercise.notes && (
        <div className="px-4 pb-4">
          <p className="text-white/50 text-sm bg-[#1a1a1a] rounded-xl p-3">{exercise.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Add Exercise Modal ───────────────────────────────────────────────────────
function AddExerciseModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', sets: '3', reps: '10', rest: '60s', notes: '' })
  const valid = form.name.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-black text-lg">Add Exercise</p>
          <button onClick={onClose} className="text-white/40 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {[
          { label: 'Exercise Name', key: 'name', placeholder: 'e.g. Bench Press' },
          { label: 'Sets', key: 'sets', placeholder: '3' },
          { label: 'Reps', key: 'reps', placeholder: '8-12' },
          { label: 'Rest', key: 'rest', placeholder: '90s' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-white/50 text-xs font-bold uppercase tracking-wider mb-1.5">{f.label}</label>
            <input
              className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent"
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <div>
          <label className="block text-white/50 text-xs font-bold uppercase tracking-wider mb-1.5">Notes (optional)</label>
          <textarea
            className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent resize-none"
            placeholder="Form cues, tips, etc."
            rows={2}
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          />
        </div>
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          className="w-full py-4 bg-accent rounded-2xl font-black text-white text-base active:scale-[0.98] disabled:opacity-40 transition-all"
        >
          Add Exercise
        </button>
      </div>
    </div>
  )
}

// ─── AI Modify Modal ──────────────────────────────────────────────────────────
function AIModifyModal({ profile, dayName, currentExercises, onSave, onClose }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const SUGGESTIONS = [
    'Make it shorter — I only have 20 minutes',
    'Add basketball agility drills',
    'Replace any machine exercises with free weights',
    'Make it harder — add more sets and weight',
    'I have a sore shoulder — work around it',
  ]

  async function modify() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    try {
      const exerciseList = currentExercises.map(e =>
        `${e.name} — ${e.sets} sets × ${e.reps}, rest ${e.rest}`
      ).join('\n')

      const text = await callClaude({
        system: `You are an expert fitness coach and sports science researcher. When modifying workouts, cite the scientific reasoning behind your choices (e.g., progressive overload, SAID principle, periodization). Return ONLY valid JSON.`,
        messages: [{
          role: 'user',
          content: `Athlete profile:
- Goal: ${profile.goal}
- Sport: ${profile.sport || 'none'}
- Physique goal: ${profile.physiqueGoal || 'not set'}
- Fitness level: ${profile.fitnessLevel}
- Has gym: ${profile.hasGym}

Today is ${dayName}. Current workout:
${exerciseList}

User request: "${prompt}"

Return an updated exercise list as JSON array:
[{ "name": "...", "sets": "4", "reps": "8-10", "rest": "90s", "notes": "Scientific reason + form cue" }]

Keep the same JSON shape. Include research-backed notes explaining WHY each exercise is chosen for their specific goal.`
        }],
        maxTokens: 1200,
      })
      const updated = parseJSON(text)
      setPreview(updated)
    } catch (err) {
      alert('Could not modify workout. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-black text-lg">Modify with AI</p>
            <p className="text-white/40 text-xs">{dayName}'s workout</p>
          </div>
          <button onClick={onClose} className="text-white/40 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {!preview ? (
          <>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    prompt === s ? 'border-accent bg-accent/10 text-accent' : 'border-border text-white/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-accent resize-none mb-4"
              placeholder='Describe what you want changed... e.g. "I want more explosive movements for basketball"'
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <button
              onClick={modify}
              disabled={!prompt.trim() || loading}
              className="w-full py-4 bg-accent rounded-2xl font-black text-white text-base active:scale-[0.98] disabled:opacity-40 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="dot-1 inline-block w-2 h-2 rounded-full bg-white/60" />
                  <span className="dot-2 inline-block w-2 h-2 rounded-full bg-white/60" />
                  <span className="dot-3 inline-block w-2 h-2 rounded-full bg-white/60" />
                </span>
              ) : 'Generate Modified Workout'}
            </button>
          </>
        ) : (
          <>
            <p className="text-white/50 text-sm mb-3">Review your updated workout:</p>
            <div className="space-y-3 mb-5">
              {preview.map((ex, i) => (
                <div key={i} className="p-3 bg-[#1a1a1a] border border-border rounded-xl">
                  <p className="text-white font-bold text-sm">{ex.name}</p>
                  <p className="text-white/40 text-xs">{ex.sets} sets × {ex.reps} · Rest {ex.rest}</p>
                  {ex.notes && <p className="text-accent/70 text-xs mt-1 italic">{ex.notes}</p>}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 py-3 border border-border rounded-2xl text-white font-bold"
              >
                Try Again
              </button>
              <button
                onClick={() => onSave(preview)}
                className="flex-1 py-3 bg-accent rounded-2xl font-black text-white"
              >
                Apply Plan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Injury Mode Modal ────────────────────────────────────────────────────────
function InjuryModal({ profile, dayName, currentExercises, onSave, onClose }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const EXAMPLES = ['Sore shoulder','Lower back pain','Knee pain','Wrist injury','Ankle sprain']

  async function rewrite() {
    if (!description.trim() || loading) return
    setLoading(true)
    try {
      const exerciseList = currentExercises.map(e => `${e.name} — ${e.sets}×${e.reps}`).join('\n')
      const text = await callClaude({
        system: 'You are a physical therapist and strength coach. Rewrite workouts to work around injuries safely. Return ONLY valid JSON.',
        messages: [{
          role: 'user',
          content: `Athlete profile: Goal: ${profile.goal}, Fitness level: ${profile.fitnessLevel}, Has gym: ${profile.hasGym}

Injury: "${description}"

Current ${dayName} workout:
${exerciseList}

Rewrite this workout completely avoiding movements that stress the injured area. Include rehab-friendly alternatives.

Return JSON array:
[{ "name": "...", "sets": "3", "reps": "12", "rest": "60s", "notes": "Safe for ${description} because..." }]`
        }],
        maxTokens: 1200,
      })
      const updated = parseJSON(text)
      onSave(updated, description)
    } catch { alert('Could not rewrite workout. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-black text-lg">🩹 Injury Mode</p>
            <p className="text-white/40 text-xs">FORGE will rewrite today's workout around your injury</p>
          </div>
          <button onClick={onClose} className="text-white/40 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(e => (
            <button key={e} onClick={() => setDescription(e)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                description === e ? 'border-orange-400/60 bg-orange-400/10 text-orange-400' : 'border-border text-white/40'
              }`}>{e}</button>
          ))}
        </div>
        <textarea
          className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-orange-400/60 resize-none"
          placeholder='Describe what hurts, e.g. "sharp pain in left shoulder when pressing overhead"'
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button onClick={rewrite} disabled={!description.trim() || loading}
          className="w-full py-4 bg-orange-500 rounded-2xl font-black text-white text-base active:scale-[0.98] disabled:opacity-40 transition-all">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="dot-1 inline-block w-2 h-2 rounded-full bg-white/60"/>
              <span className="dot-2 inline-block w-2 h-2 rounded-full bg-white/60"/>
              <span className="dot-3 inline-block w-2 h-2 rounded-full bg-white/60"/>
            </span>
          ) : 'Rewrite Workout Around Injury'}
        </button>
      </div>
    </div>
  )
}

// ─── Rest Day Card ─────────────────────────────────────────────────────────────
function RestDayCard() {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl text-center">
      <p className="text-5xl mb-3">🛌</p>
      <p className="text-white font-black text-xl mb-2">Rest Day</p>
      <p className="text-white/40 text-sm">Recovery is where growth happens. Prioritize sleep, hydration, and light movement.</p>
      <div className="mt-4 space-y-2 text-left">
        {['Get 7–9 hours of sleep','Walk 10 min','Stretch or foam roll','Stay hydrated'].map(tip => (
          <div key={tip} className="flex items-center gap-2 text-sm text-white/50">
            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            {tip}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Workout() {
  const { activeProfile, refreshProfile } = useApp()
  const [selectedDay, setSelectedDay] = useState(() => (new Date().getDay() + 6) % 7)
  const [generating, setGenerating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [planGenCount, setPlanGenCount] = useState(() => getPlanGenCount(activeProfile.id))
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showAIModify, setShowAIModify] = useState(false)
  const [showInjury, setShowInjury] = useState(false)
  const [checkedExercises, setCheckedExercises] = useState({})

  const plan = activeProfile.workoutPlan
  const selectedDate = WEEK_DAYS[selectedDay]
  const selectedDateStr = dateStr(selectedDate)
  const selectedDayName = DAY_NAMES[selectedDay]
  const isToday = selectedDateStr === todayStr()
  const dayPlan = plan?.[selectedDayName]
  const workoutLog = getWorkoutLog(activeProfile.id, selectedDateStr)

  useEffect(() => {
    if (workoutLog?.exercises) {
      const map = {}
      workoutLog.exercises.forEach((ex, i) => { map[i] = ex.checked })
      setCheckedExercises(map)
    } else {
      setCheckedExercises({})
    }
  }, [selectedDay, selectedDateStr])

  // ─── Generate full plan ──────────────────────────────────────────────────
  async function generatePlan() {
    if (planGenCount >= PLAN_GEN_LIMIT) return
    setGenerating(true)
    try {
      const p = activeProfile
      const text = await callClaude({
        system: 'You are an expert fitness coach and sports science researcher. Create evidence-based workout plans. Return only valid JSON.',
        messages: [{
          role: 'user',
          content: `Generate a 7-day workout plan as JSON only. No explanation outside the JSON.

Athlete: ${p.goal}, ${p.fitnessLevel} level, ${p.hasGym ? 'has gym' : 'no gym'}, sport: ${p.sport || 'none'}.

Return this exact structure:
{"Monday":{"focus":"Chest & Triceps","exercises":[{"name":"Bench Press","sets":"4","reps":"8-10","rest":"90s","notes":"Form tip here"}]},"Tuesday":{...},...all 7 days}

Rules:
- 3-4 exercises per training day, 1-2 rest days
- Rest day format: {"focus":"Rest","exercises":[]}
- Notes: one short form tip only (under 10 words)
- No gym = bodyweight only
- Sport-specific drills if sport listed`
        }],
        maxTokens: 4096,
      })
      const newPlan = parseJSON(text)
      const updated = { ...activeProfile, workoutPlan: newPlan }
      saveProfile(updated)
      refreshProfile()
      incrementPlanGenCount(activeProfile.id)
      setPlanGenCount(c => c + 1)
    } catch (err) {
      alert(`Failed to generate plan: ${err.message}`)
    } finally {
      setGenerating(false)
      setShowConfirm(false)
    }
  }

  // ─── Toggle exercise checkbox ─────────────────────────────────────────────
  function toggleExercise(idx, exercises) {
    const next = { ...checkedExercises, [idx]: !checkedExercises[idx] }
    setCheckedExercises(next)
    const allDone = exercises.every((_, i) => next[i])
    saveWorkoutLog(activeProfile.id, selectedDateStr, {
      completed: allDone,
      exercises: exercises.map((ex, i) => ({ ...ex, checked: !!next[i] })),
    })
  }

  // ─── Add manual exercise ──────────────────────────────────────────────────
  function addExercise(exercise) {
    const current = plan?.[selectedDayName] || { focus: 'Custom', exercises: [] }
    const updatedPlan = {
      ...plan,
      [selectedDayName]: {
        ...current,
        exercises: [...current.exercises, exercise],
      },
    }
    const updated = { ...activeProfile, workoutPlan: updatedPlan }
    saveProfile(updated)
    refreshProfile()
    setShowAddExercise(false)
  }

  // ─── Delete exercise ──────────────────────────────────────────────────────
  function deleteExercise(idx) {
    const current = plan?.[selectedDayName]
    if (!current) return
    const updatedExercises = current.exercises.filter((_, i) => i !== idx)
    const updatedPlan = {
      ...plan,
      [selectedDayName]: { ...current, exercises: updatedExercises },
    }
    const updated = { ...activeProfile, workoutPlan: updatedPlan }
    saveProfile(updated)
    refreshProfile()
  }

  // ─── Apply AI-modified exercises ──────────────────────────────────────────
  function applyAIModification(newExercises) {
    const current = plan?.[selectedDayName] || { focus: selectedDayName, exercises: [] }
    const updatedPlan = {
      ...plan,
      [selectedDayName]: { ...current, exercises: newExercises },
    }
    const updated = { ...activeProfile, workoutPlan: updatedPlan }
    saveProfile(updated)
    refreshProfile()
    setShowAIModify(false)
    setCheckedExercises({})
  }

  // ─── Apply injury-modified exercises ─────────────────────────────────────
  function applyInjuryModification(newExercises, injuryNote) {
    const current = plan?.[selectedDayName] || { focus: selectedDayName, exercises: [] }
    const updatedPlan = {
      ...plan,
      [selectedDayName]: { ...current, exercises: newExercises, injuryNote },
    }
    const updated = { ...activeProfile, workoutPlan: updatedPlan }
    saveProfile(updated)
    refreshProfile()
    setShowInjury(false)
    setCheckedExercises({})
  }

  const exercises = dayPlan?.exercises || []
  const completedCount = Object.values(checkedExercises).filter(Boolean).length

  return (
    <div className="page-scroll pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-3xl font-black text-white">Workout</h1>
      </div>

      {/* 7-day pill selector */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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
                    ? 'bg-accent border-accent text-white'
                    : isTodayDay
                    ? 'border-accent/40 bg-accent/5 text-white'
                    : 'border-border bg-card text-white/50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{DAY_NAMES[i].slice(0,3)}</span>
                <span className="text-base font-black mt-0.5">{d.getDate()}</span>
                {log?.completed && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-accent'}`} />
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
            <p className="text-white/40 text-sm mb-4">Generate a personalized AI workout plan built around your goals, sport, and physique target.</p>
            {planGenCount >= PLAN_GEN_LIMIT ? (
              <div className="space-y-3">
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <p className="text-orange-400 font-bold text-sm">Weekly plan limit reached ({PLAN_GEN_LIMIT}/{PLAN_GEN_LIMIT})</p>
                  <p className="text-white/40 text-xs mt-0.5">Resets next week. Use the buttons below to build your plan manually.</p>
                </div>
                <button onClick={() => setShowAddExercise(true)}
                  className="w-full py-3 bg-accent rounded-2xl font-black text-white text-base active:scale-[0.98]">
                  + Add Exercises Manually
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-1 mb-3">
                  {Array.from({ length: PLAN_GEN_LIMIT }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < planGenCount ? 'bg-orange-400' : 'bg-accent'}`} />
                  ))}
                </div>
                <p className="text-white/30 text-xs mb-3">{PLAN_GEN_LIMIT - planGenCount} of {PLAN_GEN_LIMIT} generations left this week</p>
                <button
                  onClick={generatePlan}
                  disabled={generating}
                  className="w-full py-4 bg-accent rounded-2xl font-black text-white text-lg active:scale-[0.98] disabled:opacity-60"
                >
                  {generating ? 'Generating Plan…' : 'Generate My Plan'}
                </button>
              </>
            )}
          </div>

        ) : dayPlan && dayPlan.exercises.length === 0 ? (
          <>
            <RestDayCard />
            {/* Still allow adding manual exercises on rest days */}
            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full py-3 border border-dashed border-[#333] rounded-2xl text-white/40 text-sm font-semibold active:border-accent/40"
            >
              + Add Exercise Anyway
            </button>
          </>

        ) : dayPlan ? (
          <>
            {/* Day header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-black text-xl">{dayPlan.focus}</p>
                <p className="text-white/40 text-sm">
                  {completedCount}/{exercises.length} completed
                  {workoutLog?.completed ? ' · ✅ Done!' : ''}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* AI Modify button */}
                <button onClick={() => setShowAIModify(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 border border-accent/30 rounded-xl text-accent text-xs font-bold active:scale-95">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18 2v4h4"/>
                  </svg>
                  Modify
                </button>
                {/* Injury mode */}
                <button onClick={() => setShowInjury(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 text-xs font-bold active:scale-95">
                  🩹 Injured
                </button>
              </div>
            </div>

            {/* Exercise list */}
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  exercise={ex}
                  checked={!!checkedExercises[i]}
                  onCheck={() => toggleExercise(i, exercises)}
                  onDelete={() => deleteExercise(i)}
                />
              ))}
            </div>

            {/* Add exercise button */}
            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full py-3 border border-dashed border-[#333] rounded-2xl text-white/40 text-sm font-semibold active:border-accent/40 transition-all flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Exercise Manually
            </button>
          </>

        ) : (
          /* Day exists in plan but no entry — add exercises manually */
          <div className="p-6 bg-card border border-border rounded-2xl text-center">
            <p className="text-white/40 mb-4">No workout set for {selectedDayName}</p>
            <button
              onClick={() => setShowAddExercise(true)}
              className="px-6 py-3 bg-accent rounded-xl font-black text-white text-sm active:scale-95"
            >
              + Add Exercises
            </button>
          </div>
        )}

        {/* Regenerate */}
        {plan && (
          <div className="space-y-1">
            <button
              onClick={() => planGenCount < PLAN_GEN_LIMIT ? setShowConfirm(true) : null}
              disabled={planGenCount >= PLAN_GEN_LIMIT}
              className="w-full py-3 border border-border rounded-2xl text-white/40 text-sm font-semibold active:border-white/20 transition-all disabled:opacity-30"
            >
              Regenerate Full Plan
            </button>
            <p className="text-white/20 text-xs text-center">{PLAN_GEN_LIMIT - planGenCount}/{PLAN_GEN_LIMIT} AI generations left this week</p>
          </div>
        )}
      </div>

      {/* Confirm regenerate */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm">
            <p className="text-white font-black text-lg mb-2">Regenerate Plan?</p>
            <p className="text-white/40 text-sm mb-6">Your current plan will be replaced. Workout logs are kept.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-border rounded-2xl text-white font-bold">Cancel</button>
              <button onClick={generatePlan} disabled={generating}
                className="flex-1 py-3 bg-accent rounded-2xl font-black text-white disabled:opacity-60">
                {generating ? 'Generating…' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <AddExerciseModal
          onSave={addExercise}
          onClose={() => setShowAddExercise(false)}
        />
      )}

      {/* Injury Modal */}
      {showInjury && (
        <InjuryModal
          profile={activeProfile}
          dayName={selectedDayName}
          currentExercises={exercises}
          onSave={applyInjuryModification}
          onClose={() => setShowInjury(false)}
        />
      )}

      {/* AI Modify Modal */}
      {showAIModify && (
        <AIModifyModal
          profile={activeProfile}
          dayName={selectedDayName}
          currentExercises={exercises}
          onSave={applyAIModification}
          onClose={() => setShowAIModify(false)}
        />
      )}
    </div>
  )
}
