import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getPrayerTimes } from '../lib/al_adhan'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

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

type PrayerRecord = { status: string, prayed_at?: string | null, photo_path?: string | null }
type PrayerTimes = { fajr: string, dhuhr: string, asr: string, maghrib: string, isha: string }

export default function Dashboard() {
  const { user } = useAuth()
  
  const [records, setRecords] = useState<Record<string, PrayerRecord>>({})
  const [times, setTimes] = useState<PrayerTimes | null>(null)
  const [loading, setLoading] = useState(true)
  const [consistency, setConsistency] = useState<number | null>(null)
  
  const [weekData, setWeekData] = useState<Record<string, Record<string, string>>>({})
  const [reflection, setReflection] = useState('')
  const [savedReflection, setSavedReflection] = useState<string | null>(null)
  const [reflectionWindow, setReflectionWindow] = useState('fajr')
  
  const [returnAyah, setReturnAyah] = useState<{ arabic: string, english: string, reference: string } | null>(null)

  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('on_time')
  const [prayerTime, setPrayerTime] = useState<string>('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA')
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA')

  const getHighlightedPrayer = () => {
    for (let i = 0; i < PRAYERS.length; i++) {
      if (!records[PRAYERS[i]]?.status) {
        return PRAYERS[i]
      }
    }
    return 'fajr'
  }

  const highlightedPrayer = getHighlightedPrayer()

  useEffect(() => {
    if (highlightedPrayer) setReflectionWindow(highlightedPrayer)
  }, [highlightedPrayer])

  useEffect(() => {
    async function loadReflection() {
      if (!user || !reflectionWindow) return
      const { data } = await supabase
        .from('reflections')
        .select('body')
        .eq('user_id', user.id)
        .eq('reflection_date', todayStr)
        .eq('prayer_window', reflectionWindow)
        .single()
      
      if (data) {
        setSavedReflection(data.body)
        setReflection('') 
      } else {
        setSavedReflection(null)
      }
    }
    loadReflection()
  }, [user, todayStr, reflectionWindow])

  useEffect(() => {
    async function loadData() {
      if (!user) return

      const { data: prefs } = await supabase.from('prayer_preferences').select('*').eq('user_id', user.id).single()
      const method = prefs?.calculation_method || 1
      const school = prefs?.asr_school || 0
      const offsets = prefs || { fajr_offset: 0, dhuhr_offset: 0, asr_offset: 0, maghrib_offset: 0, isha_offset: 0 }

      const { data: todayData } = await supabase
        .from('prayer_records')
        .select('prayer_name, status, prayed_at, photo_path')
        .eq('user_id', user.id)
        .eq('prayer_date', todayStr)

      if (todayData) {
        const mappedData = todayData.reduce((acc, row) => {
          acc[row.prayer_name] = { status: row.status, prayed_at: row.prayed_at, photo_path: row.photo_path }
          return acc
        }, {} as Record<string, PrayerRecord>)
        setRecords(mappedData)
      }

      const { data: monthData } = await supabase
        .from('prayer_records')
        .select('status, prayer_date, prayer_name')
        .eq('user_id', user.id)
        .gte('prayer_date', firstDayOfMonth)
        .lte('prayer_date', todayStr)

      if (monthData) {
        const completed = monthData.filter(r => r.status === 'on_time' || r.status === 'late').length
        const daysPassed = today.getDate() 
        const expected = daysPassed * 5
        setConsistency(Math.min(Math.round((completed / expected) * 100), 100))

        const weekGrid: Record<string, Record<string, string>> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const dStr = d.toLocaleDateString('en-CA')
          weekGrid[dStr] = {}
          
          const dayRecords = monthData.filter(r => r.prayer_date === dStr)
          dayRecords.forEach(r => {
            weekGrid[dStr][r.prayer_name] = r.status
          })
        }
        setWeekData(weekGrid)
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

  const saveReflection = async () => {
    if (!user || !reflection) return
    await supabase.from('reflections').upsert({
      user_id: user.id,
      reflection_date: todayStr,
      prayer_window: reflectionWindow,
      body: reflection
    }, { onConflict: 'user_id,reflection_date,prayer_window' })
    
    setSavedReflection(reflection)
    setReflection('')
  }

  const openModal = (prayerName: string) => {
    setSelectedPrayer(prayerName)
    const existing = records[prayerName]
    setSelectedStatus(existing?.status || 'on_time')
    setPhotoFile(null) 
    
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
    let photoPath = records[selectedPrayer]?.photo_path || null

    try {
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${user.id}/${selectedPrayer}_${todayStr}_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('prayer_photos').upload(fileName, photoFile)
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
        photoPath = fileName
      }

      const { error } = await supabase.from('prayer_records').upsert({ 
        user_id: user.id, prayer_date: todayStr, prayer_name: selectedPrayer, status: selectedStatus,
        prayed_at: isoString, timezone_at_log: Intl.DateTimeFormat().resolvedOptions().timeZone, 
        calculation_method: 1, photo_path: photoPath
      }, { onConflict: 'user_id,prayer_date,prayer_name' })

      if (error) throw new Error(`Database save failed: ${error.message}`)

      setRecords({ ...records, [selectedPrayer]: { status: selectedStatus, prayed_at: isoString, photo_path: photoPath } })

      if (selectedStatus === 'late' || selectedStatus === 'missed' || selectedStatus === 'qadha') {
        const { data: memberships } = await supabase.from('room_members').select('room_id, rooms(penalty_late, penalty_missed, penalty_qadha)').eq('user_id', user.id)
        if (memberships && memberships.length > 0) {
          const penaltiesToInsert = memberships.map((m: any) => {
            let amount = 0
            if (selectedStatus === 'late') amount = m.rooms.penalty_late
            if (selectedStatus === 'missed') amount = m.rooms.penalty_missed
            if (selectedStatus === 'qadha') amount = m.rooms.penalty_qadha
            return { room_id: m.room_id, user_id: user.id, amount, reason: selectedStatus, prayer_date: todayStr }
          })
          await supabase.from('room_penalties').insert(penaltiesToInsert)
        }
      }

      setSelectedPrayer(null) 
    } catch (err: any) {
      alert(err.message || "Something went wrong.")
    } finally {
      setIsSaving(false)
    }
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

  const getReflectionPrompt = (window: string) => {
    switch(window) {
      case 'fajr': return "What do you intend to carry into today?"
      case 'dhuhr': return "What has steadied you so far?"
      case 'asr': return "Where did you notice a small mercy?"
      case 'maghrib': return "What would you like to return to tonight?"
      case 'isha': return "One sentence to close the day."
      default: return "A moment to reflect."
    }
  }

  return (
    <>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 pt-0 pb-24 relative min-h-screen">
        <NavBar />

        <main className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
          <section>
            <div className="mb-8">
              <p className="kicker mb-2">TODAY</p>
              <h1 className="font-display m-0 text-3xl sm:text-4xl font-normal">
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h1>
              <p className="font-display text-sm italic text-[var(--ink-2)] mt-2">
                "Indeed, prayer prohibits immorality and wrongdoing." (Quran 29:45)
              </p>
            </div>

            {returnAyah && (
              <div className="mb-8 p-5 sm:p-6 border border-[var(--line)] bg-[var(--surface)] relative shadow-sm rounded-xl border-l-4 border-l-[var(--st-late)]">
                <div className="absolute -top-3 left-4 bg-[var(--surface)] px-2">
                  <span className="kicker text-[var(--st-late)] text-[10px]">A GENTLE REMINDER</span>
                </div>
                <p className="font-arabic text-lg sm:text-xl text-right text-[var(--ink)] leading-relaxed mb-3" dir="rtl">
                  {returnAyah.arabic}
                </p>
                <p className="font-display text-sm sm:text-base italic text-[var(--ink-2)]">
                  "{returnAyah.english}"
                </p>
                <p className="kicker text-[var(--ink-2)] mt-2 text-right">{returnAyah.reference}</p>
              </div>
            )}

            {loading ? (
              <p className="font-mono text-sm text-[var(--ink-2)]">CALCULATING TIMES...</p>
            ) : (
              <div className="flex flex-col gap-2.5 mb-12">
                {PRAYERS.map((prayer) => {
                  const record = records[prayer]
                  const status = record?.status || 'empty'
                  const displayTime = formatTime(record?.prayed_at) || (times ? formatScheduledTime(times[prayer as keyof PrayerTimes]) : '--:--')
                  const isUpNext = prayer === highlightedPrayer && status === 'empty'
                  
                  return (
                    <div 
                      key={prayer} 
                      onClick={() => openModal(prayer)}
                      className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 border border-[var(--line)] rounded-xl py-4 px-4 sm:px-5 transition-all cursor-pointer ${
                        isUpNext ? 'bg-[var(--accent)]/5 border-[var(--accent)]/30 shadow-sm' : 'bg-[var(--surface)] hover:bg-[var(--line)]/20 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center sm:hidden">
                        <span className={`font-mono text-sm ${record?.prayed_at ? 'text-[var(--ink)] font-bold' : isUpNext ? 'text-[var(--accent)] font-bold' : 'text-[var(--ink-2)]'}`}>
                          {displayTime}
                        </span>
                        <span className={`kicker text-[10px] ${isUpNext ? 'text-[var(--accent)]' : status === 'empty' ? 'text-[var(--st-empty)]' : ''}`} style={status !== 'empty' && !isUpNext ? { color: `var(--st-${status.replace('_', '-')})` } : {}}>
                          {isUpNext ? 'UP NEXT' : status === 'empty' ? 'NOT LOGGED' : status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-32">
                        <span style={{ color: status !== 'empty' ? `var(--st-${status.replace('_', '-')})` : isUpNext ? 'var(--accent)' : 'var(--ink-2)' }}>
                          <PrayerMarker name={prayer} active={status !== 'empty' || isUpNext} />
                        </span>
                        <span className={`font-display text-lg capitalize ${isUpNext ? 'font-medium' : ''}`}>{prayer}</span>
                      </div>

                      <div className="hidden sm:flex ml-auto items-center gap-4 text-right">
                        <span className={`font-mono text-sm ${record?.prayed_at ? 'text-[var(--ink)] font-bold' : isUpNext ? 'text-[var(--accent)] font-bold' : 'text-[var(--ink-2)]'}`}>
                          {displayTime}
                        </span>
                        {record?.photo_path && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--st-on-time)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        )}
                        <span className={`kicker w-24 text-right ${isUpNext ? 'text-[var(--accent)]' : status === 'empty' ? 'text-[var(--st-empty)]' : ''}`} style={status !== 'empty' && !isUpNext ? { color: `var(--st-${status.replace('_', '-')})` } : {}}>
                          {isUpNext ? 'UP NEXT' : status === 'empty' ? 'NOT LOGGED' : status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* WEEK LEDGER WITH LEGEND */}
            {!loading && (
              <div className="border border-[var(--line)] bg-[var(--surface)] rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <p className="kicker">THE WEEK IN REVIEW</p>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-[2px] bg-[var(--st-on-time)]"></div><span className="text-[9px] font-mono text-[var(--ink-2)]">On Time</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-[2px] bg-[var(--st-late)]/60"></div><span className="text-[9px] font-mono text-[var(--ink-2)]">Late</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-[2px] bg-[var(--st-qadha)]/40"></div><span className="text-[9px] font-mono text-[var(--ink-2)]">Qadha</span></div>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex flex-col justify-between mr-4 pb-6 pt-1">
                    {PRAYERS.map(p => <span key={p} className="font-mono text-[9px] uppercase text-[var(--ink-2)] h-6 flex items-center">{p}</span>)}
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    {Object.keys(weekData).map(date => (
                      <div key={date} className="flex flex-col gap-2 items-center">
                        <div className="flex flex-col gap-2 w-full">
                          {PRAYERS.map(prayer => {
                            const status = weekData[date][prayer]
                            let bgClass = "border border-[var(--line)] bg-transparent"
                            if (status === 'on_time') bgClass = "bg-[var(--st-on-time)]"
                            if (status === 'late') bgClass = "bg-[var(--st-late)]/60"
                            if (status === 'qadha') bgClass = "bg-[var(--st-qadha)]/40"
                            if (status === 'missed') bgClass = "bg-[var(--st-missed)]/30"
                            
                            const isToday = date === todayStr
                            
                            return (
                              <div 
                                key={prayer} 
                                className={`w-full aspect-square rounded-[4px] ${bgClass} ${isToday ? 'ring-1 ring-[var(--accent)] ring-offset-1' : ''}`} 
                              />
                            )
                          })}
                        </div>
                        <span className="font-mono text-[9px] text-[var(--ink-2)] mt-1">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-6">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 shadow-sm">
              <p className="kicker mb-3">CONSISTENCY</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-mono text-4xl">{consistency !== null ? consistency : '--'}</span>
                <span className="kicker">% THIS MONTH</span>
              </div>
              <div className="w-full h-2 bg-[var(--line)] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[var(--st-on-time)] transition-all duration-500 rounded-full" style={{ width: `${consistency || 0}%` }} />
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 shadow-sm">
              <p className="kicker mb-4">A MOMENT TO REFLECT</p>
              <p className="font-display text-lg italic text-[var(--ink)] leading-snug mb-4">
                "{getReflectionPrompt(reflectionWindow)}"
              </p>
              
              {savedReflection ? (
                <div className="border-l-2 border-[var(--accent)] pl-3">
                  <p className="text-sm text-[var(--ink-2)]">{savedReflection}</p>
                  <button onClick={() => { setSavedReflection(null); setReflection(savedReflection) }} className="kicker text-[10px] mt-2 text-[var(--accent)] hover:underline">EDIT</button>
                </div>
              ) : (
                <div>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Write a sentence..."
                    maxLength={140}
                    className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--accent)] focus:outline-none py-2 text-sm text-[var(--ink)] resize-none placeholder:text-[var(--ink-2)]/50"
                    rows={2}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="kicker text-[10px] text-[var(--ink-2)]">{reflection.length}/140</span>
                    <button onClick={saveReflection} className="kicker text-[10px] text-[var(--accent)] hover:underline">SAVE PRIVATELY</button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </main>

        {/* MODAL */}
        {selectedPrayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 overflow-y-auto">
            <div className="bg-[var(--surface)] w-full max-w-md border border-[var(--line)] rounded-2xl shadow-2xl p-6 sm:p-8 my-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="kicker text-[var(--ink-2)] mb-1">LOG PRAYER</p>
                  <h2 className="font-display text-3xl font-normal capitalize">{selectedPrayer}</h2>
                </div>
                <button onClick={() => setSelectedPrayer(null)} className="kicker hover:text-[var(--ink)] text-[var(--ink-2)] bg-[var(--line)]/50 px-3 py-1 rounded-lg">CANCEL</button>
              </div>

              <div className="mb-5">
                <label className="kicker mb-2 block">Status</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`border rounded-xl p-3 text-sm font-mono uppercase tracking-wider text-left transition-all ${
                        selectedStatus === status ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-md' : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--line-strong)]'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="kicker mb-2 block" htmlFor="time">Actual Time Prayed</label>
                <input
                  id="time" type="time" value={prayerTime} onChange={(e) => setPrayerTime(e.target.value)}
                  className="w-full border border-[var(--line)] rounded-xl bg-[var(--paper)] px-4 py-3 text-lg font-mono text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div className="mb-8">
                <label className="kicker mb-1 block">Attach Photo (Optional)</label>
                <p className="text-[11px] text-[var(--ink-2)] mb-2">Add a photo as proof for your accountability room.</p>
                
                {records[selectedPrayer]?.photo_path && (
                  <div className="mb-3 p-3 bg-[var(--st-on-time)]/10 border border-[var(--st-on-time)]/20 rounded-lg flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--st-on-time)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    <p className="text-[11px] text-[var(--st-on-time)] font-medium">A photo is already saved. Uploading a new one will replace it.</p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full border border-[var(--line)] rounded-xl bg-[var(--paper)] px-4 py-2 text-sm text-[var(--ink-2)] outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-mono file:bg-[var(--line)] file:text-[var(--ink)] hover:file:bg-[var(--line-strong)] transition-all cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={savePrayer} disabled={isSaving} className="w-full border border-[var(--accent)] bg-[var(--accent)] rounded-xl px-4 py-4 font-mono uppercase tracking-widest text-sm text-[var(--accent-ink)] shadow-md hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-50 transition-all">
                  {isSaving ? 'SAVING...' : 'SAVE RECORD'}
                </button>
                {records[selectedPrayer] && (
                  <button onClick={clearPrayer} disabled={isSaving} className="w-full border border-transparent rounded-xl px-4 py-3 font-mono uppercase tracking-widest text-xs text-[var(--st-missed)] hover:bg-[var(--st-missed)]/10 disabled:opacity-50 transition-colors">
                    CLEAR RECORD
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </>
  )
}