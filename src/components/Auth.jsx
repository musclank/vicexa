import { useState } from 'react'
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export default function Auth({ onBack, onAuthenticated }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
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

  async function signInWithGoogle() {
    setMessage('')
    if (!isSupabaseConfigured) {
      setMessage('Authentication is not connected yet. Check your Supabase environment variables in Cloudflare Pages.')
      return
    }
    setGoogleBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (error) {
      setMessage(error.message || 'Google sign-in could not be started. Please try again.')
      setGoogleBusy(false)
    }
  }

  return <main className="account-shell">
    <button className="account-back" onClick={onBack}><ArrowLeft size={16}/> Back to VICEXA</button>
    <section className="account-panel">
      <div className="account-symbol">V</div>
      <div className="eyebrow">YOUR VICEXA IDENTITY</div>
      <h1>{mode === 'signin' ? 'WELCOME BACK.' : 'JOIN THE FRONTIER.'}</h1>
      <p className="account-intro">{mode === 'signin' ? 'Sign in to access your VICEXA workspace.' : 'Create an account to get started with the VICEXA ecosystem.'}</p>
      <button className="google-auth-button" type="button" onClick={signInWithGoogle} disabled={googleBusy || busy}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.42 37.98 46.98 31.8 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.55 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        {googleBusy ? 'CONNECTING TO GOOGLE…' : 'CONTINUE WITH GOOGLE'}
      </button>
      <div className="account-divider"><span>OR CONTINUE WITH EMAIL</span></div>
      <form onSubmit={submit} className="account-form">
        {mode === 'signup' && <label><span>FULL NAME</span><div className="field-wrap"><UserRound size={17}/><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" required/></div></label>}
        <label><span>EMAIL ADDRESS</span><div className="field-wrap"><Mail size={17}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
        <label><span>PASSWORD</span><div className="field-wrap"><LockKeyhole size={17}/><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required/></div></label>
        <button className="button primary account-submit" disabled={busy || googleBusy}>{busy ? 'PLEASE WAIT…' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
      </form>
      {message && <p className="account-message" role="status">{message}</p>}
      <p className="account-switch">{mode === 'signin' ? "New to VICEXA?" : 'Already have an account?'} <button onClick={() => {setMode(mode === 'signin' ? 'signup' : 'signin');setMessage('')}}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
      <small className="account-secure">SECURE ACCOUNT ACCESS · POWERED BY SUPABASE</small>
    </section>
  </main>
}
