import { useMemo, useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { ArrowRight, Check, CircleAlert, Coins, ExternalLink, ShieldCheck, Wallet, LoaderCircle } from 'lucide-react'

const FACTORY_ADDRESS = import.meta.env.VITE_BASE_SEPOLIA_FACTORY_ADDRESS || ''
const BASE_SEPOLIA_CHAIN_ID = 84532
const FACTORY_ABI = [
  'function createToken(string tokenName,string tokenSymbol,uint256 initialSupply,uint8 tokenDecimals) returns (address tokenAddress)',
  'event TokenCreated(address indexed token,address indexed creator,string name,string symbol,uint256 initialSupply,uint8 decimals)',
]

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
  const [txBusy, setTxBusy] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')

  const formattedSupply = useMemo(() => {
    if (!/^\d+$/.test(form.supply)) return '—'
    try { return new Intl.NumberFormat('en-US').format(BigInt(form.supply)) } catch { return '—' }
  }, [form.supply])

  function update(key, value) {
    setSaved(false)
    setError('')
    setTxHash('')
    setTokenAddress('')
    setForm(current => ({ ...current, [key]: value }))
  }

  function validate() {
    const name = form.name.trim()
    const symbol = form.symbol.trim().toUpperCase()
    const supplyText = form.supply.trim()
    const decimals = Number(form.decimals)
    if (!name || name.length > 48 || !symbol || !/^[A-Z0-9]{2,10}$/.test(symbol)) {
      throw new Error('Enter a token name (up to 48 characters) and a symbol containing 2–10 uppercase letters or numbers.')
    }
    if (!/^\d+$/.test(supplyText) || BigInt(supplyText) <= 0n) {
      throw new Error('Enter a whole-number token supply greater than zero.')
    }
    const maxSupply = ((1n << 256n) - 1n) / (10n ** BigInt(decimals))
    if (BigInt(supplyText) > maxSupply) throw new Error('This supply is too large for the selected decimals.')
    if (form.description.trim().length > 500) throw new Error('Description must be 500 characters or fewer.')
    return { name, symbol, supply: BigInt(supplyText), decimals }
  }

  function saveDraft(event) {
    event.preventDefault()
    setError('')
    try {
      const values = validate()
      onSaveDraft({
        name: values.name,
        ticker: values.symbol,
        description: form.description.trim(),
        website: form.website.trim(),
        supply: values.supply.toString(),
        decimals: values.decimals,
        type: 'token',
        status: 'draft',
      })
      setSaved(true)
    } catch (validationError) {
      setError(validationError.message)
    }
  }

  async function createToken() {
    setError('')
    setTxHash('')
    setTokenAddress('')
    if (!account || !window.ethereum) {
      setError('Connect an EVM wallet before creating a token.')
      return
    }
    if (!FACTORY_ADDRESS || !/^0x[a-fA-F0-9]{40}$/.test(FACTORY_ADDRESS)) {
      setError('The VICEXA Base Sepolia factory address is not configured yet. Deployment is not available until the factory contract is deployed and its address is added to the site environment.')
      return
    }

    let values
    try {
      values = validate()
    } catch (validationError) {
      setError(validationError.message)
      return
    }

    setTxBusy(true)
    try {
      const provider = new BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID) {
        throw new Error('Switch your wallet to Base Sepolia before submitting this transaction.')
      }
      const signer = await provider.getSigner()
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer)
      const tx = await factory.createToken(values.name, values.symbol, values.supply, values.decimals)
      setTxHash(tx.hash)
      const receipt = await tx.wait()
      let created = ''
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log)
          if (parsed?.name === 'TokenCreated') {
            created = parsed.args.token
            break
          }
        } catch { /* Ignore logs emitted by the newly created token. */ }
      }
      if (!created) throw new Error('Transaction confirmed, but the token address could not be read from the factory event. Check the transaction on BaseScan.')
      setTokenAddress(created)
    } catch (txError) {
      setError(txError.shortMessage || txError.reason || txError.message || 'Token creation failed.')
    } finally {
      setTxBusy(false)
    }
  }

  return (
    <section className="page-section token-factory-page">
      <div className="launch-eyebrow"><span/> BASE SEPOLIA TOKEN FACTORY</div>
      <h1 className="page-title">CREATE YOUR<br/><span className="launch-gradient">TOKEN.</span></h1>
      <p className="page-lead">Configure a fixed-supply ERC-20 token and test its deployment on Base Sepolia.</p>

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
              <input required inputMode="numeric" type="text" placeholder="1000000000" value={form.supply} onChange={e => update('supply', e.target.value.replace(/\D/g, ''))}/>
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
          {tokenAddress && <div className="factory-saved" role="status"><Check size={15}/> Token deployed: <a href={`https://sepolia.basescan.org/address/${tokenAddress}`} target="_blank" rel="noreferrer">{tokenAddress.slice(0, 8)}…{tokenAddress.slice(-6)} <ExternalLink size={12}/></a></div>}
          {txHash && <div className="factory-tx-link">Transaction: <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash.slice(0, 10)}…{txHash.slice(-6)} <ExternalLink size={12}/></a></div>}
          <button className="launch-primary submit-draft" type="submit">Save token draft <ArrowRight size={16}/></button>
          <button className="launch-primary submit-draft factory-deploy-button" type="button" onClick={createToken} disabled={txBusy || !account || !FACTORY_ADDRESS}>
            {txBusy ? <><LoaderCircle size={16} className="factory-spinner"/> WAITING FOR CONFIRMATION…</> : <>Create token on Base Sepolia <ArrowRight size={16}/></>}
          </button>
          <p className="form-disclaimer">Testnet only. Creating a token requires a deployed factory contract, a connected wallet, and a transaction confirmation. Test ETH has no real-world value.</p>
        </form>

        <aside className="factory-side">
          <div className="token-preview">
            <div className="token-preview-top"><span>LIVE PREVIEW</span><Coins size={17}/></div>
            <div className="token-coin">{form.symbol.trim().slice(0, 1).toUpperCase() || 'V'}</div>
            <h2>{form.name.trim() || 'Your Token'}</h2>
            <div className="token-symbol">{form.symbol.trim() ? '$' + form.symbol.trim().toUpperCase() : '$SYMBOL'}</div>
            <div className="token-supply"><span>INITIAL SUPPLY</span><b>{formattedSupply}</b></div>
            <div className="token-supply"><span>DECIMALS</span><b>{form.decimals}</b></div>
            <div className="token-network"><i/> BASE SEPOLIA · CHAIN 84532</div>
          </div>
          <div className="factory-status-panel">
            <ShieldCheck size={21}/>
            <b>{FACTORY_ADDRESS ? 'Testnet deployment configured' : 'Factory contract address required'}</b>
            <p>{FACTORY_ADDRESS ? 'The site is configured to call the VICEXA factory on Base Sepolia. Confirm you are using a test wallet with test ETH.' : 'The wallet flow is prepared, but token creation stays disabled until the factory contract is deployed to Base Sepolia and VITE_BASE_SEPOLIA_FACTORY_ADDRESS is configured in Cloudflare Pages.'}</p>
            <div className="factory-status-tag">BASE SEPOLIA · TESTNET ONLY</div>
          </div>
          <div className="factory-wallet-panel">
            <Wallet size={17}/>
            <div><b>{account ? 'Wallet connected' : 'Wallet not connected'}</b><small>{account ? account.slice(0, 6) + '…' + account.slice(-4) : 'Connect a Base-compatible wallet from the top bar.'}</small></div>
          </div>
          <a className="factory-doc-link" href="https://docs.base.org/chain/network-faucets" target="_blank" rel="noreferrer">Get Base Sepolia test ETH <ExternalLink size={13}/></a>
          <a className="factory-doc-link" href="https://sepolia.basescan.org/" target="_blank" rel="noreferrer">Base Sepolia explorer <ExternalLink size={13}/></a>
        </aside>
      </div>
    </section>
  )
}
