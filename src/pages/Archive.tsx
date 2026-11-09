import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

function PrayerMarker({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 'currentColor' : 'var(--ink-2)'
  const fill = active ? 'currentColor' : 'none'
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
      {name === 'fajr' && (<><line x1="2" y1="18" x2="22" y2="18" /><circle cx="12" cy="10" r="3" fill={fill} /></>)}
      {name === 'dhuhr' && (<><circle cx="12" cy="12" r="6" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /></>)}
      {name === 'asr' && (<><circle cx="12" cy="12" r="6" /><line x1="4" y1="20" x2="20" y2="4" /></>)}
      {name === 'maghrib' && (<><line x1="2" y1="18" x2="22" y2="18" /><path d="M6 18a6 6 0 0 1 12 0" /></>)}
      {name === 'isha' && (<><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" fill={fill} /></>)}
    </svg>
  )
}

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

type DayRecord = { prayer_name: string, status: string, prayed_at: string | null }

export default function Archive() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const [monthRecords, setMonthRecords] = useState<Record<string, DayRecord[]>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = getFirstDayOfMonth(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  useEffect(() => {
    async function fetchMonthData() {
      if (!user) return
      setLoading(true)

      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`

      const { data, error } = await supabase
        .from('prayer_records')
        .select('prayer_date, prayer_name, status, prayed_at')
        .eq('user_id', user.id)
        .gte('prayer_date', startDate)
        .lte('prayer_date', endDate)

      if (!error && data) {
        const grouped: Record<string, DayRecord[]> = {}
        data.forEach(row => {
          if (!grouped[row.prayer_date]) grouped[row.prayer_date] = []
          grouped[row.prayer_date].push({ 
            prayer_name: row.prayer_name, 
            status: row.status, 
            prayed_at: row.prayed_at 
          })
        })
        setMonthRecords(grouped)
      }
      setLoading(false)
    }

    fetchMonthData()
  }, [user, year, month, daysInMonth])

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '--:--'
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 pt-0 pb-24 min-h-screen">
        <NavBar />

        <main className="mt-8 flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1">
            <div className="mb-8">
              <p className="kicker mb-2">ARCHIVE</p>
              <h1 className="font-display m-0 text-3xl sm:text-4xl font-normal">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h1>
              <p className="font-display text-sm italic text-[var(--ink-2)] mt-2">
                "Establish prayer at the two ends of the day and in the first hours of the night." (Quran 11:114)
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={prevMonth} className="border border-[var(--line)] rounded-lg px-3 py-1 kicker hover:bg-[var(--surface)] transition-colors">
                  PREV
                </button>
                <button onClick={nextMonth} className="border border-[var(--line)] rounded-lg px-3 py-1 kicker hover:bg-[var(--surface)] transition-colors">
                  NEXT
                </button>
              </div>
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)] rounded-xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 border-b border-[var(--line)] bg-[var(--paper)]/50">
                {daysOfWeek.map(day => (
                  <div key={day} className="py-3 text-center kicker border-r border-[var(--line)] last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-[var(--line)] bg-[var(--paper)]/30" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayData = monthRecords[dateStr]
                  const isSelected = selectedDate === dateStr
                  
                  let status = 'empty'
                  if (dayData) {
                    status = dayData.length === 5 ? 'complete' : 'partial'
                  }
                  
                  return (
                    <div 
                      key={day} 
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[80px] border-b border-r border-[var(--line)] p-2 transition-colors cursor-pointer relative group ${
                        isSelected ? 'bg-[var(--paper)] ring-2 ring-inset ring-[var(--accent)]' : 'hover:bg-[var(--paper)]'
                      }`}
                    >
                      <span className={`font-mono text-sm ${isSelected ? 'text-[var(--accent)] font-bold' : 'text-[var(--ink-2)]'}`}>{day}</span>
                      
                      {status === 'complete' && (
                        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[var(--st-on-time)]" title="All prayers logged" />
                      )}
                      {status === 'partial' && (
                        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full border border-[var(--st-late)]" title="Partially logged" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="mt-4 kicker text-right">
              {loading ? 'FETCHING ARCHIVE...' : 'FILLED CIRCLE = 5/5 LOGGED · HOLLOW CIRCLE = PARTIAL'}
            </p>
          </div>

          {selectedDate && (
            <aside className="w-full lg:w-[320px] border border-[var(--line)] bg-[var(--surface)] rounded-xl p-6 h-fit sticky top-24 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="kicker text-[var(--ink-2)] mb-1">DAILY RECORD</p>
                  <h2 className="font-display text-2xl font-normal">
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h2>
                </div>
                <button onClick={() => setSelectedDate(null)} className="kicker text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--line)]/50 px-2 py-1 rounded-md">
                  CLOSE
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {PRAYERS.map(prayer => {
                  const record = monthRecords[selectedDate]?.find(r => r.prayer_name === prayer)
                  const status = record?.status || 'empty'
                  
                  return (
                    <div key={prayer} className="flex items-center justify-between border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: status !== 'empty' ? `var(--st-${status.replace('_', '-')})` : 'var(--ink-2)' }}>
                          <PrayerMarker name={prayer} active={status !== 'empty'} />
                        </span>
                        <span className="font-display capitalize">{prayer}</span>
                      </div>
                      <div className="text-right">
                        {status === 'empty' ? (
                          <span className="kicker text-[var(--st-empty)]">MISSED</span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="kicker" style={{ color: `var(--st-${status.replace('_', '-')})` }}>
                              {status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--ink-2)]">
                              {formatTime(record?.prayed_at || null)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </aside>
          )}

        </main>
      </div>
      
      <Footer />
    </>
  )
}