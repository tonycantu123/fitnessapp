import { useState, useRef, useEffect } from 'react'
import { useApp } from '../App'
import { getMacroLog, getWorkoutLog, todayStr } from '../utils/storage'
import { calcTDEE } from '../utils/tdee'
import { callClaude } from '../utils/api'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const todayDay = DAY_NAMES[new Date().getDay()]

const STARTERS = [
  "What should I eat to hit my protein today?",
  "Modify today's workout for me — I want more explosiveness",
  "What does the research say about training for my goal?",
  "What's a good pre-workout meal for my goal?",
]

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1a] rounded-2xl rounded-bl-sm w-fit">
      <div className="w-2 h-2 rounded-full bg-white/40 dot-1" />
      <div className="w-2 h-2 rounded-full bg-white/40 dot-2" />
      <div className="w-2 h-2 rounded-full bg-white/40 dot-3" />
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-accent text-black font-semibold rounded-br-sm'
            : 'bg-[#1a1a1a] text-white rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

export default function Assistant() {
  const { activeProfile } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Build system prompt with full context
  function buildSystemPrompt() {
    const p = activeProfile
    const targets = calcTDEE(p)
    const macroLog = getMacroLog(p.id, todayStr())
    const workoutLog = getWorkoutLog(p.id, todayStr())
    const todayPlan = p.workoutPlan?.[todayDay]

    const eaten = macroLog.items.reduce(
      (a, i) => ({ cal: a.cal + (i.calories||0), pro: a.pro + (i.protein||0) }),
      { cal: 0, pro: 0 }
    )

    return `You are FORGE, an elite AI fitness coach inside the FORGED app. You are direct, motivating, and concise — under 150 words unless a detailed explanation is needed. No fluff. Talk like a knowledgeable coach who respects the user's time.

ATHLETE PROFILE:
- Name: ${p.name}
- Goal: ${p.goal}
- Physique target: ${p.physiqueGoal || 'not set'}
- Sport: ${p.sport || 'none'}
- Goal description: ${p.goalDescription || 'not set'}
- Fitness level: ${p.fitnessLevel}
- Has gym: ${p.hasGym}
- Age: ${p.age}, Gender: ${p.gender}, Weight: ${p.weight} lbs

TODAY'S WORKOUT (${todayDay}):
${todayPlan
  ? `Focus: ${todayPlan.focus}\nExercises: ${todayPlan.exercises?.map(e => `${e.name} ${e.sets}x${e.reps}`).join(', ') || 'none'}`
  : 'Rest day or no plan generated yet'}
${workoutLog?.completed ? 'Status: COMPLETED ✅' : 'Status: Not completed yet'}

TODAY'S NUTRITION:
- Calories eaten: ${eaten.cal} / ${targets.calories} target
- Protein eaten: ${eaten.pro}g / ${targets.protein}g target
- Foods logged: ${macroLog.items.map(i => i.name).join(', ') || 'none yet'}

Always give actionable, specific advice. Reference their actual data when relevant.

When discussing workouts, cite relevant sports science research (e.g., progressive overload, SAID principle, RPE, periodization, VO2 max, hypertrophy mechanisms). Keep citations brief but credible. If the user asks you to modify a workout, return the full updated exercise list clearly formatted so they can follow it immediately.`
  }

  async function send(text) {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')

    const userMsg = { role: 'user', content: userText }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const reply = await callClaude({
        system: buildSystemPrompt(),
        messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        maxTokens: 400,
      })
      setMessages(msgs => [...msgs, { role: 'assistant', content: reply }])
    } catch {
      setMessages(msgs => [...msgs, { role: 'assistant', content: "I'm having trouble connecting right now. Check your server connection." }])
    } finally {
      setLoading(false)
    }
  }

  const showStarters = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
            <span className="text-accent font-black text-sm">F</span>
          </div>
          <div>
            <p className="text-white font-black">FORGE</p>
            <p className="text-white/40 text-xs">Your AI coach · Always on</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {showStarters && (
          <div className="space-y-3">
            <p className="text-white/30 text-sm text-center">Ask me anything about your training and nutrition.</p>
            <div className="grid grid-cols-1 gap-2">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 bg-[#1a1a1a] border border-border rounded-2xl text-white/60 text-sm font-medium active:border-accent/40 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex justify-start">
            <LoadingDots />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0 safe-bottom">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 bg-[#1a1a1a] border border-border rounded-2xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-accent resize-none"
            placeholder="Ask FORGE anything…"
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-accent rounded-2xl flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-40 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" className="w-5 h-5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
