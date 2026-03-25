import { useState, useEffect, useCallback } from 'react'
import RepoSelector from './components/RepoSelector'
import ChangesList from './components/ChangesList'
import SplitConfig from './components/SplitConfig'
import CommitPreview from './components/CommitPreview'
import ProgressView from './components/ProgressView'
import ContributionGraph from './components/ContributionGraph'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import UserBadge from './components/UserBadge'
import {
  type RepoStatus,
  type CommitPlan,
  type ProgressEvent,
  type ContributionDay,
  getGitAPI,
} from './lib/ipc'
import { type GitHubUser, getGitHubAPI } from './lib/github-ipc'

type AppStep = 'auth' | 'dashboard' | 'configure' | 'preview' | 'execute' | 'done'

export default function App() {
  // Auth state
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Repo state
  const [repoPath, setRepoPath] = useState<string | null>(null)
  const [status, setStatus] = useState<RepoStatus | null>(null)
  const [loading, setLoading] = useState(false)

  // File selection
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [expandedDiff, setExpandedDiff] = useState<{ path: string; content: string } | null>(null)

  // Config
  const [splitMode, setSplitMode] = useState<'files' | 'lines'>('files')
  const [commitCount, setCommitCount] = useState(4)
  const [backdateEnabled, setBackdateEnabled] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('Update {n}/{total}')

  // Preview/Execute
  const [plan, setPlan] = useState<CommitPlan | null>(null)
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Contribution graph
  const [contributions, setContributions] = useState<ContributionDay[]>([])

  // Current step
  const [step, setStep] = useState<AppStep>('auth')

  // Auto-login on mount
  useEffect(() => {
    const ghAPI = getGitHubAPI()
    if (!ghAPI) {
      setAuthChecked(true)
      return
    }
    ghAPI.tryAutoLogin().then(result => {
      if (result && !result.error) {
        setUser(result)
        setStep('dashboard')
      }
      setAuthChecked(true)
    }).catch(() => {
      setAuthChecked(true)
    })
  }, [])

  // Set default backdate range
  useEffect(() => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    setEndDate(now.toISOString().split('T')[0])
    setStartDate(weekAgo.toISOString().split('T')[0])
  }, [])

  // Listen for progress events
  useEffect(() => {
    const api = getGitAPI()
    if (!api) return
    const cleanup = api.onProgress((event: ProgressEvent) => {
      setProgressEvents(prev => [...prev, event])
      if (event.type === 'done' || event.type === 'error') {
        setIsExecuting(false)
        if (event.type === 'done') {
          setStep('done')
          if (repoPath) {
            api.getContributions(repoPath).then(setContributions)
          }
        }
      }
    })
    return cleanup
  }, [repoPath])

  const handleLogin = useCallback((loggedInUser: GitHubUser) => {
    setUser(loggedInUser)
    setStep('dashboard')
  }, [])

  const handleLogout = useCallback(async () => {
    const ghAPI = getGitHubAPI()
    if (ghAPI) await ghAPI.logout()
    setUser(null)
    setRepoPath(null)
    setStatus(null)
    setSelectedFiles(new Set())
    setPlan(null)
    setProgressEvents([])
    setContributions([])
    setStep('auth')
  }, [])

  const handleOpenRepoFromDashboard = useCallback(async (path: string) => {
    const api = getGitAPI()
    if (!api) return
    setLoading(true)
    try {
      const repoStatus = await api.getStatus(path)
      if (repoStatus.error) {
        alert(repoStatus.error)
        return
      }
      setRepoPath(path)
      setStatus(repoStatus)
      setSelectedFiles(new Set(repoStatus.files.map((f: any) => f.path)))
      setStep('configure')
      api.getContributions(path).then(setContributions)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectRepo = useCallback(async () => {
    const api = getGitAPI()
    if (!api) return
    setLoading(true)
    try {
      const result = await api.selectRepo()
      if (!result || result.error) {
        if (result?.error) alert(result.error)
        return
      }
      setRepoPath(result.path!)
      const repoStatus = await api.getStatus(result.path!)
      if (repoStatus.error) {
        alert(repoStatus.error)
        return
      }
      setStatus(repoStatus)
      setSelectedFiles(new Set(repoStatus.files.map((f: any) => f.path)))
      setStep('configure')
      api.getContributions(result.path!).then(setContributions)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    if (!repoPath) return
    const api = getGitAPI()
    if (!api) return
    setLoading(true)
    try {
      const repoStatus = await api.getStatus(repoPath)
      setStatus(repoStatus)
      setSelectedFiles(new Set(repoStatus.files.map((f: any) => f.path)))
    } finally {
      setLoading(false)
    }
  }, [repoPath])

  const handleToggleFile = useCallback((path: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    if (!status) return
    const allPaths = status.files.map(f => f.path)
    const allSelected = allPaths.every(p => selectedFiles.has(p))
    setSelectedFiles(allSelected ? new Set() : new Set(allPaths))
  }, [status, selectedFiles])

  const handleViewDiff = useCallback(async (filePath: string) => {
    if (expandedDiff?.path === filePath) {
      setExpandedDiff(null)
      return
    }
    const api = getGitAPI()
    if (!api || !repoPath) return
    const file = status?.files.find(f => f.path === filePath)
    const diff = await api.getFileDiff(repoPath, filePath, file?.staged ?? false)
    setExpandedDiff({ path: filePath, content: diff || '(no diff available)' })
  }, [repoPath, status, expandedDiff])

  const handlePreview = useCallback(async () => {
    const api = getGitAPI()
    if (!api || !repoPath) return
    setLoading(true)
    try {
      const result = await api.splitPreview({
        repoPath,
        files: Array.from(selectedFiles),
        count: commitCount,
        mode: splitMode,
        messageTemplate,
        backdate: backdateEnabled ? { startDate, endDate } : undefined,
      })
      if (result.error) {
        alert(result.error)
        return
      }
      setPlan(result)
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }, [repoPath, selectedFiles, commitCount, splitMode, messageTemplate, backdateEnabled, startDate, endDate])

  const handleExecute = useCallback(async () => {
    const api = getGitAPI()
    if (!api || !repoPath || !plan) return
    setProgressEvents([])
    setIsExecuting(true)
    setStep('execute')
    const result = await api.execute({ repoPath, plan })
    if (result.error) {
      setProgressEvents(prev => [...prev, {
        step: 0,
        total: 0,
        message: `Error: ${result.error}`,
        type: 'error' as const,
      }])
      setIsExecuting(false)
    }
  }, [repoPath, plan])

  const handleReset = useCallback(() => {
    setPlan(null)
    setProgressEvents([])
    setIsExecuting(false)
    setStep('dashboard')
  }, [])

  const handleBackToDashboard = useCallback(() => {
    setRepoPath(null)
    setStatus(null)
    setSelectedFiles(new Set())
    setPlan(null)
    setProgressEvents([])
    setContributions([])
    setStep('dashboard')
  }, [])

  const pendingDates = plan?.groups
    .map(g => g.date)
    .filter((d): d is string => !!d) || []

  // Show loading spinner while checking auth
  if (!authChecked) {
    return (
      <div className="h-screen flex flex-col bg-gh-bg">
        <div className="h-[38px] shrink-0 bg-gh-surface border-b border-gh-border"
             style={{ WebkitAppRegion: 'drag' } as any} />
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-gh-accent" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gh-bg">
      {/* Title bar drag area */}
      <div className="h-[38px] shrink-0 flex items-center justify-between px-4 bg-gh-surface border-b border-gh-border"
           style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center">
          <span className="text-sm font-semibold text-gh-text" style={{ WebkitAppRegion: 'no-drag' } as any}>
            Git Auto
          </span>
          <span className="text-xs text-gh-muted ml-2">Contribution Flexer</span>
        </div>
        {user && <UserBadge user={user} onLogout={handleLogout} />}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Auth step */}
        {step === 'auth' && (
          <LoginScreen onLogin={handleLogin} loading={loading} setLoading={setLoading} />
        )}

        {/* Dashboard step */}
        {step === 'dashboard' && user && (
          <div className="max-w-3xl mx-auto p-6">
            <Dashboard user={user} onOpenRepo={handleOpenRepoFromDashboard} onLogout={handleLogout} />
          </div>
        )}

        {/* Configure / Preview / Execute / Done steps */}
        {(step === 'configure' || step === 'preview' || step === 'execute' || step === 'done') && (
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            {/* Back to dashboard */}
            {(step === 'configure' || step === 'preview') && user && (
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-1.5 text-xs text-gh-muted hover:text-gh-text transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
                </svg>
                Back to Dashboard
              </button>
            )}

            {/* Repo selector */}
            <RepoSelector
              repoPath={repoPath}
              status={status}
              onSelect={handleSelectRepo}
              loading={loading}
            />

            {/* Configure step */}
            {step === 'configure' && status && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gh-text">Changed Files</h2>
                  <button
                    onClick={handleRefresh}
                    className="text-xs text-gh-accent hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                <ChangesList
                  files={status.files}
                  selectedFiles={selectedFiles}
                  onToggleFile={handleToggleFile}
                  onToggleAll={handleToggleAll}
                  onViewDiff={handleViewDiff}
                  expandedDiff={expandedDiff}
                />

                {selectedFiles.size > 0 && (
                  <>
                    <SplitConfig
                      mode={splitMode}
                      onModeChange={setSplitMode}
                      commitCount={commitCount}
                      onCountChange={setCommitCount}
                      backdateEnabled={backdateEnabled}
                      onBackdateToggle={setBackdateEnabled}
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                      messageTemplate={messageTemplate}
                      onMessageChange={setMessageTemplate}
                      maxFiles={selectedFiles.size}
                    />

                    <button
                      onClick={handlePreview}
                      disabled={loading || selectedFiles.size === 0}
                      className="w-full py-2.5 bg-gh-accent text-white rounded-md font-medium text-sm
                                 hover:bg-gh-accent/90 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating Preview...' : 'Preview Commits'}
                    </button>
                  </>
                )}

                <ContributionGraph data={contributions} />
              </>
            )}

            {/* Preview step */}
            {step === 'preview' && plan && (
              <>
                <CommitPreview groups={plan.groups} mode={plan.mode} />

                <ContributionGraph data={contributions} pendingDates={pendingDates} />

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('configure')}
                    className="flex-1 py-2.5 bg-gh-surface text-gh-muted border border-gh-border rounded-md
                               font-medium text-sm hover:text-gh-text transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleExecute}
                    className="flex-1 py-2.5 bg-gh-green-3 text-white rounded-md font-medium text-sm
                               hover:bg-gh-green-4 transition-colors"
                  >
                    Execute & Push
                  </button>
                </div>
              </>
            )}

            {/* Execute / Done step */}
            {(step === 'execute' || step === 'done') && (
              <>
                <ProgressView events={progressEvents} isRunning={isExecuting} />

                {step === 'done' && (
                  <>
                    <ContributionGraph data={contributions} />
                    <button
                      onClick={handleReset}
                      className="w-full py-2.5 bg-gh-surface text-gh-text border border-gh-border rounded-md
                                 font-medium text-sm hover:bg-gh-surface/80 transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
