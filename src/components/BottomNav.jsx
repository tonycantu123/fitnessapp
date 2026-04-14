const TABS = [
  {
    id: 'today',
    label: 'Home',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? '#4da6ff' : 'none'} stroke={active ? '#4da6ff' : '#666'} strokeWidth="2" className="w-6 h-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#4da6ff' : '#666'} strokeWidth="2" className="w-6 h-6">
        <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 8.5l2-2M20 8.5l2-2M2 15.5l2 2M20 15.5l2 2"/>
      </svg>
    ),
  },
  {
    id: 'macros',
    label: 'Macros',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#4da6ff' : '#666'} strokeWidth="2" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#4da6ff' : '#666'} strokeWidth="2" className="w-6 h-6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'ai',
    label: 'FORGE',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#4da6ff' : '#666'} strokeWidth="2" className="w-6 h-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="flex bg-card border-t border-border safe-bottom"
      style={{ minHeight: 64 }}
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-opacity active:opacity-60"
        >
          {tab.icon(active === tab.id)}
          <span
            className="text-[10px] font-bold tracking-wide"
            style={{ color: active === tab.id ? '#4da6ff' : '#666' }}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
