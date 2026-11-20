import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, Bell, BookOpen, ChevronDown, CircleHelp, Compass, Crown, ExternalLink, FileText, Flame, LayoutDashboard, Lock, LogOut, MessageCircle, Plus, Radio, Rocket, Search, ShieldCheck, Sparkles, TrendingUp, Wallet, Wifi, X } from 'lucide-react'
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
  { id: 'docs', label: 'Documentation', icon: BookOpen },
  { id: 'terms', label: 'Terms of Service', icon: FileText },
  { id: 'privacy', label: 'Privacy Policy', icon: Lock },
  { id: 'risk', label: 'Risk Disclaimer', icon: ShieldCheck },
  { id: 'faq', label: 'FAQ', icon: CircleHelp },
  { id: 'support', label: 'Support', icon: MessageCircle },
]


const infoPages = {
  docs: {
    eyebrow: 'VICEXA KNOWLEDGE BASE',
    title: 'DOCUMENTATION',
    intro: 'A practical guide to exploring tokens and preparing a token launch on Base with VICEXA.',
    sections: [
      { heading: '1. Getting started', paragraphs: ['VICEXA is a token launchpad interface for the Base Mainnet. You can browse confirmed token listings, prepare a token configuration, and review the available launch flow.'] , bullets: ['Use a compatible EVM wallet such as MetaMask or Coinbase Wallet.', 'Select Base Mainnet (Chain ID 8453) in your wallet when prompted.', 'Never share your seed phrase or private keys with anyone. VICEXA will never ask you to disclose them.'] },
      { heading: '2. Connect your wallet', paragraphs: ['Select “Connect wallet” and approve the connection request in your wallet. The app requests your public wallet address and may ask you to switch to Base Mainnet. A wallet connection alone does not submit a transaction or deploy a token.'] },
      { heading: '3. Explore tokens', paragraphs: ['The Explore Tokens directory displays launches that have been confirmed and indexed by VICEXA. Select a token to inspect its available details and use the BaseScan or Clanker links when provided to verify on-chain information. Listing status is not an endorsement of a token.'] },
      { heading: '4. Prepare a token', paragraphs: ['Open “Create a token” and complete the fields shown in the token configuration flow. Review the token name, symbol, supply, decimals, fees, and any other transaction parameters presented by the interface before continuing. Available options may change as the integration evolves.'] },
      { heading: '5. Review and authorize', paragraphs: ['Read the wallet confirmation screen carefully. Check the network, transaction destination, permissions, and estimated network fee. Only approve a transaction you understand. Blockchain transactions are generally irreversible once confirmed.'] },
      { heading: '6. Launch status', paragraphs: ['A token should be treated as launched only after its deployment is confirmed on-chain. Preparing a configuration does not deploy a token.'] },
      { heading: '7. Network and data', paragraphs: ['VICEXA is designed for Base Mainnet. Token listings depend on successful indexing and the availability of the configured services. Market metrics may be unavailable until a reliable data provider is connected; VICEXA will label unavailable metrics rather than invent values.'] }
    ]
  },
  terms: {
    eyebrow: 'LEGAL',
    title: 'TERMS OF SERVICE',
    intro: 'These terms govern your access to and use of the VICEXA website and related launchpad interfaces.',
    sections: [
      { heading: '1. Acceptance and updates', paragraphs: ['By accessing or using VICEXA, you agree to these Terms. If you do not agree, do not use the platform. We may update these Terms as the service changes; the revised version will be posted here with an updated date.'] },
      { heading: '2. Platform description', paragraphs: ['VICEXA provides software interfaces for discovering token information and preparing token launch transactions on Base. Features may rely on third-party protocols, wallets, RPC providers, indexing services, and infrastructure that VICEXA does not control. Features may change, be interrupted, or become unavailable.'] },
      { heading: '3. Eligibility and lawful use', paragraphs: ['You are responsible for ensuring that you are legally permitted to access the platform and use digital asset services in your jurisdiction. You must comply with applicable laws, regulations, sanctions, and third-party terms. Do not use VICEXA for fraud, market manipulation, unlawful activity, or infringement of another person’s rights.'] },
      { heading: '4. Wallets and transactions', paragraphs: ['You control your wallet and private keys. VICEXA does not custody your assets or have the ability to reverse blockchain transactions. You are responsible for verifying transaction details, network fees, token parameters, and the destination address before signing. A displayed estimate or status may be delayed or inaccurate.'] },
      { heading: '5. No financial, legal, or tax advice', paragraphs: ['Content on VICEXA is provided for general informational and technical purposes only. Nothing on the platform is an offer, solicitation, recommendation, or personalized advice to buy, sell, or hold any asset. Obtain independent professional advice where appropriate.'] },
      { heading: '6. Third-party services', paragraphs: ['The platform may link to or integrate with third-party products and protocols, including wallet providers, Base, BaseScan, and Clanker. Those services are governed by their own terms and policies. VICEXA is not responsible for third-party services, smart contracts, or their availability.'] },
      { heading: '7. Disclaimers and limitation', paragraphs: ['The platform is provided “as is” and “as available”, to the extent permitted by law. We do not guarantee uninterrupted access, error-free operation, token performance, liquidity, security, or the accuracy and completeness of third-party data. To the maximum extent permitted by applicable law, VICEXA disclaims liability for indirect or consequential loss arising from use of the platform. Nothing in these Terms excludes liability that cannot lawfully be excluded.'] },
      { heading: '8. Suspension and contact', paragraphs: ['We may restrict access where reasonably necessary to protect the platform, users, or comply with law. For questions about these Terms, contact the VICEXA team through the Support page and the project’s public GitHub issue tracker.'] }
    ]
  },
  privacy: {
    eyebrow: 'LEGAL',
    title: 'PRIVACY POLICY',
    intro: 'This policy explains the types of information that may be processed when you use VICEXA. The final practices depend on the services and configuration active on the deployed site.',
    sections: [
      { heading: '1. Information you provide', paragraphs: ['If you create an account or contact support, information you submit may include an email address, profile details, and the contents of your message. Do not submit passwords, seed phrases, private keys, or sensitive personal information.'] },
      { heading: '2. Wallet and public blockchain data', paragraphs: ['If you connect a wallet, the public wallet address may be processed to establish the connection and prepare transactions. Wallet addresses and blockchain transactions are public by design and may be visible on public explorers. VICEXA cannot make public blockchain activity private.'] },
      
      { heading: '4. Service providers', paragraphs: ['VICEXA may rely on configured infrastructure providers for authentication, database hosting, blockchain RPC access, token indexing, and deployment. Information processed by those providers is subject to their own privacy terms and the configuration selected by the platform operator.'] },
      { heading: '5. Use and retention', paragraphs: ['Information may be used to operate the platform, provide account features, display token listings, respond to support requests, maintain security, and meet legal obligations. Retention periods depend on the data type and the provider settings.'] },
      { heading: '6. Your choices and security', paragraphs: ['You can disconnect your wallet through your wallet provider and sign out of your VICEXA account where that feature is available. No internet-connected service can guarantee absolute security; protect your devices and credentials.'] },
      { heading: '7. Changes and contact', paragraphs: ['This policy may be updated when VICEXA features or service providers change. For privacy questions or requests, contact the VICEXA team through the Support page. Applicable privacy rights may vary by your location.'] }
    ]
  },
  risk: {
    eyebrow: 'IMPORTANT INFORMATION',
    title: 'RISK DISCLAIMER',
    intro: 'Digital assets and blockchain transactions involve substantial risk. Read this notice before using token discovery or launch features.',
    sections: [
      { heading: 'No investment advice', paragraphs: ['VICEXA does not provide investment, financial, legal, or tax advice. Token listings, creator information, interface labels, and educational content are not recommendations or endorsements. You are solely responsible for your decisions.'] },
      { heading: 'Token and market risks', bullets: ['A token may lose some or all of its value.', 'A token may have little or no liquidity, and you may be unable to sell it.', 'Token creators, metadata, supply, ownership, and project claims may be incomplete or misleading.', 'Smart contracts may contain vulnerabilities, malicious functions, or unexpected behavior.', 'Market prices and third-party data can be delayed, inaccurate, manipulated, or unavailable.'] },
      { heading: 'Blockchain and wallet risks', bullets: ['Transactions are generally irreversible after confirmation.', 'Sending assets to the wrong address or using the wrong network may result in permanent loss.', 'Network congestion, fees, outages, wallet errors, and protocol changes may affect transactions.', 'Never disclose your seed phrase or private keys and carefully inspect every wallet signature.'] },
      { heading: 'Independent verification', paragraphs: ['Before interacting with a token, verify its contract address, deployment transaction, contract behavior, creator claims, and liquidity using independent sources. A “confirmed” or “listed” status only describes the platform’s indexing state; it does not mean that a token is safe, audited, legitimate, or suitable for you.'] },
      { heading: 'Use at your own risk', paragraphs: ['Only interact with digital assets if you understand the risks and can afford a total loss. Consider seeking independent professional advice. Use of VICEXA is at your own risk, subject to applicable law.'] }
    ]
  },
  faq: {
    eyebrow: 'HELP CENTER',
    title: 'FREQUENTLY ASKED QUESTIONS',
    intro: 'Quick answers about wallets, token listings, and the VICEXA launch flow.',
    sections: [
      { heading: 'Which network does VICEXA support?', paragraphs: ['VICEXA is configured for Base Mainnet, Chain ID 8453. Check that your wallet is on the correct network before signing a transaction.'] },
      { heading: 'Does connecting a wallet deploy a token?', paragraphs: ['No. Connecting a wallet only establishes a wallet connection. A deployment requires a separate transaction that you must review and approve in your wallet.'] },
      { heading: 'Why does Explore show no tokens?', paragraphs: ['The directory lists confirmed and indexed launches. If no qualifying launch has been indexed, the page will show an empty state. Indexing may take time after an on-chain transaction.'] },
      
      { heading: 'Why are market cap or volume unavailable?', paragraphs: ['Those metrics require a verified market-data source. VICEXA may show a pending state until a reliable feed is configured; do not interpret pending data as zero.'] },
      { heading: 'Can a confirmed token be considered safe?', paragraphs: ['No. Confirmation means the listing has met the platform’s indexing criteria. It is not an audit, endorsement, or guarantee of safety, liquidity, or value.'] },
      { heading: 'What if a transaction fails?', paragraphs: ['Check your wallet network, available balance for network fees, and the transaction status on BaseScan. Do not repeatedly sign transactions you do not understand. If the issue persists, send the public transaction hash and a description through Support. Never send private keys or recovery phrases.'] }
    ]
  },
  support: {
    eyebrow: 'VICEXA SUPPORT',
    title: 'HOW CAN WE HELP?',
    intro: 'For help with the interface, report a bug, or suggest an improvement. Never include private keys, recovery phrases, passwords, or other secrets in a support request.',
    sections: [
      { heading: 'Report a bug or request a feature', paragraphs: ['Use the public VICEXA GitHub issue tracker to report reproducible bugs and request improvements. Include the page, steps to reproduce, expected behavior, actual behavior, and screenshots with personal information removed.'] },
      { heading: 'Transaction support', paragraphs: ['For a transaction-related report, include the public transaction hash and the wallet/network involved. Transaction hashes and wallet addresses are public blockchain information. Do not share a seed phrase or private key.'] },
      { heading: 'Before contacting support', bullets: ['Confirm your wallet is connected to Base Mainnet (Chain ID 8453).', 'Refresh the page and check whether the issue can be reproduced.', 'Check the transaction on BaseScan if you already submitted it.', 'Remove personal or confidential information from screenshots and logs.'] }
    ]
  }
}

