import { useMemo, useState } from 'react'
import { ArrowRight, Check, CircleAlert, Coins, ExternalLink, ShieldCheck, Wallet } from 'lucide-react'

const initialForm = {
  name: '',
  symbol: '',
  supply: '1000000000',
  decimals: '18',
  description: '',
  website: '',
}

export default function TokenFactory({ account, onSaveDraft }) {
  const [form, setForm] = useState(initialForm)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const formattedSupply = useMemo(() => {
    if (!/^\\d+$/.test(form.supply)) return '—'
    try { return new Intl.NumberFormat('en-US').format(BigInt(form.supply)) } catch { return '—' }
  }, [form.supply])

  function update(key, value) {
    setSaved(false)
    setError('')
    setForm(current => ({ ...current, [key]: value }))
  }

  function saveDraft(event) {
    event.preventDefault()
    setError('')
    const name = form.name.trim()
    const symbol = form.symbol.trim().toUpperCase()
    const supplyText = form.supply.trim()
    const decimals = Number(form.decimals)
    if (!name || !symbol || !/^[A-Z0-9]{2,10}$/.test(symbol)) {
      setError('Enter a token name and a symbol containing 2–10 letters or numbers.')
      return
    }
    if (!Number.isFinite(supply) || supply <= 0 || !/^\d+(\.\d+)?$/.test(form.supply.trim())) {
      setError('Enter a valid total supply greater than zero.')
      return
    }
    if (form.description.trim().length > 500) {
      setError('Description must be 500 characters or fewer.')
      return
    }
    onSaveDraft({
      name,
      ticker: symbol,
      description: form.description.trim(),
      website: form.website.trim(),
      supply: supplyText,
      decimals,
      type: 'token',
      status: 'draft',
    })
    setSaved(true)
  }

  return (
    <section className="page-section token-factory-page">
      <div className="launch-eyebrow"><span/> BASE TOKEN FACTORY</div>
      <h1 className="page-title">CREATE YOUR<br/><span className="launch-gradient">TOKEN.</span></h1>
      <p className="page-lead">Configure a standard token for Base. Review the details and save your setup as a draft.</p>

      <div className="factory-layout">
        <form className="create-form factory-form" onSubmit={saveDraft}>
          <div className="form-heading"><b>Token configuration</b><span>STEP 01 / 02</span></div>
          <label>TOKEN NAME
            <input required maxLength={48} placeholder="e.g. Frontier Token" value={form.name} onChange={e => update('name', e.target.value)}/>
          </label>
          <label>TOKEN SYMBOL
            <input required maxLength={10} placeholder="e.g. FRONT" value={form.symbol} onChange={e => update('symbol', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}/>
            <small>2–10 letters or numbers. Displayed with a $ prefix.</small>
          </label>
          <div className="factory-field-grid">
            <label>TOTAL SUPPLY
              <input required inputMode="decimal" type="text" placeholder="1000000000" value={form.supply} onChange={e => update('supply', e.target.value.replace(/\\D/g, ''))}/>
              <small>Whole-token amount before decimals are applied.</small>
            </label>
            <label>TOKEN DECIMALS
              <select value={form.decimals} onChange={e => update('decimals', e.target.value)}>
                <option value="18">18 — Standard</option>
                <option value="9">9</option>
                <option value="6">6</option>
                <option value="0">0</option>
              </select>
              <small>18 is the common ERC-20 setting.</small>
            </label>
          </div>
          <label>DESCRIPTION <span className="optional">OPTIONAL</span>
            <textarea rows={4} maxLength={500} placeholder="Describe your token and its purpose." value={form.description} onChange={e => update('description', e.target.value)}/>
            <small>{form.description.length}/500 characters</small>
          </label>
          <label>WEBSITE <span className="optional">OPTIONAL</span>
            <input type="url" placeholder="https://yourproject.xyz" value={form.website} onChange={e => update('website', e.target.value)}/>
          </label>
          {error && <div className="factory-error" role="alert"><CircleAlert size={15}/>{error}</div>}
          {saved && <div className="factory-saved" role="status"><Check size={15}/> Token configuration saved to your drafts in this browser.</div>}
          <button className="launch-primary submit-draft" type="submit">Save token draft <ArrowRight size={16}/></button>
          <p className="form-disclaimer">This saves configuration only. It does not deploy a contract, mint tokens, or send a transaction.</p>
        </form>

        <aside className="factory-side">
          <div className="token-preview">
            <div className="token-preview-top"><span>LIVE PREVIEW</span><Coins size={17}/></div>
            <div className="token-coin">{form.symbol.trim().slice(0, 1).toUpperCase() || 'V'}</div>
            <h2>{form.name.trim() || 'Your Token'}</h2>
            <div className="token-symbol">{form.symbol.trim() ? '$' + form.symbol.trim().toUpperCase() : '$SYMBOL'}</div>
            <div className="token-supply"><span>INITIAL SUPPLY</span><b>{formattedSupply}</b></div>
            <div className="token-supply"><span>DECIMALS</span><b>{form.decimals}</b></div>
            <div className="token-network"><i/> BASE MAINNET · CHAIN 8453</div>
          </div>
          <div className="factory-status-panel">
            <ShieldCheck size={21}/>
            <b>Deployment is not enabled yet</b>
            <p>The token factory smart contract must be implemented, tested on Base Sepolia, and independently reviewed before mainnet deployment is enabled.</p>
            <div className="factory-status-tag">FACTORY CONTRACT · IN DEVELOPMENT</div>
          </div>
          <div className="factory-wallet-panel">
            <Wallet size={17}/>
            <div><b>{account ? 'Wallet connected' : 'Wallet not connected'}</b><small>{account ? account.slice(0, 6) + '…' + account.slice(-4) : 'Connect a Base-compatible wallet from the top bar when you are ready.'}</small></div>
          </div>
          <a className="factory-doc-link" href="https://docs.base.org/" target="_blank" rel="noreferrer">Base developer documentation <ExternalLink size={13}/></a>
        </aside>
      </div>
    </section>
  )
}
