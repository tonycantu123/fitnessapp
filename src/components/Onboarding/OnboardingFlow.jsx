import { useState } from 'react'
import { saveProfile, generateId } from '../../utils/storage'

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ data, set }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white/60 text-sm font-semibold mb-2 uppercase tracking-wider">Your Name</label>
        <input
          className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-lg font-semibold focus:outline-none focus:border-accent"
          placeholder="e.g. Marcus"
          value={data.name || ''}
          onChange={e => set({ name: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-white/60 text-sm font-semibold mb-2 uppercase tracking-wider">4-Digit PIN (optional)</label>
        <input
          className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-lg font-semibold tracking-[0.5em] focus:outline-none focus:border-accent"
          placeholder="••••"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={data.pin || ''}
          onChange={e => set({ pin: e.target.value.replace(/\D/g, '').slice(0,4) })}
        />
        <p className="text-white/30 text-xs mt-2">Leave blank to skip PIN protection</p>
      </div>
    </div>
  )
}

function Step2({ data, set }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white/60 text-sm font-semibold mb-2 uppercase tracking-wider">Age</label>
          <input
            className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-lg font-semibold focus:outline-none focus:border-accent"
            placeholder="25"
            type="number"
            inputMode="numeric"
            value={data.age || ''}
            onChange={e => set({ age: parseInt(e.target.value) || '' })}
          />
        </div>
        <div>
          <label className="block text-white/60 text-sm font-semibold mb-2 uppercase tracking-wider">Gender</label>
          <select
            className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-base font-semibold focus:outline-none focus:border-accent"
            value={data.gender || ''}
            onChange={e => set({ gender: e.target.value })}
          >
            <option value="" disabled>Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-white/60 text-sm font-semibold mb-2 uppercase tracking-wider">Weight (lbs)</label>
        <input
          className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-lg font-semibold focus:outline-none focus:border-accent"
          placeholder="170"
          type="number"
          inputMode="numeric"
          value={data.weight || ''}
          onChange={e => set({ weight: parseInt(e.target.value) || '' })}
        />
      </div>
      <div>
        <label className="block text-white/60 text-sm font-semibold mb-2 uppercase tracking-wider">Height</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-lg font-semibold focus:outline-none focus:border-accent pr-10"
              placeholder="5"
              type="number"
              inputMode="numeric"
              value={data.height?.ft ?? ''}
              onChange={e => set({ height: { ...(data.height || {}), ft: parseInt(e.target.value) || '' } })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">ft</span>
          </div>
          <div className="relative">
            <input
              className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-lg font-semibold focus:outline-none focus:border-accent pr-10"
              placeholder="10"
              type="number"
              inputMode="numeric"
              value={data.height?.in ?? ''}
              onChange={e => set({ height: { ...(data.height || {}), in: parseInt(e.target.value) || '' } })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">in</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const GOALS = [
  { id: 'lose fat',              label: 'Lose Fat',              emoji: '🔥' },
  { id: 'build muscle',         label: 'Build Muscle',          emoji: '💪' },
  { id: 'maintain',             label: 'Maintain',              emoji: '⚖️' },
  { id: 'athletic performance', label: 'Athletic Performance',  emoji: '⚡' },
]

function Step3({ data, set }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GOALS.map(g => (
        <button
          key={g.id}
          onClick={() => set({ goal: g.id })}
          className={`p-5 rounded-2xl border-2 flex flex-col items-start gap-2 transition-all active:scale-95 ${
            data.goal === g.id
              ? 'border-accent bg-accent/10'
              : 'border-border bg-card'
          }`}
        >
          <span className="text-3xl">{g.emoji}</span>
          <span className={`font-bold text-base leading-tight ${data.goal === g.id ? 'text-accent' : 'text-white'}`}>
            {g.label}
          </span>
        </button>
      ))}
    </div>
  )
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary',  desc: 'Little to no exercise' },
  { id: 'light',     label: 'Light',       desc: '1–3 days/week' },
  { id: 'moderate',  label: 'Moderate',    desc: '3–5 days/week' },
  { id: 'active',    label: 'Active',      desc: '6–7 days/week' },
]

function Step4({ data, set }) {
  return (
    <div className="space-y-3">
      {ACTIVITY_LEVELS.map(a => (
        <button
          key={a.id}
          onClick={() => set({ activityLevel: a.id })}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] text-left ${
            data.activityLevel === a.id
              ? 'border-accent bg-accent/10'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex-1">
            <p className={`font-bold text-base ${data.activityLevel === a.id ? 'text-accent' : 'text-white'}`}>{a.label}</p>
            <p className="text-white/40 text-sm">{a.desc}</p>
          </div>
          {data.activityLevel === a.id && (
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" className="w-3.5 h-3.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced']

function Step5({ data, set }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white/60 text-sm font-semibold mb-3 uppercase tracking-wider">Fitness Level</label>
        <div className="grid grid-cols-3 gap-3">
          {FITNESS_LEVELS.map(l => (
            <button
              key={l}
              onClick={() => set({ fitnessLevel: l })}
              className={`py-4 rounded-2xl border-2 font-bold capitalize text-sm transition-all active:scale-95 ${
                data.fitnessLevel === l
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-card text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-white/60 text-sm font-semibold mb-3 uppercase tracking-wider">Gym Access?</label>
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map(v => (
            <button
              key={String(v)}
              onClick={() => set({ hasGym: v })}
              className={`py-4 rounded-2xl border-2 font-bold transition-all active:scale-95 ${
                data.hasGym === v
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-card text-white'
              }`}
            >
              {v ? '🏋️ Yes' : '🏠 No'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step6({ data, set }) {
  const SPORTS = ['Basketball', 'Soccer', 'Boxing', 'Golf', 'Tennis', 'MMA', 'Swimming', 'Running']
  return (
    <div className="space-y-4">
      <p className="text-white/50 text-sm">Select one or type your own. Skip if not applicable.</p>
      <div className="flex flex-wrap gap-2">
        {SPORTS.map(s => (
          <button
            key={s}
            onClick={() => set({ sport: data.sport === s ? '' : s })}
            className={`px-4 py-2 rounded-full border font-semibold text-sm transition-all active:scale-95 ${
              data.sport === s
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-white/60'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <input
        className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-base font-semibold focus:outline-none focus:border-accent mt-2"
        placeholder="Or type your sport / athletic goal..."
        value={data.sport || ''}
        onChange={e => set({ sport: e.target.value })}
      />
    </div>
  )
}

const PHYSIQUES = [
  'Lean and toned',
  'Big and muscular',
  'Athletic build',
  'Endurance focused',
  'Powerlifter',
  'Functional fitness',
]

function Step7({ data, set }) {
  return (
    <div className="space-y-4">
      <p className="text-white/50 text-sm">Tap a suggestion or describe your own.</p>
      <div className="flex flex-wrap gap-2">
        {PHYSIQUES.map(p => (
          <button
            key={p}
            onClick={() => set({ physiqueGoal: p })}
            className={`px-4 py-2 rounded-full border font-semibold text-sm transition-all active:scale-95 ${
              data.physiqueGoal === p
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-white/60'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <textarea
        className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-base font-semibold focus:outline-none focus:border-accent resize-none"
        placeholder="e.g. lean and athletic like a wide receiver..."
        rows={3}
        value={data.physiqueGoal || ''}
        onChange={e => set({ physiqueGoal: e.target.value })}
      />
    </div>
  )
}

function Step8({ data, set }) {
  return (
    <div className="space-y-3">
      <p className="text-white/50 text-sm">Tell FORGE what you're working toward. The more detail, the better your plan.</p>
      <textarea
        className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-base font-semibold focus:outline-none focus:border-accent resize-none"
        placeholder='e.g. "I want to lose 20 lbs before summer and have more energy at work..."'
        rows={6}
        value={data.goalDescription || ''}
        onChange={e => set({ goalDescription: e.target.value })}
      />
    </div>
  )
}

function Step9({ data, set }) {
  return (
    <div className="space-y-3">
      <p className="text-white/50 text-sm">What does your current routine look like? Skip if you're starting fresh.</p>
      <textarea
        className="w-full bg-[#1a1a1a] border border-border rounded-xl px-4 py-4 text-white text-base font-semibold focus:outline-none focus:border-accent resize-none"
        placeholder='e.g. "I lift 3x/week (push/pull/legs) and do cardio once a week..."'
        rows={6}
        value={data.currentRoutine || ''}
        onChange={e => set({ currentRoutine: e.target.value })}
      />
    </div>
  )
}

function Step10({ data }) {
  const items = [
    { label: 'Goal',            value: data.goal },
    { label: 'Physique target', value: data.physiqueGoal },
    { label: 'Sport',           value: data.sport || 'None' },
    { label: 'Fitness level',   value: data.fitnessLevel },
    { label: 'Gym access',      value: data.hasGym ? 'Yes' : 'No' },
    { label: 'Activity level',  value: data.activityLevel },
  ]
  return (
    <div className="space-y-4">
      <p className="text-white/50 text-sm">Here's what FORGE will use to build your personalized plan:</p>
      <div className="space-y-2">
        {items.map(item => item.value && (
          <div key={item.label} className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-white/50 text-sm font-medium">{item.label}</span>
            <span className="text-white font-bold text-sm capitalize">{item.value}</span>
          </div>
        ))}
      </div>
      {data.goalDescription && (
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl">
          <p className="text-accent/80 text-xs font-semibold uppercase tracking-wider mb-1">Your Goal</p>
          <p className="text-white text-sm">{data.goalDescription}</p>
        </div>
      )}
      <p className="text-white/40 text-sm text-center pt-2">
        Tap <span className="text-accent font-bold">Build My Plan</span> to generate your workout plan with AI.
      </p>
    </div>
  )
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: "Let's get started", subtitle: 'Create your profile', component: Step1, required: d => d.name?.trim() },
  { title: 'Your stats',        subtitle: 'Used to calculate your macros', component: Step2, required: d => d.age && d.gender && d.weight && d.height?.ft },
  { title: 'Your goal',         subtitle: "What are you training for?", component: Step3, required: d => d.goal },
  { title: 'Activity level',    subtitle: 'How active are you outside the gym?', component: Step4, required: d => d.activityLevel },
  { title: 'Fitness profile',   subtitle: 'Your experience and setup', component: Step5, required: d => d.fitnessLevel !== undefined && d.hasGym !== undefined },
  { title: 'Sport / Athletic goal', subtitle: 'Optional — skip if not applicable', component: Step6, required: () => true },
  { title: 'Physique goal',     subtitle: "What's the look you're going for?", component: Step7, required: () => true },
  { title: 'In your own words', subtitle: 'Describe your goal', component: Step8, required: () => true },
  { title: 'Current routine',   subtitle: 'What does your training look like now?', component: Step9, required: () => true },
  { title: "You're ready",      subtitle: 'Review your plan', component: Step10, required: () => true },
]

// ─── Main flow ────────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete, onBack }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})

  function merge(partial) {
    setData(d => ({ ...d, ...partial }))
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  function back() {
    if (step === 0 && onBack) onBack()
    else setStep(s => s - 1)
  }

  function finish() {
    const profile = {
      id: generateId(),
      name: data.name?.trim() || 'User',
      pin: data.pin || null,
      age: data.age,
      gender: data.gender,
      weight: data.weight,
      height: data.height,
      goal: data.goal,
      activityLevel: data.activityLevel,
      hasGym: data.hasGym,
      fitnessLevel: data.fitnessLevel,
      sport: data.sport || '',
      physiqueGoal: data.physiqueGoal || '',
      goalDescription: data.goalDescription || '',
      currentRoutine: data.currentRoutine || '',
      workoutPlan: null,
      createdAt: new Date().toISOString(),
    }
    saveProfile(profile)
    onComplete(profile)
  }

  const current = STEPS[step]
  const StepComponent = current.component
  const canProceed = current.required(data)
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-bg flex flex-col safe-top">
      {/* Top bar */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={back} className="p-2 -ml-2 text-white/50 active:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-white/40 text-xs font-bold">{step + 1}/{STEPS.length}</span>
        </div>
        <h2 className="text-2xl font-black text-white">{current.title}</h2>
        <p className="text-white/40 text-sm mt-1">{current.subtitle}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <StepComponent data={data} set={merge} />
      </div>

      {/* CTA */}
      <div className="px-4 py-4 safe-bottom">
        <button
          onClick={next}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
            canProceed
              ? 'bg-accent text-black active:scale-[0.98] accent-glow'
              : 'bg-[#1a1a1a] text-white/20 cursor-not-allowed'
          }`}
        >
          {step === STEPS.length - 1 ? 'Build My Plan' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
