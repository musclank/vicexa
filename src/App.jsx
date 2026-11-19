import { ArrowUpRight, Cpu, Wallet, Layers3, Zap, ShieldCheck, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const products = [
  { icon: Cpu, number: '01', title: 'AI TOOLKIT', text: 'A growing collection of intelligent tools built to turn ideas into action.' },
  { icon: Wallet, number: '02', title: 'CRYPTO PAYMENTS', text: 'A simple way to access digital services with supported crypto assets.' },
  { icon: Layers3, number: '03', title: 'WEB3 ECOSYSTEM', text: 'Wallet-connected experiences, digital identity, and on-chain utilities.' },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState('home')
  const [session, setSession] = useState(null)
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) setView('dashboard')
  }, [session])

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setView('home')
  }

  if (view === 'auth' && !session) return <Auth onBack={() => setView('home')} onAuthenticated={setSession} />
  if (view === 'dashboard' && session) return <Dashboard session={session} onSignOut={signOut} />

  return (
    <main>
      <div className="grid-glow" aria-hidden="true" />
      <header className="nav wrap">
        <a className="brand" href="#" aria-label="VICEXA home"><span className="brand-mark">V</span> VICEXA</a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={21}/></button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#ecosystem" onClick={closeMenu}>Ecosystem</a>
          <a href="#vision" onClick={closeMenu}>Vision</a>
          <a href="#roadmap" onClick={closeMenu}>Roadmap</a>
          <button className="nav-cta" onClick={() => {closeMenu();setView('auth')}}>Sign in <ArrowUpRight size={15}/></button>
        </nav>
      </header>

      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> THE NEXT DIGITAL FRONTIER</div>
          <h1>AI MEETS<br/><span className="gradient-text">CRYPTO.</span></h1>
          <p className="hero-sub">One ecosystem. Endless possibilities.</p>
          <p className="hero-body">A new digital universe where intelligent tools and decentralized technology move together. Built for creators, builders, and the next generation of the internet.</p>
          <div className="hero-actions">
            <a className="button primary" href="#ecosystem">Explore ecosystem <ArrowUpRight size={17}/></a>
            <a className="button secondary" href="#vision">Discover VICEXA</a>
          </div>
          <div className="hero-note"><span className="line"/> IN DEVELOPMENT <span className="note-dot"/> BUILT FOR WHAT'S NEXT</div>
        </div>
        <div className="hero-art" aria-label="Abstract neon VICEXA emblem">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
          <div className="core"><div className="core-inner">V</div></div>
          <span className="float-label label-top">INTELLIGENCE / 01</span>
          <span className="float-label label-bottom">DECENTRALIZED / 02</span>
          <span className="art-cross cross-a">+</span><span className="art-cross cross-b">+</span>
        </div>
      </section>

      <section className="ticker" aria-label="VICEXA principles">
        <div>INTELLIGENCE <b>✳</b> OWNERSHIP <b>✳</b> ACCESS <b>✳</b> INNOVATION <b>✳</b> INTELLIGENCE <b>✳</b> OWNERSHIP <b>✳</b> ACCESS <b>✳</b></div>
      </section>

      <section className="section wrap" id="ecosystem">
        <div className="section-heading">
          <div><div className="eyebrow">01 / THE ECOSYSTEM</div><h2>TOOLS FOR A<br/><span className="gradient-text">NEW REALITY.</span></h2></div>
          <p>One connected platform. Multiple ways to create, transact, and grow in the digital world.</p>
        </div>
        <div className="cards">
          {products.map(({icon: Icon, number, title, text}) => <article className="product-card" key={number}>
            <div className="card-top"><span>{number} / 03</span><Icon size={23}/></div>
            <h3>{title}</h3><p>{text}</p><span className="card-status">IN DEVELOPMENT</span>
          </article>)}
        </div>
      </section>

      <section className="vision-section" id="vision">
        <div className="wrap vision-grid">
          <div><div className="eyebrow">02 / THE VISION</div><h2>MAKE THE<br/>COMPLEX<br/><span className="gradient-text">FEEL SIMPLE.</span></h2></div>
          <div className="vision-copy"><p>VICEXA is being built around a simple idea: powerful technology should feel accessible. We are bringing useful AI experiences and crypto-powered access into one coherent platform.</p><div className="principle"><Zap/><div><b>UTILITY FIRST</b><span>Build useful products before adding complexity.</span></div></div><div className="principle"><ShieldCheck/><div><b>BUILT WITH CARE</b><span>Security, transparency, and clear product states matter.</span></div></div></div>
        </div>
      </section>

      <section className="section wrap roadmap" id="roadmap">
        <div className="eyebrow">03 / WHAT COMES NEXT</div><h2>THE BUILD<br/><span className="gradient-text">STARTS HERE.</span></h2>
        <div className="roadmap-list">
          <div><span>PHASE 01</span><b>Foundation</b><small>Brand, responsive website, deployment pipeline</small><em>IN PROGRESS</em></div>
          <div><span>PHASE 02</span><b>Core Platform</b><small>Accounts, dashboard, and AI tool framework</small><em>PLANNED</em></div>
          <div><span>PHASE 03</span><b>Web3 Layer</b><small>Wallet connection and supported crypto payments</small><em>PLANNED</em></div>
        </div>
      </section>

      <footer className="footer wrap"><a className="brand" href="#"><span className="brand-mark">V</span> VICEXA</a><span>THE NEXT DIGITAL FRONTIER.</span><small>© {new Date().getFullYear()} VICEXA. ALL SYSTEMS IN DEVELOPMENT.</small></footer>
    </main>
  )
}

export default App
