import { useState } from 'react'
import { createPublicClient, createWalletClient, custom, http, getAddress } from 'viem'
import { base } from 'viem/chains'
import { Clanker, SEND_UNCERTAIN } from 'clanker-sdk/v5'
import { ArrowRight, Check, CircleAlert, Coins, ExternalLink, ShieldCheck, Wallet, LoaderCircle } from 'lucide-react'
const initialForm = { name: '', symbol: '', image: '', description: '', website: '', x: '', telegram: '', buyFee: '1', sellFee: '1' }
export default function TokenFactory({ account, onSaveDraft, session }) {
  const [form, setForm] = useState(initialForm); const [saved, setSaved] = useState(false); const [error, setError] = useState(''); const [txBusy, setTxBusy] = useState(false); const [txHash, setTxHash] = useState(''); const [tokenAddress, setTokenAddress] = useState(''); const [launchStatus, setLaunchStatus] = useState(''); const [launchRecordId, setLaunchRecordId] = useState(''); const [expectedTokenAddress, setExpectedTokenAddress] = useState('')
  const update = (key, value) => { setSaved(false); setError(''); setForm(current => ({ ...current, [key]: value })) }
  const validateLink = (value, label, allowIpfs = false) => {
    if (!value.trim()) return
    let parsed
    try { parsed = new URL(value.trim()) } catch { throw new Error(label + ' must be a valid URL.') }
    const allowed = allowIpfs ? ['https:', 'ipfs:'] : ['https:']
    if (!allowed.includes(parsed.protocol) || (parsed.protocol === 'https:' && !parsed.hostname.includes('.'))) {
      throw new Error(label + ' must use a valid HTTPS URL' + (allowIpfs ? ' or IPFS URL.' : '.'))
    }
  }
  const validate = () => {
    const name = form.name.trim(); const symbol = form.symbol.trim().toUpperCase(); const buyFee = Number(form.buyFee); const sellFee = Number(form.sellFee)
    if (!name || name.length > 64) throw new Error('Token name must contain 1–64 characters.')
    if (!/^[A-Z0-9]{2,16}$/.test(symbol)) throw new Error('Symbol must contain 2–16 uppercase letters or numbers.')
    if (![buyFee, sellFee].every(v => Number.isInteger(v) && v >= 1 && v <= 10)) throw new Error('Buy and sell tax settings must each be between 1% and 10%. The live factory policy applies.')
    validateLink(form.image, 'Token image', true)
    validateLink(form.website, 'Website')
    validateLink(form.x, 'X profile')
    validateLink(form.telegram, 'Telegram')
    if (form.description.length > 500) throw new Error('Description must be 500 characters or fewer.')
    return { name, symbol, buyFee, sellFee }
  }
  function saveDraft(event) { event.preventDefault(); try { const v = validate(); onSaveDraft({ name: v.name, ticker: v.symbol, image: form.image.trim(), description: form.description.trim(), website: form.website.trim(), x: form.x.trim(), telegram: form.telegram.trim(), buyFee: v.buyFee, sellFee: v.sellFee, type: 'clanker-v5', status: 'draft' }); setSaved(true); setError('') } catch (e) { setError(e.message) } }
  async function updateServerRecord(id, payload) { const response = await fetch('/api/launch-intents', { method: 'PATCH', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ id, ...payload }) }); if (!response.ok) throw new Error('The on-chain action finished, but VICEXA could not update its launch record. Check the transaction before retrying.') }
  async function retryVerification() {
    if (!launchRecordId || !txHash || !expectedTokenAddress || !session?.access_token) return
    setTxBusy(true); setError(''); setLaunchStatus('RETRYING VERIFICATION')
    try {
      await updateServerRecord(launchRecordId, { status: 'confirmed', txHash, expectedAddress: expectedTokenAddress, tokenAddress: expectedTokenAddress })
      setTokenAddress(expectedTokenAddress); setLaunchStatus('CONFIRMED')
    } catch (e) {
      setLaunchStatus('CONFIRMATION PENDING')
      setError(e.message || 'Verification is still pending. Do not submit another launch.')
    } finally { setTxBusy(false) }
  }
  async function createToken() {
    setError(''); setTxHash(''); setTokenAddress(''); setLaunchStatus(''); setLaunchRecordId(''); setExpectedTokenAddress('')
    if (!session?.access_token) { setError('Sign in to VICEXA before launching a token.'); return }
    if (!account || !window.ethereum) { setError('Connect an EVM wallet before launching.'); return }
    let v; try { v = validate() } catch (e) { setError(e.message); return }
    setTxBusy(true); let launchId = ''; let sentTxHash = ''
    try {
      const [chainId, walletAccounts] = await Promise.all([
        window.ethereum.request({ method: 'eth_chainId' }),
        window.ethereum.request({ method: 'eth_accounts' }),
      ])
      if (chainId !== '0x2105') throw new Error('Switch your wallet to Base Mainnet before launching.')
      const activeWallet = walletAccounts?.[0] ? getAddress(walletAccounts[0]) : ''
      if (!activeWallet || activeWallet.toLowerCase() !== getAddress(account).toLowerCase()) {
        throw new Error('The active wallet account changed. Reconnect your wallet and try again.')
      }
      const approved = window.confirm(
        'Review your token launch on Base Mainnet.\n\n' +
        'Name: ' + v.name + '\n' +
        'Symbol: 
      const intentResponse = await fetch('/api/launch-intents', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ name: v.name, symbol: v.symbol, image: form.image.trim(), description: form.description.trim(), creatorWallet: getAddress(account) }) })
      const intent = await intentResponse.json(); if (!intentResponse.ok) throw new Error(intent.error || 'Could not prepare the launch record.')
      launchId = intent.launch.id; setLaunchRecordId(launchId); setLaunchStatus('AWAITING WALLET APPROVAL')
      const wallet = createWalletClient({ account: getAddress(account), chain: base, transport: custom(window.ethereum) })
      const publicClient = createPublicClient({ chain: base, transport: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org') })
      const clanker = new Clanker({ wallet, publicClient })
      const metadata = { description: form.description.trim(), socialMediaUrls: [ ...(form.website ? [{ platform: 'website', url: form.website.trim() }] : []), ...(form.x ? [{ platform: 'x', url: form.x.trim() }] : []), ...(form.telegram ? [{ platform: 'telegram', url: form.telegram.trim() }] : []) ] }
      const deployment = await clanker.deploy({ name: v.name, symbol: v.symbol, ...(form.image.trim() ? { image: form.image.trim() } : {}), metadata, buyFee: v.buyFee, sellFee: v.sellFee, context: { interface: 'VICEXA', platform: 'VICEXA Launchpad' } })
      if (deployment.error) throw deployment.error
      sentTxHash = deployment.txHash; setTxHash(sentTxHash); setExpectedTokenAddress(deployment.expectedAddress); setLaunchStatus('TRANSACTION SUBMITTED'); await updateServerRecord(launchId, { status: 'submitted', txHash: sentTxHash, expectedAddress: deployment.expectedAddress })
      const receipt = await deployment.waitForTransaction()
      if (receipt.error) { setLaunchStatus('CONFIRMATION PENDING'); throw receipt.error }
      setTokenAddress(receipt.address); setLaunchStatus('CONFIRMED'); await updateServerRecord(launchId, { status: 'confirmed', txHash: sentTxHash, expectedAddress: deployment.expectedAddress, tokenAddress: receipt.address })
    } catch (e) {
      const message = e?.shortMessage || e?.message || 'Clanker V5 deployment failed.'
      if (launchId && !sentTxHash && e?.data?.rawName === SEND_UNCERTAIN) { try { await updateServerRecord(launchId, { status: 'pending_indexing' }) } catch {} }
      else if (launchId && !sentTxHash) { try { await updateServerRecord(launchId, { status: 'failed', message }) } catch {} }
      if (e?.data?.rawName === SEND_UNCERTAIN) { setLaunchStatus('TRANSACTION STATUS UNKNOWN'); setError('The wallet or RPC response was interrupted during submission. Do not retry yet. Check your wallet activity and BaseScan first.') } else if (sentTxHash && launchStatus !== 'CONFIRMED') { setLaunchStatus('CONFIRMATION PENDING'); setError('The transaction was submitted, but VICEXA could not yet verify the launch receipt. Do not launch again. Check BaseScan and retry confirmation later.') } else setError(message)
    } finally { setTxBusy(false) }
  }
  const symbol = form.symbol.trim().toUpperCase(); const txUrl = txHash ? 'https://basescan.org/tx/' + txHash : ''; const tokenUrl = tokenAddress ? 'https://basescan.org/token/' + tokenAddress : ''
  return <section className="page-section token-factory-page">
    <div className="launch-eyebrow"><span/> CLANKER V5 · BASE MAINNET</div><h1 className="page-title">CREATE YOUR<br/><span className="launch-gradient">TOKEN.</span></h1><p className="page-lead">Launch a Clanker V5 token on Base. Your wallet approves the transaction; VICEXA records the launch.</p>
    <div className="factory-layout"><form className="create-form factory-form" onSubmit={saveDraft}>
      <div className="form-heading"><b>Token configuration</b><span>STEP 01 / 02</span></div>
      <label>TOKEN NAME<input required maxLength={64} placeholder="e.g. Frontier Token" value={form.name} onChange={e => update('name', e.target.value)}/></label>
      <label>TOKEN SYMBOL<input required maxLength={16} placeholder="e.g. FRONT" value={form.symbol} onChange={e => update('symbol', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}/><small>2–16 uppercase letters or numbers.</small></label>
      <label>TOKEN IMAGE URL <span className="optional">OPTIONAL</span><input type="text" inputMode="url" placeholder="https://… or ipfs://…" value={form.image} onChange={e => update('image', e.target.value)}/></label>
      <label>DESCRIPTION <span className="optional">OPTIONAL</span><textarea rows={4} maxLength={500} placeholder="Describe your token and its purpose." value={form.description} onChange={e => update('description', e.target.value)}/><small>{form.description.length}/500 characters</small></label>
      <label>WEBSITE <span className="optional">OPTIONAL</span><input type="url" placeholder="https://yourproject.xyz" value={form.website} onChange={e => update('website', e.target.value)}/></label>
      <label>X PROFILE <span className="optional">OPTIONAL</span><input type="url" placeholder="https://x.com/yourproject" value={form.x} onChange={e => update('x', e.target.value)}/></label>
      <label>TELEGRAM <span className="optional">OPTIONAL</span><input type="url" placeholder="https://t.me/yourproject" value={form.telegram} onChange={e => update('telegram', e.target.value)}/></label>
      <div className="factory-field-grid"><label>BUY TAX<select value={form.buyFee} onChange={e => update('buyFee', e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}%</option>)}</select></label><label>SELL TAX<select value={form.sellFee} onChange={e => update('sellFee', e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}%</option>)}</select></label></div>
      {error && <div className="factory-error" role="alert"><CircleAlert size={15}/>{error}</div>}{txHash && expectedTokenAddress && launchRecordId && launchStatus !== 'CONFIRMED' && <button className="launch-primary submit-draft" type="button" onClick={retryVerification} disabled={txBusy}> {txBusy ? 'VERIFYING…' : 'Retry transaction verification'} </button>}{saved && <div className="factory-saved" role="status"><Check size={15}/> Token configuration saved as a local draft.</div>}{launchStatus && <div className="factory-tx-link">LAUNCH STATUS: {launchStatus}</div>}
      {tokenAddress && <div className="factory-saved launch-success-panel" role="status"><Check size={15}/> Token successfully confirmed on Base: <a href={tokenUrl} target="_blank" rel="noreferrer">{tokenAddress.slice(0,8)}…{tokenAddress.slice(-6)} <ExternalLink size={12}/></a> · <a href={'https://www.clanker.world/clanker/' + tokenAddress} target="_blank" rel="noreferrer">Clanker <ExternalLink size={12}/></a></div>}{txUrl && <div className="factory-tx-link">Transaction: <a href={txUrl} target="_blank" rel="noreferrer">{txHash.slice(0,10)}…{txHash.slice(-6)} <ExternalLink size={12}/></a></div>}
      <button className="launch-primary submit-draft" type="submit">Save token draft <ArrowRight size={16}/></button><button className="launch-primary submit-draft factory-deploy-button" type="button" onClick={createToken} disabled={txBusy || !account || !session}>{txBusy ? <><LoaderCircle size={16} className="factory-spinner"/> LAUNCHING…</> : <>Launch on Base Mainnet <ArrowRight size={16}/></>}</button>
      <p className="form-disclaimer">Mainnet launch uses real ETH for gas. VICEXA checks the active wallet account and Base network, then asks for confirmation before opening your wallet. Review the exact transaction and every wallet prompt before approving. Clanker V5 has a fixed protocol-controlled supply and live factory policies.</p>
    </form><aside className="factory-side"><div className="token-preview"><div className="token-preview-top"><span>LIVE PREVIEW</span><Coins size={17}/></div><div className="token-coin">{symbol.slice(0,1) || 'V'}</div><h2>{form.name.trim() || 'Your Token'}</h2><div className="token-symbol">{symbol ? '$' + symbol : '$SYMBOL'}</div><div className="token-supply"><span>BUY / SELL TAX</span><b>{form.buyFee}% / {form.sellFee}%</b></div><div className="token-supply"><span>NETWORK</span><b>BASE · 8453</b></div><div className="token-network"><i/> CLANKER V5 · MAINNET</div></div>
      <div className="factory-status-panel"><ShieldCheck size={21}/><b>Wallet-signed Clanker V5 launch</b><p>VICEXA prepares and records the launch. Clanker SDK submits the V5 deployment through your connected wallet. VICEXA never handles your private key.</p><div className="factory-status-tag">BASE MAINNET · REAL TRANSACTION</div></div><div className="factory-wallet-panel"><Wallet size={17}/><div><b>{account ? 'Wallet connected' : 'Wallet not connected'}</b><small>{account ? account.slice(0,6) + '…' + account.slice(-4) : 'Connect a Base-compatible wallet from the top bar.'}</small></div></div>{!session && <div className="factory-error">Sign in to VICEXA to create a tracked launch.</div>}
      <a className="factory-doc-link" href="https://docs.clanker.world/" target="_blank" rel="noreferrer">Clanker V5 documentation <ExternalLink size={13}/></a><a className="factory-doc-link" href="https://basescan.org/" target="_blank" rel="noreferrer">Base Mainnet explorer <ExternalLink size={13}/></a></aside></div></section>
} + v.symbol + '\n' +
        'Buy tax: ' + v.buyFee + '% · Sell tax: ' + v.sellFee + '%\n' +
        'Wallet: ' + activeWallet + '\n\n' +
        'This submits a real Clanker V5 deployment transaction and uses ETH for gas. Continue to the wallet for final review?'
      )
      if (!approved) { setTxBusy(false); return }
      const intentResponse = await fetch('/api/launch-intents', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ name: v.name, symbol: v.symbol, image: form.image.trim(), description: form.description.trim(), creatorWallet: getAddress(account) }) })
      const intent = await intentResponse.json(); if (!intentResponse.ok) throw new Error(intent.error || 'Could not prepare the launch record.')
      launchId = intent.launch.id; setLaunchRecordId(launchId); setLaunchStatus('AWAITING WALLET APPROVAL')
      const wallet = createWalletClient({ account: getAddress(account), chain: base, transport: custom(window.ethereum) })
      const publicClient = createPublicClient({ chain: base, transport: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org') })
      const clanker = new Clanker({ wallet, publicClient })
      const metadata = { description: form.description.trim(), socialMediaUrls: [ ...(form.website ? [{ platform: 'website', url: form.website.trim() }] : []), ...(form.x ? [{ platform: 'x', url: form.x.trim() }] : []), ...(form.telegram ? [{ platform: 'telegram', url: form.telegram.trim() }] : []) ] }
      const deployment = await clanker.deploy({ name: v.name, symbol: v.symbol, ...(form.image.trim() ? { image: form.image.trim() } : {}), metadata, buyFee: v.buyFee, sellFee: v.sellFee, context: { interface: 'VICEXA', platform: 'VICEXA Launchpad' } })
      if (deployment.error) throw deployment.error
      sentTxHash = deployment.txHash; setTxHash(sentTxHash); setExpectedTokenAddress(deployment.expectedAddress); setLaunchStatus('TRANSACTION SUBMITTED'); await updateServerRecord(launchId, { status: 'submitted', txHash: sentTxHash, expectedAddress: deployment.expectedAddress })
      const receipt = await deployment.waitForTransaction()
      if (receipt.error) { setLaunchStatus('CONFIRMATION PENDING'); throw receipt.error }
      setTokenAddress(receipt.address); setLaunchStatus('CONFIRMED'); await updateServerRecord(launchId, { status: 'confirmed', txHash: sentTxHash, expectedAddress: deployment.expectedAddress, tokenAddress: receipt.address })
    } catch (e) {
      const message = e?.shortMessage || e?.message || 'Clanker V5 deployment failed.'
      if (launchId && !sentTxHash && e?.data?.rawName === SEND_UNCERTAIN) { try { await updateServerRecord(launchId, { status: 'pending_indexing' }) } catch {} }
      else if (launchId && !sentTxHash) { try { await updateServerRecord(launchId, { status: 'failed', message }) } catch {} }
      if (e?.data?.rawName === SEND_UNCERTAIN) { setLaunchStatus('TRANSACTION STATUS UNKNOWN'); setError('The wallet or RPC response was interrupted during submission. Do not retry yet. Check your wallet activity and BaseScan first.') } else if (sentTxHash && launchStatus !== 'CONFIRMED') { setLaunchStatus('CONFIRMATION PENDING'); setError('The transaction was submitted, but VICEXA could not yet verify the launch receipt. Do not launch again. Check BaseScan and retry confirmation later.') } else setError(message)
    } finally { setTxBusy(false) }
  }
  const symbol = form.symbol.trim().toUpperCase(); const txUrl = txHash ? 'https://basescan.org/tx/' + txHash : ''; const tokenUrl = tokenAddress ? 'https://basescan.org/token/' + tokenAddress : ''
  return <section className="page-section token-factory-page">
    <div className="launch-eyebrow"><span/> CLANKER V5 · BASE MAINNET</div><h1 className="page-title">CREATE YOUR<br/><span className="launch-gradient">TOKEN.</span></h1><p className="page-lead">Launch a Clanker V5 token on Base. Your wallet approves the transaction; VICEXA records the launch.</p>
    <div className="factory-layout"><form className="create-form factory-form" onSubmit={saveDraft}>
      <div className="form-heading"><b>Token configuration</b><span>STEP 01 / 02</span></div>
      <label>TOKEN NAME<input required maxLength={64} placeholder="e.g. Frontier Token" value={form.name} onChange={e => update('name', e.target.value)}/></label>
      <label>TOKEN SYMBOL<input required maxLength={16} placeholder="e.g. FRONT" value={form.symbol} onChange={e => update('symbol', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}/><small>2–16 uppercase letters or numbers.</small></label>
      <label>TOKEN IMAGE URL <span className="optional">OPTIONAL</span><input type="url" placeholder="https://… or ipfs://…" value={form.image} onChange={e => update('image', e.target.value)}/></label>
      <label>DESCRIPTION <span className="optional">OPTIONAL</span><textarea rows={4} maxLength={500} placeholder="Describe your token and its purpose." value={form.description} onChange={e => update('description', e.target.value)}/><small>{form.description.length}/500 characters</small></label>
      <label>WEBSITE <span className="optional">OPTIONAL</span><input type="url" placeholder="https://yourproject.xyz" value={form.website} onChange={e => update('website', e.target.value)}/></label>
      <label>X PROFILE <span className="optional">OPTIONAL</span><input type="url" placeholder="https://x.com/yourproject" value={form.x} onChange={e => update('x', e.target.value)}/></label>
      <label>TELEGRAM <span className="optional">OPTIONAL</span><input type="url" placeholder="https://t.me/yourproject" value={form.telegram} onChange={e => update('telegram', e.target.value)}/></label>
      <div className="factory-field-grid"><label>BUY TAX<select value={form.buyFee} onChange={e => update('buyFee', e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}%</option>)}</select></label><label>SELL TAX<select value={form.sellFee} onChange={e => update('sellFee', e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}%</option>)}</select></label></div>
      {error && <div className="factory-error" role="alert"><CircleAlert size={15}/>{error}</div>}{txHash && expectedTokenAddress && launchRecordId && launchStatus !== 'CONFIRMED' && <button className="launch-primary submit-draft" type="button" onClick={retryVerification} disabled={txBusy}> {txBusy ? 'VERIFYING…' : 'Retry transaction verification'} </button>}{saved && <div className="factory-saved" role="status"><Check size={15}/> Token configuration saved as a local draft.</div>}{launchStatus && <div className="factory-tx-link">LAUNCH STATUS: {launchStatus}</div>}
      {tokenAddress && <div className="factory-saved" role="status"><Check size={15}/> Token confirmed: <a href={tokenUrl} target="_blank" rel="noreferrer">{tokenAddress.slice(0,8)}…{tokenAddress.slice(-6)} <ExternalLink size={12}/></a> · <a href={'https://www.clanker.world/clanker/' + tokenAddress} target="_blank" rel="noreferrer">Clanker <ExternalLink size={12}/></a></div>}{txUrl && <div className="factory-tx-link">Transaction: <a href={txUrl} target="_blank" rel="noreferrer">{txHash.slice(0,10)}…{txHash.slice(-6)} <ExternalLink size={12}/></a></div>}
      <button className="launch-primary submit-draft" type="submit">Save token draft <ArrowRight size={16}/></button><button className="launch-primary submit-draft factory-deploy-button" type="button" onClick={createToken} disabled={txBusy || !account || !session}>{txBusy ? <><LoaderCircle size={16} className="factory-spinner"/> LAUNCHING…</> : <>Launch on Base Mainnet <ArrowRight size={16}/></>}</button>
      <p className="form-disclaimer">Mainnet launch uses real ETH for gas. Review the token configuration and every wallet prompt before approving. Clanker V5 has a fixed protocol-controlled supply and live factory policies.</p>
    </form><aside className="factory-side"><div className="token-preview"><div className="token-preview-top"><span>LIVE PREVIEW</span><Coins size={17}/></div><div className="token-coin">{symbol.slice(0,1) || 'V'}</div><h2>{form.name.trim() || 'Your Token'}</h2><div className="token-symbol">{symbol ? '$' + symbol : '$SYMBOL'}</div><div className="token-supply"><span>BUY / SELL TAX</span><b>{form.buyFee}% / {form.sellFee}%</b></div><div className="token-supply"><span>NETWORK</span><b>BASE · 8453</b></div><div className="token-network"><i/> CLANKER V5 · MAINNET</div></div>
      <div className="factory-status-panel"><ShieldCheck size={21}/><b>Wallet-signed Clanker V5 launch</b><p>VICEXA prepares and records the launch. Clanker SDK submits the V5 deployment through your connected wallet. VICEXA never handles your private key.</p><div className="factory-status-tag">BASE MAINNET · REAL TRANSACTION</div></div><div className="factory-wallet-panel"><Wallet size={17}/><div><b>{account ? 'Wallet connected' : 'Wallet not connected'}</b><small>{account ? account.slice(0,6) + '…' + account.slice(-4) : 'Connect a Base-compatible wallet from the top bar.'}</small></div></div>{!session && <div className="factory-error">Sign in to VICEXA to create a tracked launch.</div>}
      <a className="factory-doc-link" href="https://docs.clanker.world/" target="_blank" rel="noreferrer">Clanker V5 documentation <ExternalLink size={13}/></a><a className="factory-doc-link" href="https://basescan.org/" target="_blank" rel="noreferrer">Base Mainnet explorer <ExternalLink size={13}/></a></aside></div></section>
}