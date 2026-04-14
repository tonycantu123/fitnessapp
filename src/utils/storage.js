// ─── Profile storage ─────────────────────────────────────────────────────────

export function getProfiles() {
  try { return JSON.parse(localStorage.getItem('forged_profiles') || '[]') }
  catch { return [] }
}

export function saveProfile(profile) {
  const profiles = getProfiles()
  const idx = profiles.findIndex(p => p.id === profile.id)
  if (idx >= 0) profiles[idx] = profile
  else profiles.push(profile)
  localStorage.setItem('forged_profiles', JSON.stringify(profiles))
}

export function deleteProfile(id) {
  const profiles = getProfiles().filter(p => p.id !== id)
  localStorage.setItem('forged_profiles', JSON.stringify(profiles))
}

export function getActiveProfileId() { return localStorage.getItem('forged_active_profile') }
export function setActiveProfileId(id) { localStorage.setItem('forged_active_profile', id) }
export function getProfileById(id) { return getProfiles().find(p => p.id === id) || null }

// ─── Workout log ─────────────────────────────────────────────────────────────

export function getWorkoutLog(profileId, dateStr) {
  try { return JSON.parse(localStorage.getItem(`forged_log_${profileId}_${dateStr}`) || 'null') }
  catch { return null }
}

export function saveWorkoutLog(profileId, dateStr, data) {
  localStorage.setItem(`forged_log_${profileId}_${dateStr}`, JSON.stringify(data))
}

// ─── Macro log ───────────────────────────────────────────────────────────────

export function getMacroLog(profileId, dateStr) {
  try { return JSON.parse(localStorage.getItem(`forged_macros_${profileId}_${dateStr}`) || '{ "items": [] }') }
  catch { return { items: [] } }
}

export function saveMacroLog(profileId, dateStr, data) {
  localStorage.setItem(`forged_macros_${profileId}_${dateStr}`, JSON.stringify(data))
}

// ─── Daily quote cache ────────────────────────────────────────────────────────

export function getDailyQuote(profileId, dateStr) {
  try {
    const raw = localStorage.getItem(`forged_quote_${profileId}_${dateStr}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveDailyQuote(profileId, dateStr, quote) {
  localStorage.setItem(`forged_quote_${profileId}_${dateStr}`, JSON.stringify(quote))
}

// ─── Daily Bible verse cache ──────────────────────────────────────────────────

export function getDailyVerse(dateStr) {
  try {
    const raw = localStorage.getItem(`forged_verse_${dateStr}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveDailyVerse(dateStr, verse) {
  localStorage.setItem(`forged_verse_${dateStr}`, JSON.stringify(verse))
}

// ─── Streaks ──────────────────────────────────────────────────────────────────

export function calcStreak(profileId) {
  const today = new Date()

  // Current streak — count back from today (today's log optional)
  let current = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dStr = d.toISOString().slice(0, 10)
    const log = getWorkoutLog(profileId, dStr)
    if (log?.completed) {
      current++
    } else if (i === 0) {
      // today not done yet — don't break streak
      continue
    } else {
      break
    }
  }

  // Longest streak — scan all 365 days oldest→newest
  let longest = 0
  let temp = 0
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dStr = d.toISOString().slice(0, 10)
    const log = getWorkoutLog(profileId, dStr)
    if (log?.completed) { temp++; longest = Math.max(longest, temp) }
    else { temp = 0 }
  }
  longest = Math.max(longest, current)

  return { currentStreak: current, longestStreak: longest }
}

// ─── Milestone tracking ───────────────────────────────────────────────────────

export function getCelebratedMilestones(profileId) {
  try { return JSON.parse(localStorage.getItem(`forged_milestones_${profileId}`) || '[]') }
  catch { return [] }
}

export function addCelebratedMilestone(profileId, days) {
  const existing = getCelebratedMilestones(profileId)
  if (!existing.includes(days)) {
    localStorage.setItem(`forged_milestones_${profileId}`, JSON.stringify([...existing, days]))
  }
}

// ─── Supplements ─────────────────────────────────────────────────────────────

export function getSupplements(profileId) {
  try { return JSON.parse(localStorage.getItem(`forged_supps_${profileId}`) || '[]') }
  catch { return [] }
}

export function saveSupplements(profileId, supplements) {
  localStorage.setItem(`forged_supps_${profileId}`, JSON.stringify(supplements))
}

export function getSupplementLog(profileId, dateStr) {
  try { return JSON.parse(localStorage.getItem(`forged_supplog_${profileId}_${dateStr}`) || '{}') }
  catch { return {} }
}

export function saveSupplementLog(profileId, dateStr, log) {
  localStorage.setItem(`forged_supplog_${profileId}_${dateStr}`, JSON.stringify(log))
}

// ─── Weekly report ───────────────────────────────────────────────────────────

export function getWeekStr(date = new Date()) {
  // Use the Sunday that started this week as the key
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay()) // back to Sunday
  return d.toISOString().slice(0, 10)
}

export function getWeeklyReport(profileId, weekStr) {
  try { return JSON.parse(localStorage.getItem(`forged_report_${profileId}_${weekStr}`) || 'null') }
  catch { return null }
}

export function saveWeeklyReport(profileId, weekStr, report) {
  localStorage.setItem(`forged_report_${profileId}_${weekStr}`, JSON.stringify(report))
}

// ─── Water log ────────────────────────────────────────────────────────────────

export function getWaterLog(profileId, dateStr) {
  try { return JSON.parse(localStorage.getItem(`forged_water_${profileId}_${dateStr}`) || '{"oz":0}') }
  catch { return { oz: 0 } }
}

export function saveWaterLog(profileId, dateStr, data) {
  localStorage.setItem(`forged_water_${profileId}_${dateStr}`, JSON.stringify(data))
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export function getFavorites(profileId) {
  try { return JSON.parse(localStorage.getItem(`forged_favs_${profileId}`) || '[]') }
  catch { return [] }
}

export function saveFavorites(profileId, foods) {
  localStorage.setItem(`forged_favs_${profileId}`, JSON.stringify(foods.slice(0, 12)))
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayStr() { return new Date().toISOString().slice(0, 10) }
export function dateStr(date) { return date.toISOString().slice(0, 10) }

export function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return dateStr(d)
  })
}

export function last30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i)); return dateStr(d)
  })
}

export function getAllLogDates(profileId) {
  const dates = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(`forged_log_${profileId}_`))
      dates.push(key.replace(`forged_log_${profileId}_`, ''))
  }
  return dates.sort()
}

export function getAllMacroDates(profileId) {
  const dates = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(`forged_macros_${profileId}_`))
      dates.push(key.replace(`forged_macros_${profileId}_`, ''))
  }
  return dates.sort()
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
