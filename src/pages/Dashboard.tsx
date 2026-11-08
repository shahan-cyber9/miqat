import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getPrayerTimes } from '../lib/al_adhan'

function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
        <path d="M4 27V5l12 14L28 5v22" />
        <line x1="2" y1="19" x2="30" y2="19" />
      </svg>
      <span className="font-display" style={{ fontSize: size * 0.85, letterSpacing: '-0.01em' }}>MIQAT</span>
    </div>
  )
}

function PrayerMarker({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 'currentColor' : 'var(--ink-2)'
  const fill = active ? 'currentColor' : 'none'

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
      {name === 'fajr' && (<><line x1="2" y1="18" x2="22" y2="18" /><circle cx="12" cy="10" r="3" fill={fill} /></>)}
      {name === 'dhuhr' && (<><circle cx="12" cy="12" r="6" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /></>)}
      {name === 'asr' && (<><circle cx="12" cy="12" r="6" /><line x1="4" y1="20" x2="20" y2="4" /></>)}
      {name === 'maghrib' && (<><line x1="2" y1="18" x2="22" y2="18" /><path d="M6 18a6 6 0 0 1 12 0" /></>)}
      {name === 'isha' && (<><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" fill={fill} /></>)}
    </svg>
  )
}

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
const STATUSES = ['on_time', 'late', 'qadha', 'missed'] as const

type PrayerRecord = { status: string, prayed_at?: string | null }
type PrayerTimes = { fajr: string, dhuhr: string, asr: string, maghrib: string, isha: string }

export default function Dashboard() {
  const { user } = useAuth()
  
  const [records, setRecords] = useState<Record<string, PrayerRecord>>({})
  const [times, setTimes] = useState<PrayerTimes | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('on_time')
  const [prayerTime, setPrayerTime] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA')

  // Fetch records AND calculate prayer times based on location
  useEffect(() => {
    async function loadData() {
      if (!user) return

      // 1. Fetch saved records
      const { data, error } = await supabase
        .from('prayer_records')
        .select('prayer_name, status, prayed_at')
        .eq('user_id', user.id)
        .eq('prayer_date', todayStr)

      if (!error && data) {
        const mappedData = data.reduce((acc, row) => {
          acc[row.prayer_name] = { status: row.status, prayed_at: row.prayed_at }
          return acc
        }, {} as Record<string, PrayerRecord>)
        setRecords(mappedData)
      }

      // 2. Fetch prayer times using Geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const fetchedTimes = await getPrayerTimes(latitude, longitude, today)
            if (fetchedTimes) setTimes(fetchedTimes)
            setLoading(false)
          },
          // Fallback if user denies location (Default: Mumbai coordinates)
          async (err) => {
            console.warn('Location denied. Using fallback coordinates.', err)
            const fallbackTimes = await getPrayerTimes(19.0760, 72.8777, today)
            if (fallbackTimes) setTimes(fallbackTimes)
            setLoading(false)
          }
        )
      } else {
        setLoading(false)
      }
    }

    loadData()
  }, [user, todayStr])

  const openModal = (prayerName: string) => {
    setSelectedPrayer(prayerName)
    const existing = records[prayerName]
    setSelectedStatus(existing?.status || 'on_time')
    
    if (existing?.prayed_at) {
      const date = new Date(existing.prayed_at)
      setPrayerTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)
    } else {
      // If empty, pre-fill with the scheduled time for that prayer
      const scheduledTime = times ? times[prayerName as keyof PrayerTimes] : '12:00'
      setPrayerTime(scheduledTime)
    }
  }

  const savePrayer = async () => {
    if (!user || !selectedPrayer) return
    setIsSaving(true)

    const dateTimeString = `${todayStr}T${prayerTime}:00`
    const isoString = new Date(dateTimeString).toISOString()

    const { error } = await supabase.from('prayer_records').upsert({ 
      user_id: user.id, 
      prayer_date: todayStr, 
      prayer_name: selectedPrayer, 
      status: selectedStatus,
      prayed_at: isoString
    }, { onConflict: 'user_id,prayer_date,prayer_name' })

    if (!error) {
      setRecords({ ...records, [selectedPrayer]: { status: selectedStatus, prayed_at: isoString } })
      setSelectedPrayer(null) 
    }
    setIsSaving(false)
  }

  const clearPrayer = async () => {
    if (!user || !selectedPrayer) return
    setIsSaving(true)
    await supabase.from('prayer_records').delete().eq('user_id', user.id).eq('prayer_date', todayStr).eq('prayer_name', selectedPrayer)
    const newRecords = { ...records }
    delete newRecords[selectedPrayer]
    setRecords(newRecords)
    setSelectedPrayer(null)
    setIsSaving(false)
  }

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return null
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-8 relative">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Wordmark />
        <div className="flex items-center gap-4">
          <span className="kicker hidden sm:block">{user?.email}</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="kicker cursor-pointer border border-[var(--line-strong)] bg-transparent px-3 py-2 text-[var(--ink)] hover:bg-[var(--surface)] transition-colors"
          >
            LOG OUT
          </button>
        </div>
      </header>

      <main className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-8">
            <p className="kicker mb-2">TODAY</p>
            <h1 className="font-display m-0 text-4xl font-normal">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h1>
          </div>

          {loading ? (
            <p className="font-mono text-sm text-[var(--ink-2)]">CALCULATING TIMES...</p>
          ) : (
            <div className="flex flex-col">
              {PRAYERS.map((prayer) => {
                const record = records[prayer]
                const status = record?.status || 'empty'
                
                // The left side shows the logged time if it exists, otherwise the scheduled time
                const displayTime = formatTime(record?.prayed_at) || (times ? times[prayer as keyof PrayerTimes] : '--:--')
                
                return (
                  <div 
                    key={prayer} 
                    onClick={() => openModal(prayer)}
                    className="group flex items-center gap-6 border-b border-[var(--line)] py-4 hover:bg-[var(--surface)] transition-colors cursor-pointer px-2 -mx-2"
                  >
                    <span className={`font-mono text-sm w-12 ${record?.prayed_at ? 'text-[var(--ink)] font-bold' : 'text-[var(--ink-2)]'}`}>
                      {displayTime}
                    </span>
                    
                    <div className="flex items-center gap-3 w-32">
                      <span style={{ color: status !== 'empty' ? `var(--st-${status.replace('_', '-')})` : 'var(--ink-2)' }}>
                        <PrayerMarker name={prayer} active={status !== 'empty'} />
                      </span>
                      <span className="font-display text-lg capitalize">{prayer}</span>
                    </div>

                    <div className="ml-auto text-right">
                      {status === 'empty' ? (
                        <span className="kicker text-[var(--st-empty)] group-hover:text-[var(--ink)] transition-colors">
                          NOT LOGGED
                        </span>
                      ) : (
                        <span className="kicker" style={{ color: `var(--st-${status.replace('_', '-')})` }}>
                          {status.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-8">
          <div>
            <p className="kicker mb-3">CONSISTENCY</p>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl">--</span>
              <span className="kicker">% THIS MONTH</span>
            </div>
          </div>

          <hr className="rule" />

          <div className="bg-[var(--surface)] p-4 border border-[var(--line)]">
            <p className="kicker mb-2">HOW TO LOG</p>
            <p className="text-sm mb-3">
              Tap any prayer to record its status and the time you prayed.
            </p>
          </div>
        </aside>
      </main>

      {/* Modal */}
      {selectedPrayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-[var(--paper)] w-full max-w-md border border-[var(--line-strong)] shadow-2xl p-6 sm:p-8">
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="kicker text-[var(--ink-2)] mb-1">LOG PRAYER</p>
                <h2 className="font-display text-3xl font-normal capitalize">{selectedPrayer}</h2>
              </div>
              <button 
                onClick={() => setSelectedPrayer(null)}
                className="kicker hover:text-[var(--ink)] text-[var(--ink-2)] transition-colors"
              >
                CANCEL
              </button>
            </div>

            <div className="mb-6">
              <label className="kicker mb-3 block">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`border p-3 text-sm font-mono uppercase tracking-wider text-left transition-colors ${
                      selectedStatus === status 
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]' 
                        : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--line-strong)]'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="kicker mb-2 block" htmlFor="time">Actual Time Prayed</label>
              <input
                id="time"
                type="time"
                value={prayerTime}
                onChange={(e) => setPrayerTime(e.target.value)}
                className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-lg font-mono text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={savePrayer}
                disabled={isSaving}
                className="w-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-4 font-mono uppercase tracking-widest text-sm text-[var(--accent-ink)] transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-50"
              >
                {isSaving ? 'SAVING...' : 'SAVE RECORD'}
              </button>
              
              {records[selectedPrayer] && (
                <button
                  onClick={clearPrayer}
                  disabled={isSaving}
                  className="w-full border border-transparent px-4 py-3 font-mono uppercase tracking-widest text-xs text-[var(--st-missed)] hover:bg-[var(--st-missed)]/10 transition-colors disabled:opacity-50"
                >
                  CLEAR RECORD
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}