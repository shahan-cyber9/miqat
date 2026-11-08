import { useEffect, useState } from 'react'

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

export default function App() {
  // Default to light. Persisting this to localStorage comes later with the settings page.
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="mx-auto max-w-[1120px] p-6">
      <header className="flex items-center justify-between border-b border-[color:var(--line)] pb-4">
        <Wordmark />
        <button
          onClick={() => setDark((d) => !d)}
          className="kicker cursor-pointer border border-[color:var(--line-strong)] bg-transparent px-3 py-2 text-[color:var(--ink)]"
          aria-label="Toggle theme"
        >
          {dark ? 'LIGHT' : 'DARK'}
        </button>
      </header>

      <main className="mt-12">
        <p className="kicker mb-2">FOUNDATION</p>
        <h1 className="font-display m-0 text-[clamp(2rem,4vw,3.5rem)] leading-[1.15] font-normal">
          The appointed time.
        </h1>
        <p className="mt-4 max-w-[48ch] text-[color:var(--ink-2)]">
          Miqat is a worship companion for the five daily prayers. This is the
          design foundation — tokens, typography, and themes are live.
        </p>
        <hr className="rule mt-8 mb-4" />
        <p className="kicker">Next: Prayer timeline, markers, and the first dashboard</p>
      </main>
    </div>
  )
}