import { useState, useEffect, useCallback } from 'react'
import { getGitHubAPI, type GitHubUser, type GitHubRepo } from '../lib/github-ipc'
import CreateRepoDialog from './CreateRepoDialog'

interface Props {
  user: GitHubUser
  onOpenRepo: (path: string) => void
  onLogout: () => void
}

export default function Dashboard({ user, onOpenRepo, onLogout }: Props) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<GitHubRepo | null>(null)
  const [deleteInput, setDeleteInput] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadRepos = useCallback(async () => {
    const api = getGitHubAPI()
    setLoading(true)
    try {
      const result = await api.listRepos({ sort: 'updated', per_page: 100 })
      if (!Array.isArray(result)) return
      setRepos(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRepos() }, [loadRepos])

  const filteredRepos = repos.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleClone = async (repo: GitHubRepo) => {
    const api = getGitHubAPI()
    const dirResult = await api.selectCloneDir()
    if (!dirResult?.path || !repo.clone_url) return

    setActionLoading(String(repo.id))
    try {
      const clonePath = `${dirResult.path}/${repo.name}`
      const result = await api.cloneRepo(repo.clone_url, clonePath)
      if (result.error) {
        alert(`Clone failed: ${result.error}`)
      } else if (result.path) {
        onOpenRepo(result.path)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const api = getGitHubAPI()
    setActionLoading(`delete-${deleteConfirm.id}`)
    try {
      const [owner] = deleteConfirm.full_name.split('/')
      const result = await api.deleteRepo(owner, deleteConfirm.name)
      if (result.error) {
        alert(`Delete failed: ${result.error}`)
      } else {
        setRepos(prev => prev.filter(r => r.id !== deleteConfirm.id))
      }
    } finally {
      setActionLoading(null)
      setDeleteConfirm(null)
      setDeleteInput('')
    }
  }

  const handleOpenLocal = async () => {
    const result = await window.gitAPI.selectRepo()
    if (result?.path) {
      onOpenRepo(result.path)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  const handleCreated = (repo: GitHubRepo, clonePath?: string) => {
    setShowCreateDialog(false)
    setRepos(prev => [repo, ...prev])
    if (clonePath) {
      onOpenRepo(clonePath)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 30) return `${diffDays}d ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }

  return (
    <div className="space-y-4">
      {/* User header */}
      <div className="flex items-center gap-4 p-4 bg-gh-surface border border-gh-border rounded-lg">
        <img src={user.avatar_url} alt={user.login} className="w-12 h-12 rounded-full" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gh-text">{user.name || user.login}</h2>
          <p className="text-xs text-gh-muted">@{user.login}</p>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs text-gh-muted border border-gh-border rounded-md
                     hover:text-red-400 hover:border-red-400/30 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gh-muted" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-9 pr-3 py-2 bg-gh-bg border border-gh-border rounded-md text-sm text-gh-text
                       placeholder:text-gh-muted/40 focus:outline-none focus:border-gh-accent/50"
          />
        </div>
        <button
          onClick={handleOpenLocal}
          className="px-3 py-2 text-sm text-gh-muted border border-gh-border rounded-md
                     hover:text-gh-text hover:border-gh-accent/30 transition-colors shrink-0"
        >
          Open Local
        </button>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-3 py-2 bg-gh-accent text-white rounded-md text-sm font-medium
                     hover:bg-gh-accent/90 transition-colors shrink-0"
        >
          New Repo
        </button>
      </div>

      {/* Repo list */}
      <div className="border border-gh-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-5 w-5 text-gh-accent" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="py-12 text-center text-gh-muted text-sm">
            {search ? 'No repositories match your search' : 'No repositories found'}
          </div>
        ) : (
          <div className="max-h-[calc(100vh-340px)] overflow-y-auto divide-y divide-gh-border">
            {filteredRepos.map(repo => (
              <div key={repo.id} className="px-4 py-3 hover:bg-gh-surface/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gh-accent truncate">{repo.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                        repo.private
                          ? 'border-gh-border text-gh-muted'
                          : 'border-gh-accent/30 text-gh-accent'
                      }`}>
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-gh-muted mt-0.5 truncate">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gh-muted">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-gh-accent/60" />
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                          </svg>
                          {repo.stargazers_count}
                        </span>
                      )}
                      <span>Updated {formatDate(repo.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleClone(repo)}
                      disabled={actionLoading === String(repo.id)}
                      className="px-2.5 py-1 text-xs text-gh-accent border border-gh-accent/30 rounded
                                 hover:bg-gh-accent/10 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === String(repo.id) ? 'Cloning...' : 'Clone'}
                    </button>
                    <button
                      onClick={() => { setDeleteConfirm(repo); setDeleteInput('') }}
                      className="px-2.5 py-1 text-xs text-red-400 border border-red-400/30 rounded
                                 hover:bg-red-400/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      {showCreateDialog && (
        <CreateRepoDialog
          onCreated={handleCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-gh-surface border border-gh-border rounded-lg shadow-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gh-text">Delete {deleteConfirm.full_name}?</h3>
            <p className="text-xs text-gh-muted">
              This action <strong className="text-red-400">cannot be undone</strong>. This will permanently delete the
              repository, wiki, issues, comments, packages, secrets, workflow runs, and remove all collaborator associations.
            </p>
            <div>
              <label className="text-xs text-gh-muted block mb-1.5">
                Type <strong className="text-gh-text">{deleteConfirm.full_name}</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-sm font-mono text-gh-text
                           focus:outline-none focus:border-red-400/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteInput('') }}
                className="flex-1 py-2 text-sm text-gh-muted border border-gh-border rounded-md
                           hover:text-gh-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== deleteConfirm.full_name || actionLoading === `delete-${deleteConfirm.id}`}
                className="flex-1 py-2 text-sm text-white bg-red-600 rounded-md font-medium
                           hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === `delete-${deleteConfirm.id}` ? 'Deleting...' : 'Delete this repository'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
