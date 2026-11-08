import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

// 1. Define the default prayers
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

export default function Dashboard() {
  const { user } = useAuth()
  
  // 2. State to hold the real data from the database
  const [records, setRecords] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Get today's date in YYYY-MM-DD format (local time)
  const today = new Date().toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD

  // 3. Fetch the data from Supabase
  useEffect(() => {
    async function fetchPrayers() {
      if (!user) return

      const { data, error } = await supabase
        .from('prayer_records')
        .select('prayer_name, status')
        .eq('user_id', user.id)
        .eq('prayer_date', today)

      if (error) {
        console.error('Error fetching prayers:', error)
      } else if (data) {
        // Convert array of records to an object for easy lookup: { fajr: 'on_time', asr: 'missed' }
        const mappedData = data.reduce((acc, row) => {
          acc[row.prayer_name] = row.status
          return acc
        }, {} as Record<string, string>)
        
        setRecords(mappedData)
      }
      setLoading(false)
    }

    fetchPrayers()
  }, [user, today])

  // 4. Function to log a prayer (Upsert)
  const handleLogPrayer = async (prayerName: string) => {
    if (!user) return

    // For now, we cycle through statuses on click.
    // Later, we will make a proper modal for this.
    const currentStatus = records[prayerName] || 'empty'
    let nextStatus: string | null = null
    
    if (currentStatus === 'empty') nextStatus = 'on_time'
    else if (currentStatus === 'on_time') nextStatus = 'late'
    else if (currentStatus === 'late') nextStatus = 'qadha'
    else if (currentStatus === 'qadha') nextStatus = 'missed'
    else nextStatus = null // Clear record

    if (nextStatus === null) {
      // Delete record
      await supabase.from('prayer_records')
        .delete()
        .eq('user_id', user.id)
        .eq('prayer_date', today)
        .eq('prayer_name', prayerName)
      
      const newRecords = { ...records }
      delete newRecords[prayerName]
      setRecords(newRecords)
    } else {
      // Insert or update record
      await supabase.from('prayer_records')
        .upsert({ 
          user_id: user.id, 
          prayer_date: today, 
          prayer_name: prayerName, 
          status: nextStatus,
          prayed_at: new Date().toISOString()
        }, { onConflict: 'user_id,prayer_date,prayer_name' })
      
      setRecords({ ...records, [prayerName]: nextStatus })
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-8">
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
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h1>
          </div>

          {loading ? (
            <p className="font-mono text-sm text-[var(--ink-2)]">FETCHING RECORDS...</p>
          ) : (
            <div className="flex flex-col">
              {PRAYERS.map((prayer) => {
                const status = records[prayer] || 'empty'
                const time = '--:--' // We will replace this with real times in the next milestone

                return (
                  <div 
                    key={prayer} 
                    onClick={() => handleLogPrayer(prayer)}
                    className="group flex items-center gap-6 border-b border-[var(--line)] py-4 hover:bg-[var(--surface)] transition-colors cursor-pointer px-2 -mx-2"
                  >
                    <span className="font-mono text-sm text-[var(--ink-2)] w-12">
                      {time}
                    </span>
                    
                    <div className="flex items-center gap-3 w-32">
                      <span style={{ color: status !== 'empty' ? `var(--st-${status.replace('_', '-')})` : 'var(--ink-2)' }}>
                        <PrayerMarker name={prayer} active={status !== 'empty'} />
                      </span>
                      <span className="font-display text-lg capitalize">
                        {prayer}
                      </span>
                    </div>

                    <div className="ml-auto text-right">
                      {status === 'empty' ? (
                        <span className="kicker text-[var(--st-empty)] group-hover:text-[var(--ink)] transition-colors">
                          NOT LOGGED
                        </span>
                      ) : (
                        <span 
                          className="kicker" 
                          style={{ color: `var(--st-${status.replace('_', '-')})` }}
                        >
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
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              Stats will populate once you have a few days of records.
            </p>
          </div>

          <hr className="rule" />

          <div className="bg-[var(--surface)] p-4 border border-[var(--line)]">
            <p className="kicker mb-2">HOW TO LOG</p>
            <p className="text-sm mb-3">
              Click a prayer to cycle its status: On Time → Late → Qadha → Missed → Clear.
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}