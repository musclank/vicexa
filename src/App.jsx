import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, Bell, ChevronDown, CircleHelp, Compass, Crown, ExternalLink, Flame, LayoutDashboard, LogOut, Plus, Radio, Rocket, Search, ShieldCheck, Sparkles, TrendingUp, Wallet, Wifi, X } from 'lucide-react'
import Auth from './components/Auth'
import TokenFactory from './components/TokenFactory'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const BASE_CHAIN_ID = '0x2105'
const BASE_PARAMS = {
  chainId: BASE_CHAIN_ID,
  chainName: 'Base Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
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
  const [publishedTokens, setPublishedTokens] = useState([])
  const [directoryLoading, setDirectoryLoading] = useState(true)
  const [directoryError, setDirectoryError] = useState('')
  const [notice, setNotice] = useState('')
  const [baseBlock, setBaseBlock] = useState('')
  const [baseStatus, setBaseStatus] = useState('checking')

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
    let cancelled = false
    async function loadTokenDirectory() {
      if (!supabase) {
        setDirectoryError('Token directory is not configured. Check the Supabase URL and anon key in Cloudflare Pages.')
        setDirectoryLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('token_launches')
          .select('id, token_name, token_symbol, description, token_image_url, expected_token_address, transaction_hash, creator_wallet, confirmed_at, created_at')
          .eq('chain_id', 8453)
          .eq('status', 'confirmed')
          .not('expected_token_address', 'is', null)
          .order('confirmed_at', { ascending: false })
        if (error) throw error
        if (!cancelled) {
          setPublishedTokens(data || [])
          setDirectoryError('')
        }
      } catch (error) {
        if (!cancelled) setDirectoryError(error.message || 'Could not load the token directory.')
      } finally {
        if (!cancelled) setDirectoryLoading(false)
      }
    }
    loadTokenDirectory()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer
    async function checkBaseNetwork() {
      try {
        const response = await fetch('https://mainnet.base.org', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }) })
        if (!response.ok) throw new Error('Base RPC unavailable')
        const payload = await response.json()
        if (payload.error || !payload.result) throw new Error('Base RPC unavailable')
        if (!cancelled) { setBaseBlock(parseInt(payload.result, 16).toLocaleString('en-US')); setBaseStatus('online') }
      } catch { if (!cancelled) setBaseStatus('unavailable') }
      finally { if (!cancelled) timer = setTimeout(checkBaseNetwork, 30000) }
    }
    checkBaseNetwork()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

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
      if (chainId !== BASE_CHAIN_ID) throw new Error('Please switch your wallet to Base Mainnet.')
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
  const creatorCounts = publishedTokens.reduce((map, token) => { const key = token.creator_wallet || 'Unknown creator'; map[key] = (map[key] || 0) + 1; return map }, {})
  const topCreators = Object.entries(creatorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

  if (authOpen && !session) return <Auth onBack={() => setAuthOpen(false)} onAuthenticated={next => { setSession(next); setAuthOpen(false) }} />

  return (
    <main className="launch-app">
      <aside className="sidebar">
        <a className="launch-brand" href="#" onClick={e => { e.preventDefault(); setActive('overview') }}><span className="brand-mark brand-mark-duo"><img src="/vicexa-duo-avatar.svg" alt="VICEXA duo" /></span><span>VICEXA<small>LAUNCHPAD</small></span></a>
        <div className="network-pill"><span/> BASE MAINNET <ChevronDown size={13}/></div>
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
          <div className="top-actions"><span className="top-network"><i/> BASE MAINNET</span><button className="icon-button" aria-label="Notifications"><Bell size={17}/></button><button className="auth-top-button" onClick={() => session ? signOut() : setAuthOpen(true)}>{session ? 'Sign out' : 'Sign in'}</button><button className="wallet-button" onClick={connectWallet} disabled={walletBusy}><Wallet size={16}/>{walletBusy ? 'CONNECTING…' : shortAddress || 'Connect wallet'}</button></div>
        </header>

        <div className="launch-content">
          {walletError && <div className="launch-alert"><span>{walletError}</span><button onClick={() => setWalletError('')} aria-label="Dismiss"><X size={15}/></button></div>}
          {notice && <div className="launch-alert success-alert"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}

          {active === 'overview' && <>
            <div className="launch-welcome"><div><div className="launch-eyebrow"><span/> THE BASE ECOSYSTEM, ONE TOKEN AT A TIME</div><h1>BUILD WHAT'S<br/><span className="launch-gradient">NEXT.</span></h1><p>Create and configure your own token for Base with a simple, guided workflow.</p><div className="welcome-actions"><button className="launch-primary" onClick={() => setActive('explore')}>Explore launches <ArrowUpRight size={16}/></button><button className="launch-secondary" onClick={() => setActive('create')}>Create a token <Plus size={16}/></button></div></div><div className="welcome-visual"><div className="visual-ring ring-a"/><div className="visual-ring ring-b"/><div className="visual-wordmark" aria-label="VICEXA">VICEXA</div><span className="visual-caption">BUILT ON BASE MAINNET / 8453</span></div></div>
            <div className="metric-grid"><div className="metric-card"><span>NETWORK</span><b>BASE MAINNET</b><small>Production network · Chain ID 8453</small></div><div className="metric-card"><span>DEPLOYED TOKENS</span><b>{publishedTokens.length}</b><small>Confirmed Clanker V5 tokens on Base</small></div><div className="metric-card"><span>YOUR TOKEN DRAFTS</span><b>{drafts.length}</b><small>Browser-only drafts · not yet launched</small></div></div>
            <section className="market-strip">
              <div className="market-heading"><div><div className="launch-eyebrow"><span/> MARKET PULSE</div><h2>THE CITY IS MOVING.</h2></div><span className="market-live"><i/> DIRECTORY SYNC</span></div>
              <div className="market-grid">
                <article className="market-tile"><span><Activity size={15}/> CONFIRMED LAUNCHES</span><b>{publishedTokens.length.toLocaleString('en-US')}</b><small>Verified VICEXA listings on Base</small></article>
                <article className="market-tile"><span><TrendingUp size={15}/> MARKET CAP</span><b className="market-pending">DATA PENDING</b><small>Waiting for a verified market feed</small></article>
                <article className="market-tile"><span><Radio size={15}/> 24H VOLUME</span><b className="market-pending">DATA PENDING</b><small>No volume estimate is displayed</small></article>
                <article className="market-tile"><span><Wifi size={15}/> BASE NETWORK</span><b className={baseStatus === 'online' ? 'network-online' : 'market-pending'}>{baseStatus === 'online' ? 'OPERATIONAL' : baseStatus === 'checking' ? 'CHECKING…' : 'UNAVAILABLE'}</b><small>{baseBlock ? 'Latest block #' + baseBlock : 'Live RPC connection status'}</small></article>
              </div>
            </section>
            <div className="content-heading"><div><div className="launch-eyebrow">TRENDING ON BASE</div><h2>Recently confirmed</h2></div><button className="text-action" onClick={() => setActive('explore')}>Explore all <ArrowUpRight size={14}/></button></div>
            <div className="feature-token-grid">
              {publishedTokens.length ? publishedTokens.slice(0, 3).map((token, index) => (
                <article className="feature-token-card" key={token.id}>
                  <div className="feature-token-top"><span className="feature-rank">0{index + 1}</span><span className="status-chip">CONFIRMED</span></div>
                  <div className="feature-token-symbol">{(token.token_symbol || 'T').slice(0, 1)}</div>
                  <b>{token.token_name}</b><span className="feature-ticker">{token.token_symbol ? ' $' + token.token_symbol : ''}</span>
                  <p>{token.description || 'Confirmed Clanker V5 launch on Base Mainnet.'}</p>
                  <a href={'https://basescan.org/token/' + token.expected_token_address} target="_blank" rel="noreferrer">View on BaseScan <ArrowUpRight size={13}/></a>
                </article>
              )) : <div className="feature-empty"><TrendingUp size={19}/><div><b>Waiting for the first confirmed launch</b><p>Newly confirmed tokens will appear here automatically. No sample tokens or invented rankings.</p></div></div>}
            </div>
            <div className="content-heading"><div><div className="launch-eyebrow">DISCOVER</div><h2>Explore tokens</h2></div><button className="text-action" onClick={() => setActive('explore')}>View all <ArrowUpRight size={14}/></button></div>
            <div className="empty-launch-card"><div className="empty-icon"><Rocket size={22}/></div><div><b>{publishedTokens.length ? 'Latest confirmed launches' : 'No confirmed tokens yet'}</b><p>{publishedTokens.length ? 'Explore verified Clanker V5 deployments currently listed on Base Mainnet.' : 'The Base Mainnet token directory is online. Successfully confirmed Clanker V5 launches will appear here automatically.'}</p></div><span className="status-chip">DIRECTORY ONLINE</span></div>
            <div className="content-heading"><div><div className="launch-eyebrow">HOW IT WORKS</div><h2>From configuration to token</h2></div></div>
            <div className="steps-grid"><div><span>01</span><b>Prepare</b><p>Enter your token name, symbol, supply, and decimals.</p></div><div><span>02</span><b>Review</b><p>Review the token configuration and deployment details.</p></div><div><span>03</span><b>Launch</b><p>Deploy through the Clanker V5 protocol after reviewing the wallet transaction.</p></div></div>
          </>}

          {active === 'explore' && <section className="page-section"><div className="launch-eyebrow"><span/> BASE MAINNET TOKEN DIRECTORY</div><h1 className="page-title">EXPLORE<br/><span className="launch-gradient">TOKENS.</span></h1><p className="page-lead">Discover verified Clanker V5 tokens launched through VICEXA.</p>
            {directoryLoading && <div className="large-empty"><h2>Loading token directory…</h2><p>Checking confirmed Base Mainnet launches.</p></div>}
            {directoryError && <div className="launch-alert"><span>Token directory unavailable: {directoryError}</span><button onClick={() => { setDirectoryLoading(true); setDirectoryError(''); supabase?.from('token_launches').select('id, token_name, token_symbol, description, token_image_url, expected_token_address, transaction_hash, creator_wallet, confirmed_at, created_at').eq('chain_id', 8453).eq('status', 'confirmed').not('expected_token_address', 'is', null).order('confirmed_at', { ascending: false }).then(({ data, error }) => { if (error) setDirectoryError(error.message); else setPublishedTokens(data || []); setDirectoryLoading(false) }).catch(error => { setDirectoryError(error.message || 'Could not load the token directory.'); setDirectoryLoading(false) }) }} aria-label="Retry token directory"><ArrowUpRight size={15}/></button></div>}
            {publishedTokens.length > 0 && <div className="draft-list">{publishedTokens.map(token => <article className="draft-card" key={token.id}><div className="draft-token">{(token.token_symbol || 'T').slice(0,1)}</div><div className="draft-info"><b>{token.token_name} <span>${token.token_symbol}</span></b><p>{token.description || 'Verified Clanker V5 token on Base Mainnet.'}</p><small>CONFIRMED ON BASE MAINNET · {token.expected_token_address?.slice(0,8)}…{token.expected_token_address?.slice(-6)}</small><p><a href={'https://basescan.org/token/' + token.expected_token_address} target="_blank" rel="noreferrer">BaseScan</a> · <a href={'https://www.clanker.world/clanker/' + token.expected_token_address} target="_blank" rel="noreferrer">Clanker</a></p></div><span className="status-chip">LIVE</span></article>)}</div>}
            
            {!directoryLoading && !directoryError && publishedTokens.length === 0 && <div className="large-empty"><div className="empty-icon"><Search size={24}/></div><h2>No tokens listed yet</h2><p>Successfully confirmed Base Mainnet deployments will appear here automatically.</p><button className="launch-primary" onClick={() => setActive('create')}>Create a token <Plus size={16}/></button></div>}
          </section>}

          {active === 'create' && <TokenFactory account={account} onSaveDraft={saveTokenDraft} session={session}/>}

        </div>
        <footer className="launch-footer"><span>© {new Date().getFullYear()} VICEXA</span><span>POWERED BY BASE MAINNET <span className="footer-dot">·</span> BUILT FOR WHAT'S NEXT</span><a href="https://basescan.org/" target="_blank" rel="noreferrer">BASESCAN <ExternalLink size={12}/></a></footer>
      </section>
    </main>
  )
}

