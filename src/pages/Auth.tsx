import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer'

// Custom architectural Cypress tree SVG
function CypressTree({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 150 400" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M75 20 C 110 150, 120 300, 95 380 L 55 380 C 30 300, 40 150, 75 20 Z" />
      <path d="M75 80 Q 95 120, 100 160" />
      <path d="M75 140 Q 55 180, 50 220" />
      <path d="M75 200 Q 95 240, 100 280" />
      <path d="M75 260 Q 55 300, 50 340" />
      <line x1="75" y1="380" x2="75" y2="400" strokeWidth="2" />
      <path d="M120 150 C 140 240, 145 320, 130 380 L 110 380 C 95 320, 100 240, 120 150 Z" />
      <path d="M120 210 Q 130 240, 135 270" />
      <path d="M120 270 Q 110 300, 105 330" />
      <line x1="120" y1="380" x2="120" y2="400" strokeWidth="2" />
    </svg>
  )
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const hijriDate = new Intl.DateTimeFormat('en-US-u-ca-islamic', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  }).format(new Date())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col justify-between relative overflow-hidden">
      
      {/* Left Tree with Gradient Fade */}
      <div 
        className="absolute left-0 bottom-0 top-0 w-[35%] hidden lg:flex items-center justify-start pl-12 text-[var(--accent)] pointer-events-none"
        style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 90%)', opacity: 0.08 }}
      >
        <CypressTree className="h-[75vh]" />
      </div>

      {/* Right Tree with Gradient Fade */}
      <div 
        className="absolute right-0 bottom-0 top-0 w-[35%] hidden lg:flex items-center justify-end pr-12 text-[var(--accent)] pointer-events-none scale-x-[-1]"
        style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 90%)', opacity: 0.08 }}
      >
        <CypressTree className="h-[75vh]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="relative w-full max-w-[400px] bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-sm bg-white/80">
          
          <div className="mb-8 text-center flex flex-col items-center">
            {/* Date Badge */}
            <div className="mb-6 border border-[var(--line)] bg-[var(--paper)] px-3 py-1 rounded-full">
              <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--ink-2)]">
                {hijriDate}
              </p>
            </div>

            <div className="mb-4 flex h-12 w-12 items-center justify-center border border-[var(--line-strong)] bg-[var(--paper)] rounded-xl">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
                <path d="M4 27V5l12 14L28 5v22" />
                <line x1="2" y1="19" x2="30" y2="19" />
              </svg>
            </div>
            
            <h1 className="font-display text-4xl font-normal tracking-tight leading-none mb-1">MIQAT</h1>
            <p className="font-arabic text-2xl text-[var(--ink-2)] mb-4 leading-none">ميقات</p>
            
            <div className="flex items-center gap-3 w-full justify-center">
              <hr className="w-10 rule" />
              <p className="kicker text-[var(--ink-2)]">Salah Journal</p>
              <hr className="w-10 rule" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="kicker mb-1.5 block" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[var(--line)] rounded-xl bg-[var(--paper)]/50 px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all duration-200"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="kicker block" htmlFor="password">Password</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-mono tracking-wider uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[var(--line)] rounded-xl bg-[var(--paper)]/50 px-3 py-2.5 pr-10 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-[var(--st-missed)] mt-1 font-mono bg-[var(--st-missed)]/10 p-2 rounded-lg">{error}</p>}
            {message && <p className="text-xs text-[var(--st-on-time)] mt-1 font-mono bg-[var(--st-on-time)]/10 p-2 rounded-lg">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="font-mono uppercase tracking-widest text-xs mt-2 w-full border border-[var(--accent)] bg-[var(--accent)] rounded-xl px-4 py-3.5 text-[var(--accent-ink)] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-50"
            >
              {loading ? 'PROCESSING' : isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
              className="kicker text-[var(--ink-2)] underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--ink)] hover:decoration-[var(--ink)] transition-colors"
            >
              {isLogin ? 'CREATE AN ACCOUNT' : 'ALREADY HAVE AN ACCOUNT?'}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10">
         <Footer />
      </div>
    </div>
  )
}