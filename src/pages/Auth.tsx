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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`, 
      },
    })
    if (error) alert(error.message)
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

          {/* DIVIDER */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-[var(--line)]"></div>
            <span className="flex-shrink mx-4 kicker text-[var(--ink-2)]">OR</span>
            <div className="flex-grow border-t border-[var(--line)]"></div>
          </div>

          {/* GOOGLE BUTTON */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-[var(--line-strong)] bg-[var(--surface)] rounded-xl px-4 py-3.5 text-sm font-medium text-[var(--ink)] shadow-sm transition-all duration-200 hover:bg-[var(--paper)] hover:border-[var(--ink)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

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