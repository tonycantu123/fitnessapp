import { useEffect } from 'react'
import { addCelebratedMilestone } from '../utils/storage'

const MESSAGES = {
  7:  { title: '7-Day Streak! 🔥', sub: "One week of consistency. You're building a habit." },
  30: { title: '30-Day Streak! 💪', sub: 'One month strong. Real change is happening.' },
  60: { title: '60-Day Streak! ⚡', sub: "Two months of dedication. You're forged." },
  90: { title: '90-Day Streak! 🏆', sub: 'Three months. You are the discipline.' },
}

export default function MilestoneCelebration({ days, profileId, onClose }) {
  const msg = MESSAGES[days]

  useEffect(() => {
    addCelebratedMilestone(profileId, days)
  }, [profileId, days])

  if (!msg) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#4da6ff','#ffffff','#4e9ef5','#a0d4ff'][i % 4],
              animation: `float-particle ${1.5 + Math.random()}s ease-out forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-card border border-accent/40 rounded-3xl p-8 text-center max-w-sm w-full"
        style={{ boxShadow: '0 0 60px rgba(77,166,255,0.3)' }}>

        <div className="text-7xl mb-4 animate-bounce">{days === 7 ? '🔥' : days === 30 ? '💪' : days === 60 ? '⚡' : '🏆'}</div>
        <h2 className="text-white font-black text-2xl mb-2">{msg.title}</h2>
        <p className="text-white/50 text-sm mb-2">{days}-day workout streak</p>
        <p className="text-accent font-semibold text-sm mb-8">{msg.sub}</p>

        <button
          onClick={onClose}
          className="w-full py-4 bg-accent rounded-2xl font-black text-white text-lg active:scale-[0.98]"
        >
          Keep Going 🚀
        </button>
      </div>

      <style>{`
        @keyframes float-particle {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-200px) scale(0); }
        }
      `}</style>
    </div>
  )
}
