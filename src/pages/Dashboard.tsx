import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getPrayerTimes } from '../lib/al_adhan'
import NavBar from '../components/NavBar'

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
  const [consistency, setConsistency] = useState<number | null>(null)
  
  const [returnAyah, setReturnAyah] = useState<{ arabic: string, english: string, reference: string } | null>(null)

  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('on_time')
  const [prayerTime, setPrayerTime] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA')
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA')

  const getHighlightedPrayer = () => {
    if (!times) return null
    const currentTime = today.getHours() * 60 + today.getMinutes()
    
    const timeMap: Record<string, number> = {}
    PRAYERS.forEach(p => {
      const [h, m] = times[p].split(':').map(Number)
      timeMap[p] = h * 60 + m
    })

    let currentWindow = 'isha'
    if (currentTime < timeMap.fajr) currentWindow = 'isha'
    else if (currentTime < timeMap.dhuhr) currentWindow = 'fajr'
    else if (currentTime < timeMap.asr) currentWindow = 'dhuhr'
    else if (currentTime < timeMap.maghrib) currentWindow = 'asr'
    else if (currentTime < timeMap.isha) currentWindow = 'maghrib'

    if (records[currentWindow]?.status) {
      const currentIndex = PRAYERS.indexOf(currentWindow as any)
      for (let i = currentIndex + 1; i < PRAYERS.length; i++) {
        if (!records[PRAYERS[i]]?.status) return PRAYERS[i]
      }
      return 'fajr'
    }

    return currentWindow
  }

  const highlightedPrayer = getHighlightedPrayer()

  useEffect(() => {
    async function loadData() {
      if (!user) return

      const { data: prefs } = await supabase.from('prayer_preferences').select('*').eq('user_id', user.id).single()
      const method = prefs?.calculation_method || 1
      const school = prefs?.asr_school || 0
      const offsets = prefs || { fajr_offset: 0, dhuhr_offset: 0, asr_offset: 0, maghrib_offset: 0, isha_offset: 0 }

      const { data: todayData } = await supabase
        .from('prayer_records')
        .select('prayer_name, status, prayed_at')
        .eq('user_id', user.id)
        .eq('prayer_date', todayStr)

      if (todayData) {
        const mappedData = todayData.reduce((acc, row) => {
          acc[row.prayer_name] = { status: row.status, prayed_at: row.prayed_at }
          return acc
        }, {} as Record<string, PrayerRecord>)
        setRecords(mappedData)
      }

      const { data: monthData } = await supabase
        .from('prayer_records')
        .select('status')
        .eq('user_id', user.id)
        .gte('prayer_date', firstDayOfMonth)
        .lte('prayer_date', todayStr)

      if (monthData) {
        const completed = monthData.filter(r => r.status === 'on_time' || r.status === 'late').length
        const daysPassed = today.getDate() 
        const expected = daysPassed * 5
        setConsistency(Math.min(Math.round((completed / expected) * 100), 100))
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const fetched = await getPrayerTimes(latitude, longitude, today, method, school)
            
            if (fetched) {
              const adjusted = { ...fetched }
              PRAYERS.forEach(p => {
                const offset = offsets[`${p}_offset` as keyof typeof offsets] || 0
                if (offset !== 0) {
                  const [h, m] = adjusted[p].split(':').map(Number)
                  const totalMin = h * 60 + m + offset
                  const newH = Math.floor(totalMin / 60) % 24
                  const newM = totalMin % 60
                  adjusted[p] = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
                }
              })
              setTimes(adjusted)
            }
            setLoading(false)
          },
          async () => {
            const fallback = await getPrayerTimes(19.0760, 72.8777, today, method, school)
            if (fallback) setTimes(fallback)
            setLoading(false)
          }
        )
      } else setLoading(false)
    }

    loadData()
  }, [user, todayStr, firstDayOfMonth])

  useEffect(() => {
    async function checkReturnReading() {
      if (!times || !records) return
      const currentTime = today.getHours() * 60 + today.getMinutes()
      const [dhuhrH, dhuhrM] = times.dhuhr.split(':').map(Number)
      
      if (currentTime > (dhuhrH * 60 + dhuhrM) && !records['fajr']) {
        const { data } = await supabase.from('return_verses').select('*').limit(10)
        if (data && data.length > 0) {
          const randomVerse = data[Math.floor(Math.random() * data.length)]
          setReturnAyah({
            arabic: randomVerse.arabic_text || "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
            english: randomVerse.translation || "Indeed, prayer has been decreed upon the believers a decree of specified times.",
            reference: `QURAN ${randomVerse.reference}`
          })
        }
      } else {
        setReturnAyah(null)
      }
    }
    checkReturnReading()
  }, [times, records, today])

  const openModal = (prayerName: string) => {
    setSelectedPrayer(prayerName)
    const existing = records[prayerName]
    setSelectedStatus(existing?.status || 'on_time')
    
    if (existing?.prayed_at) {
      const date = new Date(existing.prayed_at)
      setPrayerTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)
    } else {
      setPrayerTime(times ? times[prayerName as keyof PrayerTimes] : '12:00')
    }
  }

  const savePrayer = async () => {
    if (!user || !selectedPrayer) return
    setIsSaving(true)
    const isoString = new Date(`${todayStr}T${prayerTime}:00`).toISOString()

    // 1. Save the prayer record
    const { error } = await supabase.from('prayer_records').upsert({ 
      user_id: user.id, prayer_date: todayStr, prayer_name: selectedPrayer, status: selectedStatus,
      prayed_at: isoString, timezone_at_log: Intl.DateTimeFormat().resolvedOptions().timeZone, calculation_method: 1
    }, { onConflict: 'user_id,prayer_date,prayer_name' })

    if (!error) {
      setRecords({ ...records, [selectedPrayer]: { status: selectedStatus, prayed_at: isoString } })

      // 2. AUTOMATIC PENALTY LOGIC
      if (selectedStatus === 'late' || selectedStatus === 'missed' || selectedStatus === 'qadha') {
        const { data: memberships } = await supabase
          .from('room_members')
          .select('room_id, rooms(penalty_late, penalty_missed, penalty_qadha)')
          .eq('user_id', user.id)

        if (memberships && memberships.length > 0) {
          const penaltiesToInsert = memberships.map((m: any) => {
            let amount = 0
            if (selectedStatus === 'late') amount = m.rooms.penalty_late
            if (selectedStatus === 'missed') amount = m.rooms.penalty_missed
            if (selectedStatus === 'qadha') amount = m.rooms.penalty_qadha

            return {
              room_id: m.room_id,
              user_id: user.id,
              amount: amount,
              reason: selectedStatus,
              prayer_date: todayStr
            }
          })

          await supabase.from('room_penalties').insert(penaltiesToInsert)
        }
      }

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
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatScheduledTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-8 pb-24 relative">
      <NavBar />

      <main className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-8">
            <p className="kicker mb-2">TODAY</p>
            <h1 className="font-display m-0 text-4xl font-normal">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h1>
          </div>

          {returnAyah && (
            <div className="mb-8 p-6 border border-[var(--line)] bg-[var(--surface)] relative shadow-sm border-l-2 border-l-[var(--st-late)]">
              <div className="absolute -top-3 left-4 bg-[var(--surface)] px-2">
                <span className="kicker text-[var(--st-late)] text-[10px]">A GENTLE REMINDER</span>
              </div>
              <p className="font-arabic text-xl text-right text-[var(--ink)] leading-relaxed mb-3" dir="rtl">
                {returnAyah.arabic}
              </p>
              <p className="font-display text-base italic text-[var(--ink-2)]">
                "{returnAyah.english}"
              </p>
              <p className="kicker text-[var(--ink-2)] mt-2 text-right">{returnAyah.reference}</p>
            </div>
          )}

          {loading ? (
            <p className="font-mono text-sm text-[var(--ink-2)]">CALCULATING TIMES...</p>
          ) : (
            <div className="flex flex-col">
              {PRAYERS.map((prayer) => {
                const record = records[prayer]
                const status = record?.status || 'empty'
                const displayTime = formatTime(record?.prayed_at) || (times ? formatScheduledTime(times[prayer as keyof PrayerTimes]) : '--:--')
                
                const isUpNext = prayer === highlightedPrayer && status === 'empty'
                
                return (
                  <div 
                    key={prayer} 
                    onClick={() => openModal(prayer)}
                    className={`group flex items-center gap-6 border-b border-[var(--line)] py-4 transition-colors cursor-pointer px-2 -mx-2 ${
                      isUpNext ? 'bg-[var(--surface)] border-l-2 border-l-[var(--accent)] border-b-[var(--line)]' : 'hover:bg-[var(--surface)] border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className={`font-mono text-sm w-24 ${record?.prayed_at ? 'text-[var(--ink)] font-bold' : isUpNext ? 'text-[var(--accent)] font-bold' : 'text-[var(--ink-2)]'}`}>
                      {displayTime}
                    </span>
                    
                    <div className="flex items-center gap-3 w-32">
                      <span style={{ color: status !== 'empty' ? `var(--st-${status.replace('_', '-')})` : isUpNext ? 'var(--accent)' : 'var(--ink-2)' }}>
                        <PrayerMarker name={prayer} active={status !== 'empty' || isUpNext} />
                      </span>
                      <span className={`font-display text-lg capitalize ${isUpNext ? 'font-medium' : ''}`}>{prayer}</span>
                    </div>

                    <div className="ml-auto text-right">
                      {status === 'empty' ? (
                        <span className={`kicker ${isUpNext ? 'text-[var(--accent)]' : 'text-[var(--st-empty)] group-hover:text-[var(--ink)]'}`}>
                          {isUpNext ? 'UP NEXT' : 'NOT LOGGED'}
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
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-mono text-4xl">{consistency !== null ? consistency : '--'}</span>
              <span className="kicker">% THIS MONTH</span>
            </div>
            <div className="w-full h-[2px] bg-[var(--line)] mt-2">
              <div className="h-full bg-[var(--st-on-time)] transition-all duration-500" style={{ width: `${consistency || 0}%` }} />
            </div>
          </div>
          <hr className="rule" />
        </aside>
      </main>

      {selectedPrayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-[var(--paper)] w-full max-w-md border border-[var(--line-strong)] shadow-2xl p-6 sm:p-8">
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="kicker text-[var(--ink-2)] mb-1">LOG PRAYER</p>
                <h2 className="font-display text-3xl font-normal capitalize">{selectedPrayer}</h2>
              </div>
              <button onClick={() => setSelectedPrayer(null)} className="kicker hover:text-[var(--ink)] text-[var(--ink-2)]">CANCEL</button>
            </div>

            <div className="mb-6">
              <label className="kicker mb-3 block">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`border p-3 text-sm font-mono uppercase tracking-wider text-left transition-colors ${
                      selectedStatus === status ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]' : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--line-strong)]'
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
                id="time" type="time" value={prayerTime} onChange={(e) => setPrayerTime(e.target.value)}
                className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-lg font-mono text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={savePrayer} disabled={isSaving} className="w-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-4 font-mono uppercase tracking-widest text-sm text-[var(--accent-ink)] hover:opacity-90 disabled:opacity-50">
                {isSaving ? 'SAVING...' : 'SAVE RECORD'}
              </button>
              {records[selectedPrayer] && (
                <button onClick={clearPrayer} disabled={isSaving} className="w-full border border-transparent px-4 py-3 font-mono uppercase tracking-widest text-xs text-[var(--st-missed)] hover:bg-[var(--st-missed)]/10 disabled:opacity-50">
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