function InfoPage({ page }) {
  return <section className="page-section info-page">
    <div className="launch-eyebrow"><span/> {page.eyebrow}</div>
    <h1 className="page-title info-title">{page.title}</h1>
    <p className="page-lead">{page.intro}</p>
    <div className="info-meta">LAST UPDATED: NOVEMBER 20, 2026 <span>·</span> VICEXA</div>
    <div className="info-sections">
      {page.sections.map((section, index) => <article className="info-card" key={section.heading}>
        <h2>{section.heading}</h2>
        {section.paragraphs?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {section.bullets && <ul>{section.bullets.map((item, i) => <li key={i}>{item}</li>)}</ul>}
      </article>)}
    </div>
    {page.title === 'HOW CAN WE HELP?' && <a className="launch-primary support-link" href="https://github.com/musclank/vicexa/issues" target="_blank" rel="noreferrer">Open VICEXA support on GitHub <ArrowUpRight size={15}/></a>}
    <p className="info-note">These pages are general platform information and are not a substitute for legal advice. Have the terms and privacy practices reviewed for the jurisdictions and services in which VICEXA operates before public commercial use.</p>
  </section>
}

function App() {
  const [session, setSession] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [active, setActive] = useState('overview')
  const [account, setAccount] = useState('')
  const [walletBusy, setWalletBusy] = useState(false)
  const [walletError, setWalletError] = useState('')
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

  const shortAddress = account ? account.slice(0, 6) + '...' + account.slice(-4) : ''
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0]
  const creatorCounts = publishedTokens.reduce((map, token) => { const key = token.creator_wallet || 'Unknown creator'; map[key] = (map[key] || 0) + 1; return map }, {})
  const topCreators = Object.entries(creatorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

  if (authOpen && !session) return <Auth onBack={() => setAuthOpen(false)} onAuthenticated={next => { setSession(next); setAuthOpen(false) }} />

  return (
    <main className="launch-app">
      <aside className="sidebar">
        <a className="launch-brand" href="#" onClick={e => { e.preventDefault(); setActive('overview') }}><span className="brand-mark brand-mark-duo"><img src="/vicexa-duo-avatar.svg" alt="VICEXA duo" /></span><span className="brand-wordmark">VICEXA<small>LAUNCHPAD</small></span></a>
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
            <div className="metric-grid"><div className="metric-card"><span>NETWORK</span><b>BASE MAINNET</b><small>Production network · Chain ID 8453</small></div><div className="metric-card"><span>DEPLOYED TOKENS</span><b>{publishedTokens.length}</b><small>Confirmed Clanker V5 tokens on Base</small></div></div>
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
          <div className="content-heading"><div><div className="launch-eyebrow">VICEXA SPOTLIGHT</div><h2>Featured launches</h2></div></div>
            <div className="spotlight-panel"><div className="spotlight-art"><span>V</span><small>VICE CITY · BASE</small></div><div className="spotlight-copy"><span className="spotlight-kicker">THE NEXT WAVE STARTS HERE</span><h3>Make your mark<br/>on the chain.</h3><p>Discover confirmed launches or create your own token with the VICEXA guided launch flow.</p><div className="welcome-actions"><button className="launch-primary" onClick={() => setActive('explore')}>Explore launches <ArrowUpRight size={15}/></button><button className="launch-secondary" onClick={() => setActive('create')}>Start a launch <Plus size={15}/></button></div></div></div>
            <div className="content-heading"><div><div className="launch-eyebrow">COMMUNITY</div><h2>Top creators</h2></div><span className="market-live">BY CONFIRMED LAUNCHES</span></div>
            <div className="creator-panel">{topCreators.length ? topCreators.map(([creator, count], index) => <div className="creator-row" key={creator}><span className="creator-medal"><Crown size={15}/></span><span className="creator-address">{creator === 'Unknown creator' ? creator : creator.slice(0, 6) + '…' + creator.slice(-4)}</span><span className="creator-count">{count} {count === 1 ? 'launch' : 'launches'}</span><span className="creator-position">#{index + 1}</span></div>) : <div className="creator-empty">Creator rankings will appear after the first confirmed token launch.</div>}</div>
            <div className="network-banner"><div><span className="launch-eyebrow"><span/> BUILT ON BASE MAINNET</span><b>One network. Infinite possibilities.</b><small>Chain ID 8453 · Ethereum Layer 2</small></div><div className="network-banner-status"><span className={baseStatus === 'online' ? 'network-status-dot online' : 'network-status-dot'}/>{baseStatus === 'online' ? 'NETWORK OPERATIONAL' : baseStatus === 'checking' ? 'CHECKING NETWORK' : 'RPC UNAVAILABLE'}<small>{baseBlock ? 'Block #' + baseBlock : 'Live network check'}</small></div></div>
            
          </>}

          {active === 'explore' && <section className="page-section"><div className="launch-eyebrow"><span/> BASE MAINNET TOKEN DIRECTORY</div><h1 className="page-title">EXPLORE<br/><span className="launch-gradient">TOKENS.</span></h1><p className="page-lead">Discover verified Clanker V5 tokens launched through VICEXA.</p>
            {directoryLoading && <div className="large-empty"><h2>Loading token directory…</h2><p>Checking confirmed Base Mainnet launches.</p></div>}
            {directoryError && <div className="launch-alert"><span>Token directory unavailable: {directoryError}</span><button onClick={() => { setDirectoryLoading(true); setDirectoryError(''); supabase?.from('token_launches').select('id, token_name, token_symbol, description, token_image_url, expected_token_address, transaction_hash, creator_wallet, confirmed_at, created_at').eq('chain_id', 8453).eq('status', 'confirmed').not('expected_token_address', 'is', null).order('confirmed_at', { ascending: false }).then(({ data, error }) => { if (error) setDirectoryError(error.message); else setPublishedTokens(data || []); setDirectoryLoading(false) }).catch(error => { setDirectoryError(error.message || 'Could not load the token directory.'); setDirectoryLoading(false) }) }} aria-label="Retry token directory"><ArrowUpRight size={15}/></button></div>}
            {publishedTokens.length > 0 && <div className="draft-list">{publishedTokens.map(token => <article className="draft-card" key={token.id}><div className="draft-token">{(token.token_symbol || 'T').slice(0,1)}</div><div className="draft-info"><b>{token.token_name} <span>${token.token_symbol}</span></b><p>{token.description || 'Verified Clanker V5 token on Base Mainnet.'}</p><small>CONFIRMED ON BASE MAINNET · {token.expected_token_address?.slice(0,8)}…{token.expected_token_address?.slice(-6)}</small><p><a href={'https://basescan.org/token/' + token.expected_token_address} target="_blank" rel="noreferrer">BaseScan</a> · <a href={'https://www.clanker.world/clanker/' + token.expected_token_address} target="_blank" rel="noreferrer">Clanker</a></p></div><span className="status-chip">LIVE</span></article>)}</div>}
            
            {!directoryLoading && !directoryError && publishedTokens.length === 0 && <div className="large-empty"><div className="empty-icon"><Search size={24}/></div><h2>No tokens listed yet</h2><p>Successfully confirmed Base Mainnet deployments will appear here automatically.</p><button className="launch-primary" onClick={() => setActive('create')}>Create a token <Plus size={16}/></button></div>}
          </section>}

          {active === 'create' && <TokenFactory account={account} session={session}/>}
          {infoPages[active] && <InfoPage page={infoPages[active]} />}

        </div>
        <footer className="launch-footer"><span>© {new Date().getFullYear()} VICEXA</span><span className="footer-links">{['docs','terms','privacy','risk','faq','support'].map(id => <button key={id} onClick={() => { setActive(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{navItems.find(item => item.id === id).label}</button>)}</span><span>POWERED BY BASE MAINNET</span><a href="https://basescan.org/" target="_blank" rel="noreferrer">BASESCAN <ExternalLink size={12}/></a></footer>
      </section>
    </main>
  )
}

export default App
