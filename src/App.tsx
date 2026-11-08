import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase' // Import the client

function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="miter"
      >
        <path d="M4 27V5l12 14L28 5v22" />
        <line x1="2" y1="19" x2="30" y2="19" />
      </svg>
      <span
        className="font-display"
        style={{ fontSize: size * 0.85, letterSpacing: '-0.01em' }}
      >
        MIQAT
      </span>
    </div>
  )
}

function PrayerMarker({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 'currentColor' : 'var(--ink-2)'
  const fill = active ? 'currentColor' : 'none'

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
      {name === 'fajr' && (
        <>
          <line x1="2" y1="18" x2="22" y2="18" />
          <circle cx="12" cy="10" r="3" fill={fill} />
        </>
      )}
      {name === 'dhuhr' && (
        <>
          <circle cx="12" cy="12" r="6" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
        </>
      )}
      {name === 'asr' && (
        <>
          <circle cx="12" cy="12" r="6" />
          <line x1="4" y1="20" x2="20" y2="4" />
        </>
      )}
      {name === 'maghrib' && (
        <>
          <line x1="2" y1="18" x2="22" y2="18" />
          <path d="M6 18a6 6 0 0 1 12 0" />
        </>
      )}
      {name === 'isha' && (
        <>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3" fill={fill} />
        </>
      )}
    </svg>
  )
}

const mockPrayers = [
  { name: 'fajr', label: 'FAJR', time: '05:12', status: 'on_time' },
  { name: 'dhuhr', label: 'DHUHR', time: '12:47', status: 'late' },
  { name: 'asr', label: 'ASR', time: '16:05', status: 'empty' },
  { name: 'maghrib', label: 'MAGHRIB', time: '18:31', status: 'qadha' },
  { name: 'isha', label: 'ISHA', time: '19:58', status: 'empty' },
]

export default function App() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Temporary Supabase connection test
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Supabase error:', error)
      else console.log('Supabase connected successfully. Session:', data.session)
    })
  }, [])

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-8">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Wordmark />
        <button
          onClick={() => setDark((d) => !d)}
          className="kicker cursor-pointer border border-[var(--line-strong)] bg-transparent px-3 py-2 text-[var(--ink)] hover:bg-[var(--surface)]"
        >
          {dark ? 'LIGHT' : 'DARK'}
        </button>
      </header>

      <main className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-8">
            <p className="kicker mb-2">FRIDAY, 8 NOVEMBER</p>
            <h1 className="font-display m-0 text-4xl font-normal">
              Today
            </h1>
          </div>

          <div className="flex flex-col">
            {mockPrayers.map((prayer) => (
              <div 
                key={prayer.name} 
                className="group flex items-center gap-6 border-b border-[var(--line)] py-4 hover:bg-[var(--surface)] transition-colors cursor-pointer px-2 -mx-2"
              >
                <span className="font-mono text-sm text-[var(--ink-2)] w-12">
                  {prayer.time}
                </span>
                
                <div className="flex items-center gap-3 w-32">
                  <span style={{ color: prayer.status !== 'empty' ? `var(--st-${prayer.status.replace('_', '-')})` : 'var(--ink-2)' }}>
                    <PrayerMarker name={prayer.name} active={prayer.status !== 'empty'} />
                  </span>
                  <span className="font-display text-lg">
                    {prayer.label}
                  </span>
                </div>

                <div className="ml-auto text-right">
                  {prayer.status === 'empty' ? (
                    <span className="kicker text-[var(--st-empty)] group-hover:text-[var(--ink)] transition-colors">
                      NOT LOGGED
                    </span>
                  ) : (
                    <span 
                      className="kicker" 
                      style={{ color: `var(--st-${prayer.status.replace('_', '-')})` }}
                    >
                      {prayer.status.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-8">
          <div>
            <p className="kicker mb-3">CONSISTENCY</p>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl">86</span>
              <span className="kicker">% THIS MONTH</span>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              Four prayers remain to return.
            </p>
          </div>

          <hr className="rule" />

          <div>
            <p className="kicker mb-3">CIRCLE</p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span>You</span>
                <span className="font-mono text-[var(--st-on-time)]">4/5</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Yusuf</span>
                <span className="font-mono text-[var(--st-on-time)]">5/5</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Bilal</span>
                <span className="font-mono text-[var(--st-late)]">3/5</span>
              </div>
            </div>
          </div>

          <hr className="rule" />

          <div className="bg-[var(--surface)] p-4 border border-[var(--line)]">
            <p className="kicker mb-2">RETURN PRINCIPLE</p>
            <p className="text-sm mb-3">
              Asr wasn't logged. It isn't gone.
            </p>
            <button className="kicker underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--ink)] transition-colors">
              LOG IT NOW
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}