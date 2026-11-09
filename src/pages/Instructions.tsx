import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'

function GeometricDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-10 opacity-60">
      <hr className="w-16 h-px bg-[var(--line-strong)]" />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--st-late)" strokeWidth="1.5">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </svg>
      <hr className="w-16 h-px bg-[var(--line-strong)]" />
    </div>
  )
}

function Ayah({ arabic, english, reference }: { arabic: string; english: string; reference: string }) {
  return (
    <div className="my-8 p-6 border border-[var(--line)] bg-[var(--surface)] relative shadow-sm">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--surface)] px-3">
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

export default function Instructions() {
  return (
    <div className="min-h-screen bg-[var(--paper)] overflow-y-auto pb-24">
      <div className="mx-auto max-w-[800px] px-6 pt-8">
        <NavBar />
        
        {/* Manuscript Header */}
        <div className="text-center mb-12">
          <p className="kicker text-[var(--st-late)] mb-3">THE MANUAL</p>
          <h1 className="font-display text-5xl sm:text-6xl font-normal leading-tight">Miqat</h1>
          <p className="font-arabic text-3xl text-[var(--ink-2)] mt-2">ميقات</p>
        </div>

        <Ayah 
          arabic="إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا"
          english="Indeed, prayer has been decreed upon the believers a decree of specified times."
          reference="QURAN 4:103"
        />

        <div className="space-y-10 text-[var(--ink-2)]">
          
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

          <div>
            <h2 className="font-display text-3xl text-[var(--ink)] mb-3">Privacy First</h2>
            <p className="text-base leading-relaxed text-justify">
              Your raw prayer times and records are strictly private. In a Room, your friends only see your 
              aggregated status. They cannot see your exact prayer times.
            </p>
          </div>
        </div>

        <Ayah 
          arabic="يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ"
          english="O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient."
          reference="QURAN 2:153"
        />

        <div className="mt-16 pt-8 border-t border-[var(--line)] flex flex-col items-center gap-6">
          <Link 
            to="/"
            className="border border-[var(--accent)] bg-[var(--accent)] px-12 py-4 font-mono uppercase tracking-widest text-sm text-[var(--accent-ink)] transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 shadow-lg"
          >
            RETURN TO DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  )
}