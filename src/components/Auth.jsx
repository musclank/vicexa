import { useState } from 'react'
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export default function Auth({ onBack, onAuthenticated }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    if (!isSupabaseConfigured) {
      setMessage('Authentication is not connected yet. Add your Supabase project URL and publishable key in Cloudflare Pages environment variables.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        if (data.session) onAuthenticated(data.session)
        else setMessage('Account created. Check your email to confirm your address, then sign in.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onAuthenticated(data.session)
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="account-shell">
    <button className="account-back" onClick={onBack}><ArrowLeft size={16}/> Back to VICEXA</button>
    <section className="account-panel">
      <div className="account-symbol">V</div>
      <div className="eyebrow">YOUR VICEXA IDENTITY</div>
      <h1>{mode === 'signin' ? 'WELCOME BACK.' : 'JOIN THE FRONTIER.'}</h1>
      <p className="account-intro">{mode === 'signin' ? 'Sign in to access your VICEXA workspace.' : 'Create an account to get started with the VICEXA ecosystem.'}</p>
      <form onSubmit={submit} className="account-form">
        {mode === 'signup' && <label><span>FULL NAME</span><div className="field-wrap"><UserRound size={17}/><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" required/></div></label>}
        <label><span>EMAIL ADDRESS</span><div className="field-wrap"><Mail size={17}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
        <label><span>PASSWORD</span><div className="field-wrap"><LockKeyhole size={17}/><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required/></div></label>
        <button className="button primary account-submit" disabled={busy}>{busy ? 'PLEASE WAIT…' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
      </form>
      {message && <p className="account-message" role="status">{message}</p>}
      <p className="account-switch">{mode === 'signin' ? "New to VICEXA?" : 'Already have an account?'} <button onClick={() => {setMode(mode === 'signin' ? 'signup' : 'signin');setMessage('')}}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
      <small className="account-secure">SECURE ACCOUNT ACCESS · POWERED BY SUPABASE</small>
    </section>
  </main>
}
