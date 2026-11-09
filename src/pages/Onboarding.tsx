import { useNavigate } from 'react-router-dom'

// A geometric divider using the 8-pointed star (Rub el Hizb)
function GeometricDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-8 opacity-60">
      <hr className="w-16 h-px bg-[var(--line-strong)]" />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--st-late)" strokeWidth="1.5">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </svg>
      <hr className="w-16 h-px bg-[var(--line-strong)]" />
    </div>
  )
}

// The Ayah block component
function Ayah({ arabic, english, reference }: { arabic: string; english: string; reference: string }) {
  return (
    <div className="my-6 p-6 border border-[var(--line)] bg-[var(--surface)] relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--paper)] px-3">
        <span className="kicker text-[var(--st-late)] text-[10px]">{reference}</span>
      </div>
      <p className="font-arabic text-2xl text-right text-[var(--ink)] leading-relaxed mb-4" dir="rtl">
        {arabic}
      </p>
      <p className="font-display text-lg italic text-[var(--ink-2)] text-center">
        "{english}"
      </p>
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()

  const handleAccept = () => {
    localStorage.setItem('miqat_onboarding', 'true')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] overflow-y-auto">
      <div className="mx-auto max-w-[800px] px-6 py-16">
        
        {/* Manuscript Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-[var(--line-strong)] rounded-full">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
              <path d="M4 27V5l12 14L28 5v22" />
              <line x1="2" y1="19" x2="30" y2="19" />
            </svg>
          </div>
          <p className="kicker text-[var(--st-late)] mb-3">THE COMPANION</p>
          <h1 className="font-display text-5xl sm:text-6xl font-normal leading-tight">Miqat</h1>
          <p className="font-arabic text-3xl text-[var(--ink-2)] mt-2">ميقات</p>
        </div>

        <Ayah 
          arabic="إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا"
          english="Indeed, prayer has been decreed upon the believers a decree of specified times."
          reference="QURAN 4:103"
        />

        <div className="space-y-10 text-[var(--ink-2)]">
          
          {/* Philosophy */}
          <div>
            <h2 className="font-display text-3xl text-[var(--ink)] mb-3">The Philosophy</h2>
            <p className="text-base leading-relaxed text-justify">
              <span className="font-display text-5xl float-left mr-3 mt-1 leading-none text-[var(--st-late)]">M</span>
              iqat is not a judge; it is a companion. We do not use punitive streaks that reset to zero. 
              If you miss a prayer, your progress is not erased. We focus on rolling consistency and the principle of returning. 
              Every day is a new opportunity to draw closer.
            </p>
          </div>

          <GeometricDivider />

          {/* Definitions */}
          <div>
            <h2 className="font-display text-3xl text-[var(--ink)] mb-4">The Definitions</h2>
            <ul className="space-y-4 text-base">
              <li className="flex gap-4">
                <strong className="text-[var(--ink)] shrink-0 w-20">On Time:</strong> 
                <span>Prayed within the designated window.</span>
              </li>
              <li className="flex gap-4">
                <strong className="text-[var(--ink)] shrink-0 w-20">Late:</strong> 
                <span>Prayed within the window, but delayed (e.g., missed the Jamaat).</span>
              </li>
              <li className="flex gap-4">
                <strong className="text-[var(--ink)] shrink-0 w-20">Missed:</strong> 
                <span>Missed the window, but offered it <strong>immediately</strong> after the next prayer begins (e.g., Praying Asr right after Maghrib starts).</span>
              </li>
              <li className="flex gap-4">
                <strong className="text-[var(--ink)] shrink-0 w-20">Qadha:</strong> 
                <span>Missed the window and delayed the makeup significantly (e.g., Praying Asr at Isha time or the next day).</span>
              </li>
            </ul>
          </div>

          <GeometricDivider />

          {/* Rooms & Sadaqah */}
          <div>
            <h2 className="font-display text-3xl text-[var(--ink)] mb-3">Accountability Rooms</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <span className="font-display text-5xl float-left mr-3 mt-1 leading-none text-[var(--st-late)]">Y</span>
              ou can create or join private Rooms with friends. In a Room, the creator can set a voluntary 
              Sadaqah (Charity) Penalty (e.g., ₹5 for Late, ₹10 for Missed, ₹20 for Qadha).
            </p>
            
            <Ayah 
              arabic="وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ ۚ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ"
              english="And establish prayer at the two ends of the day and at the approach of the night. Indeed, good deeds do away with misdeeds."
              reference="QURAN 11:114"
            />

            <div className="bg-[var(--surface)] border-l-2 border-[var(--st-late)] p-4 text-sm font-mono mt-4">
              NOTE: Miqat does not process real money. When you incur a penalty, it is added to your "Charity Pot" ledger. 
              You must pay this money directly to a charity offline and mark it as "Paid" in the app.
            </div>
          </div>

          <GeometricDivider />

          {/* Privacy */}
          <div>
            <h2 className="font-display text-3xl text-[var(--ink)] mb-3">Privacy First</h2>
            <p className="text-base leading-relaxed text-justify">
              Your raw prayer times and records are strictly private. In a Room, your friends only see your 
              aggregated status. They cannot see your exact prayer times.
            </p>
          </div>
        </div>

        <Ayah 
          arabic="قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ"
          english="Say, 'O My servants who have transgressed against themselves, do not despair of the mercy of Allah.'"
          reference="QURAN 39:53"
        />

        {/* Action Area */}
        <div className="mt-16 pt-8 border-t border-[var(--line)] flex flex-col items-center gap-6">
          <p className="kicker text-center max-w-[400px] text-[var(--ink-2)]">
            By continuing, you agree to use this tool for personal spiritual development.
          </p>
          <button 
            onClick={handleAccept}
            className="border border-[var(--accent)] bg-[var(--accent)] px-12 py-4 font-mono uppercase tracking-widest text-sm text-[var(--accent-ink)] transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 shadow-lg"
          >
            ENTER MIQAT
          </button>
        </div>

      </div>
    </div>
  )
}