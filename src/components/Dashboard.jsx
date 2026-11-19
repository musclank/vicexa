import { ArrowUpRight, Cpu, Layers3, LogOut, Wallet } from 'lucide-react'

export default function Dashboard({ session, onSignOut }) {
  const email = session?.user?.email || 'VICEXA member'
  const name = session?.user?.user_metadata?.full_name || email.split('@')[0]
  const items = [
    { icon: Cpu, title: 'AI TOOLKIT', detail: 'Your future AI workspace', status: 'COMING SOON' },
    { icon: Wallet, title: 'CRYPTO ACCESS', detail: 'Wallet and payment features', status: 'PLANNED' },
    { icon: Layers3, title: 'WEB3 ECOSYSTEM', detail: 'Connected decentralized tools', status: 'PLANNED' },
  ]
  return <main className="dashboard-shell">
    <header className="dashboard-nav wrap"><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-mark">V</span> VICEXA</a><button className="signout-button" onClick={onSignOut}><LogOut size={16}/> Sign out</button></header>
    <section className="dashboard-content wrap">
      <div className="eyebrow"><span className="pulse"/> MEMBER WORKSPACE</div>
      <h1>WELCOME TO<br/><span className="gradient-text">{name.toUpperCase()}.</span></h1>
      <p className="dashboard-email">{email}</p>
      <div className="dashboard-banner"><div><span className="eyebrow">VICEXA / OVERVIEW</span><h2>Your digital workspace starts here.</h2><p>Your account is active. Platform tools are being developed and will appear here as they become available.</p></div><div className="dashboard-orb">V</div></div>
      <div className="dashboard-section-head"><div><div className="eyebrow">YOUR ECOSYSTEM</div><h2>EXPLORE MODULES.</h2></div><span>01 — 03</span></div>
      <div className="dashboard-cards">{items.map(({icon: Icon,title,detail,status}) => <article className="dashboard-card" key={title}><Icon size={23}/><h3>{title}</h3><p>{detail}</p><span>{status}</span></article>)}</div>
      <p className="dashboard-footnote"><ArrowUpRight size={14}/> New modules will be announced as they become available.</p>
    </section>
  </main>
}
