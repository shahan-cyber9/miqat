import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getPrayerTimes } from '../lib/al_adhan'
import NavBar from '../components/NavBar'

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
type PrayerTimes = { fajr: string, dhuhr: string, asr: string, maghrib: string, isha: string }

const format12H = (time24: string) => {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

const calculateOffset = (baseTime: string, targetTime: string) => {
  if (!baseTime || !targetTime) return 0
  const [baseH, baseM] = baseTime.split(':').map(Number)
  const [targetH, targetM] = targetTime.split(':').map(Number)
  let diff = (targetH * 60 + targetM) - (baseH * 60 + baseM)
  if (diff > 720) diff -= 1440
  if (diff < -720) diff += 1440
  return diff
}

const applyOffset = (baseTime: string, offset: number) => {
  if (!baseTime) return '12:00'
  const [h, m] = baseTime.split(':').map(Number)
  const totalMin = h * 60 + m + offset
  const newH = Math.floor(totalMin / 60) % 24
  const newM = totalMin % 60
  const finalH = newH < 0 ? newH + 24 : newH
  return `${String(finalH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [method, setMethod] = useState(1)
  const [school, setSchool] = useState(0)
  const [baseTimes, setBaseTimes] = useState<PrayerTimes | null>(null)
  const [targetTimes, setTargetTimes] = useState<PrayerTimes>({
    fajr: '05:00', dhuhr: '13:00', asr: '16:00', maghrib: '18:00', isha: '20:00'
  })

  useEffect(() => {
    async function loadData() {
      if (!user) return

      const { data } = await supabase.from('prayer_preferences').select('*').eq('user_id', user.id).single()
      const savedMethod = data?.calculation_method || 1
      const savedSchool = data?.asr_school || 0
      
      setMethod(savedMethod)
      setSchool(savedSchool)

      const fetchApiTimes = async (lat: number, lng: number) => {
        const fetched = await getPrayerTimes(lat, lng, new Date(), savedMethod, savedSchool)
        if (fetched) {
          setBaseTimes(fetched)
          const savedOffsets = {
            fajr: data?.fajr_offset || 0,
            dhuhr: data?.dhuhr_offset || 0,
            asr: data?.asr_offset || 0,
            maghrib: data?.maghrib_offset || 0,
            isha: data?.isha_offset || 0,
          }
          setTargetTimes({
            fajr: applyOffset(fetched.fajr, savedOffsets.fajr),
            dhuhr: applyOffset(fetched.dhuhr, savedOffsets.dhuhr),
            asr: applyOffset(fetched.asr, savedOffsets.asr),
            maghrib: applyOffset(fetched.maghrib, savedOffsets.maghrib),
            isha: applyOffset(fetched.isha, savedOffsets.isha),
          })
        }
        setLoading(false)
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchApiTimes(pos.coords.latitude, pos.coords.longitude),
          () => fetchApiTimes(19.0760, 72.8777)
        )
      } else {
        fetchApiTimes(19.0760, 72.8777)
      }
    }
    loadData()
  }, [user])

  useEffect(() => {
    if (loading) return
    async function recalculateBase() {
      if (!baseTimes) return
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const fetched = await getPrayerTimes(pos.coords.latitude, pos.coords.longitude, new Date(), method, school)
            if (fetched) {
              setBaseTimes(fetched)
              setTargetTimes(fetched)
            }
          }
        )
      }
    }
    recalculateBase()
  }, [method, school])

  const handleTimeChange = (prayer: keyof PrayerTimes, value: string) => {
    setTargetTimes({ ...targetTimes, [prayer]: value })
  }

  const handleSave = async () => {
    if (!user || !baseTimes) return
    setSaving(true)
    setMessage(null)

    const newOffsets = {
      fajr: calculateOffset(baseTimes.fajr, targetTimes.fajr),
      dhuhr: calculateOffset(baseTimes.dhuhr, targetTimes.dhuhr),
      asr: calculateOffset(baseTimes.asr, targetTimes.asr),
      maghrib: calculateOffset(baseTimes.maghrib, targetTimes.maghrib),
      isha: calculateOffset(baseTimes.isha, targetTimes.isha),
    }

    const { error } = await supabase.from('prayer_preferences').upsert({
      user_id: user.id,
      calculation_method: method,
      asr_school: school,
      fajr_offset: newOffsets.fajr,
      dhuhr_offset: newOffsets.dhuhr,
      asr_offset: newOffsets.asr,
      maghrib_offset: newOffsets.maghrib,
      isha_offset: newOffsets.isha,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Mosque timetable updated successfully.')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 font-mono text-sm">LOADING TIMETABLE...</div>

  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-6 pt-0 pb-24 min-h-screen">
      <NavBar />

      <main className="mt-8">
        <div className="mb-8">
          <p className="kicker mb-2">PREFERENCES</p>
          <h1 className="font-display text-3xl sm:text-4xl font-normal">Timetable Setup</h1>
          <p className="font-display text-sm italic text-[var(--ink-2)] mt-2">
            "Allah does not burden a soul beyond what it can bear." (Quran 2:286)
          </p>
          <p className="mt-4 text-sm text-[var(--ink-2)] max-w-[50ch]">
            Select the exact times from your local mosque. We will automatically calculate and save the minute differences for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 shadow-sm">
            <h2 className="font-display text-2xl mb-4 border-b border-[var(--line)] pb-2">Calculation Base</h2>
            
            <div className="mb-6">
              <label className="kicker mb-2 block">Method</label>
              <select 
                value={method} 
                onChange={(e) => setMethod(parseInt(e.target.value))}
                className="w-full border border-[var(--line)] rounded-lg bg-[var(--paper)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="1">University of Islamic Sciences, Karachi</option>
                <option value="2">Islamic Society of North America (ISNA)</option>
                <option value="3">Muslim World League</option>
                <option value="4">Umm Al-Qura University, Makkah</option>
                <option value="5">Egyptian General Authority of Survey</option>
                <option value="8">Gulf Region</option>
              </select>
            </div>

            <div>
              <label className="kicker mb-2 block">Asr School</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={school === 0} onChange={() => setSchool(0)} className="accent-[var(--accent)]" />
                  Shafi'i / Hanbali / Maliki (Standard)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={school === 1} onChange={() => setSchool(1)} className="accent-[var(--accent)]" />
                  Hanafi
                </label>
              </div>
            </div>
          </section>

          <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 shadow-sm">
            <h2 className="font-display text-2xl mb-4 border-b border-[var(--line)] pb-2">Your Mosque Timings</h2>
            <div className="flex flex-col gap-4">
              {PRAYERS.map(prayer => (
                <div key={prayer} className="flex items-center justify-between pb-3 border-b border-[var(--line)] last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-display capitalize text-lg">{prayer}</span>
                    {baseTimes && (
                      <span className="kicker text-[10px] text-[var(--ink-2)] mt-0.5">
                        Calculated: {format12H(baseTimes[prayer])}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={targetTimes[prayer]} 
                      onChange={(e) => handleTimeChange(prayer, e.target.value)}
                      className="w-[130px] border border-[var(--line)] rounded-lg bg-[var(--paper)] px-2 py-1.5 text-center font-mono text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="kicker text-[var(--st-on-time)]">{message}</p>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full sm:w-auto border border-[var(--accent)] bg-[var(--accent)] rounded-xl px-8 py-3 font-mono uppercase tracking-widest text-sm text-[var(--accent-ink)] hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            {saving ? 'SAVING...' : 'SAVE TIMETABLE'}
          </button>
        </div>
      </main>
    </div>
  )
}