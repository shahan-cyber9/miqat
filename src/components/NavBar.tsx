import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

export default function NavBar() {
  const location = useLocation()

  const navLinks = [
    { name: 'TODAY', path: '/' },
    { name: 'ARCHIVE', path: '/archive' },
    { name: 'ROOMS', path: '/rooms' },
    { name: 'GUIDE', path: '/instructions' },
    { name: 'SETTINGS', path: '/settings' },
  ]

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--paper)]/80 border-b border-[var(--line)]">
      <header className="mx-auto max-w-[1120px] px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Wordmark />
        </Link>
        
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path
              return (
                <Link 
                  key={link.name}
                  to={link.path} 
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all duration-200 ${
                    isActive 
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold' 
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--line)]/50'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
          
          <div className="h-4 w-px bg-[var(--line-strong)] hidden sm:block"></div>
          
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-2)] border border-[var(--line-strong)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-all"
          >
            LOG OUT
          </button>
        </div>
      </header>
    </div>
  )
}