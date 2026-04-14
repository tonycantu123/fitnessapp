import { useState } from 'react'
import { getProfiles } from '../utils/storage'
import PinModal from './PinModal'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#e8f54e', '#f54e4e', '#4ef5a0', '#4eb5f5', '#f5a04e', '#c44ef5']

export default function ProfileSelect({ onSelect, onAddProfile }) {
  const [profiles] = useState(() => getProfiles())
  const [pinTarget, setPinTarget] = useState(null)

  function handleTap(profile) {
    if (profile.pin) {
      setPinTarget(profile)
    } else {
      onSelect(profile)
    }
  }

  async function checkPin(entered) {
    if (entered === pinTarget.pin) {
      onSelect(pinTarget)
      return true
    }
    return false
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col safe-top">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-5xl font-black text-accent tracking-widest">FORGED</h1>
        <p className="text-white/50 text-sm mt-1 font-medium">Who's training today?</p>
      </div>

      {/* Profile cards */}
      <div className="flex-1 px-4 space-y-3 overflow-y-auto pb-6">
        {profiles.map((profile, idx) => {
          const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
          return (
            <button
              key={profile.id}
              onClick={() => handleTap(profile)}
              className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl active:border-accent/50 transition-all text-left"
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                style={{ background: color + '22', border: `2px solid ${color}`, color }}
              >
                {initials(profile.name)}
              </div>
              {/* Info */}
              <div className="flex-1">
                <p className="text-white font-bold text-lg leading-tight">{profile.name}</p>
                <p className="text-white/40 text-sm capitalize mt-0.5">
                  {profile.goal || 'No goal set'}{profile.sport ? ` · ${profile.sport}` : ''}
                </p>
              </div>
              {/* PIN indicator */}
              {profile.pin && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className="w-5 h-5 shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              <svg viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" className="w-5 h-5 shrink-0">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )
        })}

        {/* Add Profile */}
        <button
          onClick={onAddProfile}
          className="w-full flex items-center gap-4 p-4 border border-dashed border-[#333] rounded-2xl active:border-accent/50 transition-all"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#1a1a1a] border border-[#333]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className="w-6 h-6">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="text-white/40 font-semibold">Add Profile</span>
        </button>
      </div>

      {pinTarget && (
        <PinModal
          profileName={pinTarget.name}
          onSuccess={checkPin}
          onCancel={() => setPinTarget(null)}
        />
      )}
    </div>
  )
}
