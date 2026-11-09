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
    <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--line-strong)] pb-4 mb-12 gap-4">
      <Link to="/" className="hover:opacity-80 transition-opacity">
        <Wordmark />
      </Link>
      
      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
        <nav className="flex items-center gap-4 sm:gap-6">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path
            return (
              <Link 
                key={link.name}
                to={link.path} 
                className={`font-mono text-xs uppercase tracking-widest transition-all pb-1 border-b-2 ${
                  isActive 
                    ? 'text-[var(--accent)] border-[var(--accent)] font-bold' 
                    : 'text-[var(--ink)] border-transparent hover:text-[var(--accent)] hover:border-[var(--line-strong)]'
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
          className="font-mono text-xs uppercase tracking-widest text-[var(--ink)] border border-[var(--line-strong)] px-3 py-1.5 hover:bg-[var(--surface)] hover:border-[var(--ink)] transition-all shadow-sm"
        >
          LOG OUT
        </button>
      </div>
    </header>
  )
}