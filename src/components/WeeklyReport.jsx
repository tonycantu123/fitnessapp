const GRADE_COLORS = {
  'A+': '#4da6ff', 'A': '#4da6ff', 'A-': '#4da6ff',
  'B+': '#4ef5a0', 'B': '#4ef5a0', 'B-': '#4ef5a0',
  'C+': '#f5e04e', 'C': '#f5e04e', 'C-': '#f5e04e',
  'D+': '#f5a04e', 'D': '#f5a04e', 'D-': '#f5a04e',
  'F':  '#f54e4e',
}

function GradeCircle({ grade, label }) {
  const color = GRADE_COLORS[grade] || '#888'
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center border-2 font-black text-xl"
        style={{ borderColor: color, color }}
      >
        {grade}
      </div>
      <span className="text-white/40 text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
  )
}

export default function WeeklyReport({ report, onClose }) {
  if (!report) return null

  const weekDate = new Date(report.weekStr)
  const weekLabel = weekDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl pb-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Weekly Report</p>
              <p className="text-white font-black text-xl">Week of {weekLabel}</p>
            </div>
            <button onClick={onClose} className="text-white/30 active:text-white p-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Grade circles */}
          <div className="flex justify-around">
            <GradeCircle grade={report.overallGrade} label="Overall" />
            <GradeCircle grade={report.workoutGrade} label="Workouts" />
            <GradeCircle grade={report.macroGrade} label="Nutrition" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Workouts', value: `${report.stats?.workoutsCompleted || 0}/7` },
              { label: 'Completion', value: `${report.stats?.workoutRate || 0}%` },
              { label: 'Avg Calories', value: report.stats?.avgCal || '—' },
              { label: 'Avg Protein', value: report.stats?.avgProtein ? `${report.stats.avgProtein}g` : '—' },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] rounded-2xl p-3 text-center">
                <p className="text-white font-black text-xl">{s.value}</p>
                <p className="text-white/40 text-xs font-bold uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          {report.summary && (
            <div className="p-4 bg-[#1a1a1a] rounded-2xl">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Summary</p>
              <p className="text-white text-sm leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Recommendation */}
          {report.recommendation && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
              <p className="text-accent text-xs font-bold uppercase tracking-wider mb-2">⚡ This Week's Focus</p>
              <p className="text-white text-sm leading-relaxed">{report.recommendation}</p>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-4 bg-accent rounded-2xl font-black text-white text-base active:scale-[0.98]">
            Let's Get It
          </button>
        </div>
      </div>
    </div>
  )
}
