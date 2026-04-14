// ─── Profile storage ─────────────────────────────────────────────────────────

export function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem('forged_profiles') || '[]')
  } catch { return [] }
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

export function getActiveProfileId() {
  return localStorage.getItem('forged_active_profile')
}

export function setActiveProfileId(id) {
  localStorage.setItem('forged_active_profile', id)
}

export function getProfileById(id) {
  return getProfiles().find(p => p.id === id) || null
}

// ─── Workout log ─────────────────────────────────────────────────────────────

export function getWorkoutLog(profileId, dateStr) {
  try {
    return JSON.parse(localStorage.getItem(`forged_log_${profileId}_${dateStr}`) || 'null')
  } catch { return null }
}

export function saveWorkoutLog(profileId, dateStr, data) {
  localStorage.setItem(`forged_log_${profileId}_${dateStr}`, JSON.stringify(data))
}

// ─── Macro log ───────────────────────────────────────────────────────────────

export function getMacroLog(profileId, dateStr) {
  try {
    return JSON.parse(localStorage.getItem(`forged_macros_${profileId}_${dateStr}`) || '{ "items": [] }')
  } catch { return { items: [] } }
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function dateStr(date) {
  return date.toISOString().slice(0, 10)
}

export function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return dateStr(d)
  })
}

export function last30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return dateStr(d)
  })
}

export function getAllLogDates(profileId) {
  const dates = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(`forged_log_${profileId}_`)) {
      dates.push(key.replace(`forged_log_${profileId}_`, ''))
    }
  }
  return dates.sort()
}

export function getAllMacroDates(profileId) {
  const dates = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(`forged_macros_${profileId}_`)) {
      dates.push(key.replace(`forged_macros_${profileId}_`, ''))
    }
  }
  return dates.sort()
}

// ─── ID generator ─────────────────────────────────────────────────────────────

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
