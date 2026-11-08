import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Geometric 8-Pointed Star (Rub el Hizb)
function RubElHizb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
      {/* Square 1 */}
      <rect x="20" y="20" width="60" height="60" />
      {/* Square 2 (Rotated) */}
      <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" />
      {/* Inner circle */}
      <circle cx="50" cy="50" r="15" />
    </svg>
  )
}

// Architectural Cypress Tree
function CypressTree({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 400" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M50 10 C 80 150, 90 300, 70 380 L 30 380 C 10 300, 20 150, 50 10 Z" />
      <path d="M50 60 Q 65 100, 70 140" />
      <path d="M50 120 Q 35 160, 30 200" />
      <path d="M50 180 Q 65 220, 70 260" />
      <path d="M50 240 Q 35 280, 30 320" />
      <line x1="50" y1="380" x2="50" y2="400" />
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
    <div className="relative flex min-h-screen items-center justify-center px-6 overflow-hidden bg-[var(--paper)]">
      
      {/* Central Watermark: Rub el Hizb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <RubElHizb className="w-[85vw] max-w-[800px] text-[var(--accent)] opacity-[0.04]" />
      </div>

      {/* Left Forest Cluster */}
      <div 
        className="absolute left-0 bottom-0 top-0 w-[40%] hidden lg:flex items-end justify-start pl-10 pb-0 text-[var(--accent)] pointer-events-none"
        style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 95%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 95%)', opacity: 0.15 }}
      >
        <div className="relative flex items-end -ml-8">
          <CypressTree className="h-[45vh] opacity-50" />
          <CypressTree className="h-[65vh] -ml-6 z-10" />
          <CypressTree className="h-[35vh] -ml-4 opacity-40" />
        </div>
      </div>

      {/* Right Forest Cluster */}
      <div 
        className="absolute right-0 bottom-0 top-0 w-[40%] hidden lg:flex items-end justify-end pr-10 pb-0 text-[var(--accent)] pointer-events-none scale-x-[-1]"
        style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 95%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 95%)', opacity: 0.15 }}
      >
        <div className="relative flex items-end -ml-8">
          <CypressTree className="h-[35vh] opacity-40" />
          <CypressTree className="h-[65vh] -ml-6 z-10" />
          <CypressTree className="h-[45vh] -ml-4 opacity-50" />
        </div>
      </div>

      {/* Ground Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--accent)] opacity-10" />

      {/* Structural Card */}
      <div className="relative z-10 w-full max-w-[380px] bg-[var(--surface)] border border-[var(--line)] p-8 sm:p-10 shadow-[0_20px_50px_rgba(24,59,50,0.05)]">
        
        <div className="mb-10 text-center flex flex-col items-center">
          
          {/* Date Badge */}
          <div className="mb-6 border border-[var(--line)] bg-[var(--paper)] px-3 py-1">
            <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--ink-2)]">
              {hijriDate}
            </p>
          </div>

          <div className="mb-6 flex h-12 w-12 items-center justify-center border border-[var(--line-strong)] bg-[var(--paper)]">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
              <path d="M4 27V5l12 14L28 5v22" />
              <line x1="2" y1="19" x2="30" y2="19" />
            </svg>
          </div>
          
          <h1 className="font-display text-[2.5rem] font-normal tracking-[0.1em] leading-none mb-1">MIQAT</h1>
          <p className="font-arabic text-2xl text-[var(--ink-2)] mb-4 leading-none">ميقات</p>
          
          <div className="flex items-center gap-3 w-full justify-center">
            <hr className="w-10 rule" />
            <p className="kicker text-[var(--ink-2)]">Salah Journal</p>
            <hr className="w-10 rule" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="kicker mb-1.5 block" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--line)] bg-[var(--paper)]/50 px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all duration-200"
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
                className="w-full border border-[var(--line)] bg-[var(--paper)]/50 px-3 py-2.5 pr-10 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all duration-200"
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

          {error && <p className="text-xs text-[var(--st-missed)] mt-1 font-mono">{error}</p>}
          {message && <p className="text-xs text-[var(--st-on-time)] mt-1 font-mono">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="font-mono uppercase tracking-widest text-xs mt-4 w-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-3.5 text-[var(--accent-ink)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 shadow-sm"
          >
            {loading ? 'PROCESSING' : isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[var(--line)] pt-6">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
            className="kicker text-[var(--ink-2)] underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--ink)] hover:decoration-[var(--ink)] transition-colors"
          >
            {isLogin ? 'CREATE AN ACCOUNT' : 'ALREADY HAVE AN ACCOUNT?'}
          </button>
        </div>
      </div>
    </div>
  )
}