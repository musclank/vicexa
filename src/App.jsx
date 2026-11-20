import { useEffect, useState } from 'react'
import { ArrowUpRight, Bell, ChevronDown, CircleHelp, Compass, ExternalLink, Flame, LayoutDashboard, LogOut, Plus, Rocket, Search, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react'
import Auth from './components/Auth'
import TokenFactory from './components/TokenFactory'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const BASE_CHAIN_ID = '0x14a34'
const BASE_PARAMS = {
  chainId: BASE_CHAIN_ID,
  chainName: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org'],
}
const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'explore', label: 'Explore tokens', icon: Compass },
  { id: 'create', label: 'Create a token', icon: Plus },
]

function App() {
  const [session, setSession] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [active, setActive] = useState('overview')
  const [account, setAccount] = useState('')
  const [walletBusy, setWalletBusy] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [drafts, setDrafts] = useState(() => { try { return JSON.parse(localStorage.getItem('vicexa-project-drafts') || '[]') } catch { return [] } })
  const [form, setForm] = useState({ name: '', ticker: '', description: '', website: '' })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    localStorage.setItem('vicexa-project-drafts', JSON.stringify(drafts))
  }, [drafts])

  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      if (accounts?.[0]) setAccount(accounts[0])
    }).catch(() => {})
    const onAccounts = accounts => setAccount(accounts?.[0] || '')
    window.ethereum.on?.('accountsChanged', onAccounts)
    return () => window.ethereum.removeListener?.('accountsChanged', onAccounts)
  }, [])

  async function connectWallet() {
    setWalletError('')
    if (!window.ethereum) {
      setWalletError('No EVM wallet detected. Install MetaMask or Coinbase Wallet to continue.')
      return
    }
    setWalletBusy(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BASE_CHAIN_ID }] })
      } catch (switchError) {
        if (switchError.code !== 4902) throw switchError
        await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [BASE_PARAMS] })
      }
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== BASE_CHAIN_ID) throw new Error('Please switch your wallet to Base Sepolia.')
      setAccount(accounts?.[0] || '')
    } catch (error) {
      setWalletError(error.message || 'Wallet connection was cancelled.')
    } finally {
      setWalletBusy(false)
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
  }

  function submitDraft(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.ticker.trim() || !form.description.trim()) return
    const item = { ...form, ticker: form.ticker.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10), id: Date.now() }
    setDrafts(current => [item, ...current])
    setForm({ name: '', ticker: '', description: '', website: '' })
    setNotice('Project application saved in this browser as a draft. No token has been deployed.')
    setActive('explore')
  }

  function saveTokenDraft(token) {
    const item = { ...token, id: Date.now() }
    setDrafts(current => [item, ...current])
    setNotice('Token configuration saved locally. No contract has been deployed.')
    setActive('explore')
  }

  const shortAddress = account ? account.slice(0, 6) + '...' + account.slice(-4) : ''
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0]

  if (authOpen && !session) return <Auth onBack={() => setAuthOpen(false)} onAuthenticated={next => { setSession(next); setAuthOpen(false) }} />

  return (
    <main className="launch-app">
      <aside className="sidebar">
        <a className="launch-brand" href="#" onClick={e => { e.preventDefault(); setActive('overview') }}><span className="brand-mark">V</span><span>VICEXA<small>LAUNCHPAD</small></span></a>
        <div className="network-pill"><span/> BASE SEPOLIA <ChevronDown size={13}/></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'side-link active' : 'side-link'} onClick={() => { setActive(id); setNotice('') }}><Icon size={17}/>{label}{id === 'create' && <span className="side-plus">+</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><CircleHelp size={17}/><b>Need help?</b><span>Learn how VICEXA works.</span><a href="https://docs.base.org/" target="_blank" rel="noreferrer">Base developer docs <ArrowUpRight size={12}/></a></div>
          {session ? <button className="profile-button" onClick={signOut}><span className="profile-avatar">{(userName || 'V').slice(0,1).toUpperCase()}</span><span className="profile-copy"><b>{userName}</b><small>Sign out</small></span><LogOut size={15}/></button> : <button className="profile-button" onClick={() => setAuthOpen(true)}><span className="profile-avatar">V</span><span className="profile-copy"><b>Guest workspace</b><small>Sign in or create account</small></span><ArrowUpRight size={15}/></button>}
        </div>
      </aside>

      <section className="launch-main">
        <header className="launch-topbar">
          <div className="breadcrumb">VICEXA <span>/</span> {navItems.find(item => item.id === active)?.label.toUpperCase()}</div>
          <div className="top-actions"><span className="top-network"><i/> BASE SEPOLIA</span><button className="icon-button" aria-label="Notifications"><Bell size={17}/></button><button className="auth-top-button" onClick={() => session ? signOut() : setAuthOpen(true)}>{session ? 'Sign out' : 'Sign in'}</button><button className="wallet-button" onClick={connectWallet} disabled={walletBusy}><Wallet size={16}/>{walletBusy ? 'CONNECTING…' : shortAddress || 'Connect wallet'}</button></div>
        </header>

        <div className="launch-content">
          {walletError && <div className="launch-alert"><span>{walletError}</span><button onClick={() => setWalletError('')} aria-label="Dismiss"><X size={15}/></button></div>}
          {notice && <div className="launch-alert success-alert"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}

          {active === 'overview' && <>
            <div className="launch-welcome"><div><div className="launch-eyebrow"><span/> THE BASE ECOSYSTEM, ONE TOKEN AT A TIME</div><h1>BUILD WHAT'S<br/><span className="launch-gradient">NEXT.</span></h1><p>Create and configure your own token for Base with a simple, guided workflow.</p><div className="welcome-actions"><button className="launch-primary" onClick={() => setActive('explore')}>Explore launches <ArrowUpRight size={16}/></button><button className="launch-secondary" onClick={() => setActive('create')}>Create a token <Plus size={16}/></button></div></div><div className="welcome-visual"><div className="visual-ring ring-a"/><div className="visual-ring ring-b"/><div className="visual-v">V</div><span className="visual-caption">BUILT ON BASE / 8453</span></div></div>
            <div className="metric-grid"><div className="metric-card"><span>NETWORK</span><b>BASE</b><small>Ethereum Layer 2</small></div><div className="metric-card"><span>DEPLOYED TOKENS</span><b>—</b><small>Factory contract in development</small></div><div className="metric-card"><span>YOUR TOKEN DRAFTS</span><b>{drafts.length}</b><small>Saved locally in this browser</small></div></div>
            <div className="content-heading"><div><div className="launch-eyebrow">DISCOVER</div><h2>Explore tokens</h2></div><button className="text-action" onClick={() => setActive('explore')}>View all <ArrowUpRight size={14}/></button></div>
            <div className="empty-launch-card"><div className="empty-icon"><Rocket size={22}/></div><div><b>The token directory is getting ready.</b><p>Deployed tokens will appear here after the VICEXA factory contract and token registry are live.</p></div><span className="status-chip">IN DEVELOPMENT</span></div>
            <div className="content-heading"><div><div className="launch-eyebrow">HOW IT WORKS</div><h2>From configuration to token</h2></div></div>
            <div className="steps-grid"><div><span>01</span><b>Prepare</b><p>Enter your token name, symbol, supply, and decimals.</p></div><div><span>02</span><b>Review</b><p>Review the token configuration and deployment details.</p></div><div><span>03</span><b>Launch</b><p>Deploy through the audited VICEXA Token Factory when it is ready.</p></div></div>
          </>}

          {active === 'explore' && <section className="page-section"><div className="launch-eyebrow"><span/> BASE TOKEN DIRECTORY</div><h1 className="page-title">EXPLORE<br/><span className="launch-gradient">TOKENS.</span></h1><p className="page-lead">Discover tokens created through the VICEXA Token Factory.</p>{drafts.length === 0 ? <div className="large-empty"><div className="empty-icon"><Search size={24}/></div><h2>No tokens listed yet</h2><p>The public token directory will populate after the factory contract and on-chain registry are connected.</p><button className="launch-primary" onClick={() => setActive('create')}>Create a token <Plus size={16}/></button></div> : <div className="draft-list">{drafts.map(draft => <article className="draft-card" key={draft.id}><div className="draft-token">{draft.ticker.slice(0,1)}</div><div className="draft-info"><b>{draft.name} <span>${draft.ticker}</span></b><p>{draft.description}</p><small>TOKEN DRAFT · NOT ON-CHAIN</small></div><span className="status-chip">DRAFT</span></article>)}</div>}</section>}

          {active === 'create' && <TokenFactory account={account} onSaveDraft={saveTokenDraft}/>}

        </div>
        <footer className="launch-footer"><span>© {new Date().getFullYear()} VICEXA</span><span>POWERED BY BASE <span className="footer-dot">·</span> BUILT FOR WHAT'S NEXT</span><a href="https://basescan.org/" target="_blank" rel="noreferrer">BASESCAN <ExternalLink size={12}/></a></footer>
      </section>
    </main>
  )
}

export default App
