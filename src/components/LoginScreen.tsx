import { useState } from 'react'
import { type GitHubUser } from '../lib/github-ipc'

interface Props {
  onLogin: (user: GitHubUser) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function LoginScreen({ onLogin, loading, setLoading }: Props) {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim() || loading) return
    setError(null)
    setLoading(true)
    try {
      const result = await window.githubAPI.login(token.trim())
      if (result.error) {
        setError(result.error)
      } else {
        onLogin(result)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate')
    } finally {
      setLoading(false)
    }
  }

  const GUIDE_STEPS = [
    {
      title: 'Open GitHub Token Settings',
      desc: 'Go to github.com, click your profile picture (top-right), then Settings.',
    },
    {
      title: 'Navigate to Developer Settings',
      desc: 'Scroll to the very bottom of the left sidebar and click Developer settings.',
    },
    {
      title: 'Personal access tokens > Tokens (classic)',
      desc: 'In the left sidebar click Personal access tokens, then Tokens (classic).',
    },
    {
      title: 'Generate new token (classic)',
      desc: 'Click the Generate new token button, then choose Generate new token (classic). GitHub may ask for your password.',
    },
    {
      title: 'Configure the token',
      desc: 'Give it a name (e.g. "Git Auto"), set expiration, and check these scopes:',
      scopes: ['repo  (full control of repositories)', 'delete_repo  (needed to delete repos from the app)'],
    },
    {
      title: 'Generate & copy',
      desc: 'Click Generate token at the bottom. Copy the token immediately — GitHub only shows it once! It starts with ghp_',
    },
    {
      title: 'Paste it here',
      desc: 'Come back to this app and paste your token in the field above. Your token is encrypted and stored locally.',
    },
  ]

  return (
    <div className="flex-1 flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-sm mx-auto p-6 py-12">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gh-surface border border-gh-border flex items-center justify-center">
            <svg className="w-8 h-8 text-gh-text" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gh-text">Sign in to Git Auto</h1>
          <p className="text-sm text-gh-muted mt-1">Enter your GitHub Personal Access Token</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token input */}
          <div>
            <label className="text-xs text-gh-muted font-medium uppercase tracking-wider block mb-2">
              Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2.5 pr-10 bg-gh-bg border border-gh-border rounded-md text-sm font-mono text-gh-text
                           placeholder:text-gh-muted/40 focus:outline-none focus:border-gh-accent/50"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gh-muted hover:text-gh-text transition-colors"
              >
                {showToken ? (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.143 2.31a.75.75 0 011.047-.167l14 10a.75.75 0 11-.88 1.214l-2.248-1.606C11.346 12.076 10.073 12.5 8 12.5c-3.47 0-5.94-1.963-7.357-3.79a.75.75 0 010-.92c.588-.757 1.39-1.605 2.36-2.33L.31 3.357A.75.75 0 01.143 2.31zm3.945 3.245C3.2 6.312 2.442 7.063 1.9 7.75c1.221 1.503 3.28 3.25 6.1 3.25 1.588 0 2.653-.345 3.47-.823L9.87 8.97A2.252 2.252 0 015.75 7.5c0-.185.023-.365.065-.538l-1.727-1.407zM8 3.5c-.516 0-1.009.05-1.477.144L5.22 2.64C6.034 2.38 6.955 2.17 8 2.17c3.47 0 5.94 1.964 7.357 3.79a.75.75 0 010 .92c-.472.608-1.088 1.296-1.852 1.942l-1.18-.857c.587-.509 1.066-1.058 1.443-1.545C12.582 4.797 10.534 3.5 8 3.5z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 2c-3.47 0-5.94 1.964-7.357 3.79a.75.75 0 000 .92C2.06 8.536 4.53 10.5 8 10.5s5.94-1.964 7.357-3.79a.75.75 0 000-.92C13.94 3.964 11.47 2 8 2zm0 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!token.trim() || loading}
            className="w-full py-2.5 bg-gh-accent text-white rounded-md font-medium text-sm
                       hover:bg-gh-accent/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Quick-create link */}
        <div className="mt-5 text-center">
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,delete_repo&description=Git+Auto"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gh-surface border border-gh-border rounded-md
                       text-sm text-gh-accent hover:bg-gh-accent/10 hover:border-gh-accent/30 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
            </svg>
            Quick-create token on GitHub
          </a>
          <p className="text-[11px] text-gh-muted/60 mt-1.5">
            Opens GitHub with correct scopes pre-selected
          </p>
        </div>

        {/* How-to guide toggle */}
        <div className="mt-6">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gh-surface border border-gh-border rounded-lg
                       hover:border-gh-accent/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span className="text-sm font-medium text-gh-text">
                What's a Personal Access Token?
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gh-muted transition-transform ${showGuide ? 'rotate-180' : ''}`}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z" />
            </svg>
          </button>

          {showGuide && (
            <div className="mt-2 bg-gh-surface border border-gh-border rounded-lg overflow-hidden">
              {/* Explainer */}
              <div className="px-4 py-3 border-b border-gh-border bg-gh-bg/50">
                <p className="text-xs text-gh-muted leading-relaxed">
                  A <strong className="text-gh-text">Personal Access Token (PAT)</strong> is a password-like key
                  that lets this app access your GitHub account on your behalf. It's safer than using your real
                  password because you control exactly what it can do and can revoke it anytime.
                </p>
              </div>

              {/* Steps */}
              <div className="divide-y divide-gh-border">
                {GUIDE_STEPS.map((step, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-gh-accent/15 text-gh-accent flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gh-text">{step.title}</p>
                        <p className="text-xs text-gh-muted mt-0.5 leading-relaxed">{step.desc}</p>
                        {step.scopes && (
                          <div className="mt-2 space-y-1">
                            {step.scopes.map((scope, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-gh-green-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                                  <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                                </svg>
                                <code className="text-xs text-gh-accent bg-gh-bg px-1.5 py-0.5 rounded">{scope}</code>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security note */}
              <div className="px-4 py-3 border-t border-gh-border bg-gh-bg/50">
                <div className="flex gap-2">
                  <svg className="w-3.5 h-3.5 text-gh-green-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.78 5.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 011.06-1.06L7 8.94l3.72-3.72a.75.75 0 011.06 0z" />
                  </svg>
                  <p className="text-[11px] text-gh-muted leading-relaxed">
                    Your token is <strong className="text-gh-text">encrypted</strong> on your machine
                    using your OS keychain and never sent anywhere except GitHub's API.
                    You can revoke it anytime from GitHub Settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