export default App
}{token.token_symbol}</span><p>{token.description || 'Confirmed Clanker V5 launch on Base Mainnet.'}</p><a href={'https://basescan.org/token/' + token.expected_token_address} target="_blank" rel="noreferrer">View on BaseScan <ArrowUpRight size={13}/></a></article>) : <div className="feature-empty"><TrendingUp size={19}/><div><b>Waiting for the first confirmed launch</b><p>Newly confirmed tokens will appear here automatically. No sample tokens or invented rankings.</p></div></div>}
            </div>
            <div className="content-heading"><div><div className="launch-eyebrow">VICEXA SPOTLIGHT</div><h2>Featured launches</h2></div></div>
            <div className="spotlight-panel"><div className="spotlight-art"><span>V</span><small>VICE CITY · BASE</small></div><div className="spotlight-copy"><span className="spotlight-kicker">THE NEXT WAVE STARTS HERE</span><h3>Make your mark<br/>on the chain.</h3><p>Discover confirmed launches or create your own token with the VICEXA guided launch flow.</p><div className="welcome-actions"><button className="launch-primary" onClick={() => setActive('explore')}>Explore launches <ArrowUpRight size={15}/></button><button className="launch-secondary" onClick={() => setActive('create')}>Start a launch <Plus size={15}/></button></div></div></div>
            <div className="content-heading"><div><div className="launch-eyebrow">COMMUNITY</div><h2>Top creators</h2></div><span className="market-live">BY CONFIRMED LAUNCHES</span></div>
            <div className="creator-panel">{topCreators.length ? topCreators.map(([creator, count], index) => <div className="creator-row" key={creator}><span className="creator-medal"><Crown size={15}/></span><span className="creator-address">{creator === 'Unknown creator' ? creator : creator.slice(0, 6) + '…' + creator.slice(-4)}</span><span className="creator-count">{count} {count === 1 ? 'launch' : 'launches'}</span><span className="creator-position">#{index + 1}</span></div>) : <div className="creator-empty">Creator rankings will appear after the first confirmed token launch.</div>}</div>
            <div className="network-banner"><div><span className="launch-eyebrow"><span/> BUILT ON BASE MAINNET</span><b>One network. Infinite possibilities.</b><small>Chain ID 8453 · Ethereum Layer 2</small></div><div className="network-banner-status"><span className={baseStatus === 'online' ? 'network-status-dot online' : 'network-status-dot'}/>{baseStatus === 'online' ? 'NETWORK OPERATIONAL' : baseStatus === 'checking' ? 'CHECKING NETWORK' : 'RPC UNAVAILABLE'}<small>{baseBlock ? 'Block #' + baseBlock : 'Live network check'}</small></div></div>
            <div className="content-heading"><div><div className="launch-eyebrow">DISCOVER</div><h2>Explore tokens</h2></div><button className="text-action" onClick={() => setActive('explore')}>View all <ArrowUpRight size={14}/></button></div>
            <div className="empty-launch-card"><div className="empty-icon"><Rocket size={22}/></div><div><b>{publishedTokens.length ? 'Latest confirmed launches' : 'No confirmed tokens yet'}</b><p>{publishedTokens.length ? 'Explore verified Clanker V5 deployments currently listed on Base Mainnet.' : 'The Base Mainnet token directory is online. Successfully confirmed Clanker V5 launches will appear here automatically.'}</p></div><span className="status-chip">DIRECTORY ONLINE</span></div>
            <div className="content-heading"><div><div className="launch-eyebrow">HOW IT WORKS</div><h2>From configuration to token</h2></div></div>
            <div className="steps-grid"><div><span>01</span><b>Prepare</b><p>Enter your token name, symbol, supply, and decimals.</p></div><div><span>02</span><b>Review</b><p>Review the token configuration and deployment details.</p></div><div><span>03</span><b>Launch</b><p>Deploy through the Clanker V5 protocol after reviewing the wallet transaction.</p></div></div>
          </>}

          {active === 'explore' && <section className="page-section"><div className="launch-eyebrow"><span/> BASE MAINNET TOKEN DIRECTORY</div><h1 className="page-title">EXPLORE<br/><span className="launch-gradient">TOKENS.</span></h1><p className="page-lead">Discover verified Clanker V5 tokens launched through VICEXA.</p>
            {directoryLoading && <div className="large-empty"><h2>Loading token directory…</h2><p>Checking confirmed Base Mainnet launches.</p></div>}
            {directoryError && <div className="launch-alert"><span>Token directory unavailable: {directoryError}</span><button onClick={() => { setDirectoryLoading(true); setDirectoryError(''); supabase?.from('token_launches').select('id, token_name, token_symbol, description, token_image_url, expected_token_address, transaction_hash, creator_wallet, confirmed_at, created_at').eq('chain_id', 8453).eq('status', 'confirmed').not('expected_token_address', 'is', null).order('confirmed_at', { ascending: false }).then(({ data, error }) => { if (error) setDirectoryError(error.message); else setPublishedTokens(data || []); setDirectoryLoading(false) }).catch(error => { setDirectoryError(error.message || 'Could not load the token directory.'); setDirectoryLoading(false) }) }} aria-label="Retry token directory"><ArrowUpRight size={15}/></button></div>}
            {publishedTokens.length > 0 && <div className="draft-list">{publishedTokens.map(token => <article className="draft-card" key={token.id}><div className="draft-token">{(token.token_symbol || 'T').slice(0,1)}</div><div className="draft-info"><b>{token.token_name} <span>${token.token_symbol}</span></b><p>{token.description || 'Verified Clanker V5 token on Base Mainnet.'}</p><small>CONFIRMED ON BASE MAINNET · {token.expected_token_address?.slice(0,8)}…{token.expected_token_address?.slice(-6)}</small><p><a href={'https://basescan.org/token/' + token.expected_token_address} target="_blank" rel="noreferrer">BaseScan</a> · <a href={'https://www.clanker.world/clanker/' + token.expected_token_address} target="_blank" rel="noreferrer">Clanker</a></p></div><span className="status-chip">LIVE</span></article>)}</div>}
            
            {!directoryLoading && !directoryError && publishedTokens.length === 0 && <div className="large-empty"><div className="empty-icon"><Search size={24}/></div><h2>No tokens listed yet</h2><p>Successfully confirmed Base Mainnet deployments will appear here automatically.</p><button className="launch-primary" onClick={() => setActive('create')}>Create a token <Plus size={16}/></button></div>}
          </section>}

          {active === 'create' && <TokenFactory account={account} onSaveDraft={saveTokenDraft} session={session}/>}

        </div>
        <footer className="launch-footer"><span>© {new Date().getFullYear()} VICEXA</span><span>POWERED BY BASE MAINNET <span className="footer-dot">·</span> BUILT FOR WHAT'S NEXT</span><a href="https://basescan.org/" target="_blank" rel="noreferrer">BASESCAN <ExternalLink size={12}/></a></footer>
      </section>
    </main>
  )
}

export default App
