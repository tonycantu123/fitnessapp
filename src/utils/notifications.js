// Local push notifications — zero API, zero cost
// Scheduled via setTimeout each time the app opens

const SUPP_TIME_HOURS = {
  'Morning':      8,
  'Pre-workout':  11,
  'Post-workout': 13,
  'Evening':      18,
  'Night':        21,
}

export function notificationsSupported() {
  return 'Notification' in window
}

export function notificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function fireNotification(title, body) {
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/pwa-512x512.svg',
      badge: '/pwa-192x192.svg',
      silent: false,
    })
  } catch {}
}

function scheduleAt(hour, minute, title, body, collectedIds) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  const delay = target - now
  if (delay <= 60 * 1000) return // skip if less than 1 min away or already past
  const id = setTimeout(() => fireNotification(title, body), delay)
  collectedIds.push(id)
}

// Store timeout IDs in memory (cleared on re-schedule)
let _activeTimeouts = []

export function scheduleDailyNotifications({
  profile,
  macroLog,
  workoutLog,
  targets,
  supplements = [],
  suppLog = {},
}) {
  if (Notification.permission !== 'granted') return

  // Clear existing scheduled notifications
  _activeTimeouts.forEach(id => clearTimeout(id))
  _activeTimeouts = []

  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayDay = DAY_NAMES[new Date().getDay()]
  const todayPlan = profile.workoutPlan?.[todayDay]
  const isTrainingDay = todayPlan && todayPlan.exercises?.length > 0
  const alreadyDone = !!workoutLog?.completed

  const eaten = (macroLog?.items || []).reduce(
    (a, i) => ({ cal: a.cal + (i.calories || 0), pro: a.pro + (i.protein || 0) }),
    { cal: 0, pro: 0 }
  )
  const calLeft = Math.max(targets.calories - eaten.cal, 0)
  const proLeft = Math.max(targets.protein - eaten.pro, 0)

  // ─── Supplement reminders ───────────────────────────────────────────────────
  supplements.forEach(s => {
    if (suppLog[s.id]) return // already checked off
    const hour = SUPP_TIME_HOURS[s.time] ?? 9
    scheduleAt(hour, 0,
      `💊 ${s.name}`,
      `${s.time} reminder — don't forget your ${s.name}!`,
      _activeTimeouts
    )
  })

  // ─── Workout reminders ──────────────────────────────────────────────────────
  if (isTrainingDay && !alreadyDone) {
    // Morning heads-up
    scheduleAt(10, 0,
      `💪 ${todayPlan.focus}`,
      `${todayPlan.exercises.length} exercises ready for you today. Let's get it.`,
      _activeTimeouts
    )
    // Evening nudge if still not done
    scheduleAt(18, 0,
      `⚡ Workout still waiting`,
      `${todayPlan.focus} — you've got time. Don't break the streak!`,
      _activeTimeouts
    )
  } else if (isTrainingDay && alreadyDone) {
    // Celebrate completion at end of day
    scheduleAt(20, 0,
      `✅ Workout done!`,
      `${todayPlan.focus} complete. Recovery starts now — hydrate and sleep well.`,
      _activeTimeouts
    )
  }

  // ─── Macro / nutrition reminders ───────────────────────────────────────────
  if (proLeft > 15) {
    scheduleAt(18, 30,
      `🍗 ${proLeft}g protein left`,
      `You need ${proLeft}g more protein today. One more meal can close the gap!`,
      _activeTimeouts
    )
  } else if (calLeft > 300) {
    scheduleAt(18, 30,
      `🔥 ${calLeft} kcal left`,
      `You still have ${calLeft} calories to eat today. Fuel up!`,
      _activeTimeouts
    )
  } else if (proLeft <= 15 && calLeft <= 300 && eaten.cal > 0) {
    scheduleAt(18, 30,
      `✅ Macros on point`,
      `Protein: on track. Calories: on track. Solid nutrition day!`,
      _activeTimeouts
    )
  } else if (eaten.cal === 0) {
    // Nothing logged all day
    scheduleAt(12, 0,
      `📋 Log your food`,
      `Nothing tracked yet today. Open FORGED and log your meals!`,
      _activeTimeouts
    )
  }

  // ─── Late-night streak protect ──────────────────────────────────────────────
  if (isTrainingDay && !alreadyDone) {
    scheduleAt(21, 0,
      `🔥 Protect your streak`,
      `Log even a partial workout to keep your streak alive!`,
      _activeTimeouts
    )
  }
}
