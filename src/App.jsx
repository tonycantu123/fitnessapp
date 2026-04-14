import { useState, useEffect, createContext, useContext } from 'react'
import { getProfiles, getActiveProfileId, setActiveProfileId, getProfileById } from './utils/storage'
import ProfileSelect from './components/ProfileSelect'
import OnboardingFlow from './components/Onboarding/OnboardingFlow'
import BottomNav from './components/BottomNav'
import Today from './pages/Today'
import Workout from './pages/Workout'
import Macros from './pages/Macros'
import Progress from './pages/Progress'
import Assistant from './pages/Assistant'

// ─── App-wide context ─────────────────────────────────────────────────────────
export const AppContext = createContext(null)
export function useApp() { return useContext(AppContext) }

export default function App() {
  const [screen, setScreen] = useState('loading') // loading | profiles | onboarding | app
  const [activeProfile, setActiveProfile] = useState(null)
  const [tab, setTab] = useState('today')

  useEffect(() => {
    const id = getActiveProfileId()
    if (id) {
      const p = getProfileById(id)
      if (p) {
        setActiveProfile(p)
        setScreen('app')
        return
      }
    }
    const profiles = getProfiles()
    setScreen(profiles.length === 0 ? 'onboarding' : 'profiles')
  }, [])

  function handleSelectProfile(profile) {
    setActiveProfileId(profile.id)
    setActiveProfile(profile)
    setScreen('app')
  }

  function handleOnboardingComplete(profile) {
    setActiveProfileId(profile.id)
    setActiveProfile(profile)
    setScreen('app')
  }

  function handleAddProfile() {
    setScreen('onboarding')
  }

  function refreshProfile() {
    if (activeProfile) {
      const updated = getProfileById(activeProfile.id)
      if (updated) setActiveProfile(updated)
    }
  }

  function handleLogout() {
    setActiveProfileId(null)
    setActiveProfile(null)
    setScreen('profiles')
  }

  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <span className="text-4xl font-black text-accent tracking-widest">FORGED</span>
      </div>
    )
  }

  if (screen === 'profiles') {
    return (
      <ProfileSelect
        onSelect={handleSelectProfile}
        onAddProfile={handleAddProfile}
      />
    )
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onBack={getProfiles().length > 0 ? () => setScreen('profiles') : null}
      />
    )
  }

  // ─── Main app shell ───────────────────────────────────────────────────────
  const ctx = { activeProfile, refreshProfile, setTab }

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex flex-col bg-bg overflow-hidden" style={{ height: '100dvh' }}>
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="page-enter">
            {tab === 'today'    && <Today    onLogout={handleLogout} />}
            {tab === 'workout'  && <Workout  />}
            {tab === 'macros'   && <Macros   />}
            {tab === 'progress' && <Progress />}
            {tab === 'ai'       && <Assistant />}
          </div>
        </div>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </AppContext.Provider>
  )
}
