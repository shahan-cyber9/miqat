export default function Footer() {
  return (
    <footer className="w-full max-w-[1120px] mx-auto px-6 mt-24 border-t border-[var(--line)] pt-8 pb-12 flex flex-col items-center justify-center text-center gap-3">
      <p className="font-display italic text-sm text-[var(--ink)]">
        "And whatever good you do, Allah knows it well." (Quran 2:215)
      </p>
      
      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-2">
        <p className="kicker text-[var(--ink-2)] tracking-wider">
          Built with intention by{' '}
          <a href="mailto:malikshah25707@gmail.com" className="underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--accent)] transition-colors">
            Shahan Malik 
          </a>
        </p>
        <div className="w-1 h-1 rounded-full bg-[var(--line-strong)] hidden sm:block"></div>
        <a 
          href="https://www.instagram.com/malik._.shaaa/" 
          target="_blank" 
          rel="noreferrer"
          className="kicker text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          @malik._.shaaa
        </a>
      </div>

      <p className="text-[10px] font-mono text-[var(--ink-2)] opacity-60 mt-2">
        Miqat is a free tool for the Ummah. If you find a bug or have a suggestion, please reach out.
      </p>
    </footer>
  )
}