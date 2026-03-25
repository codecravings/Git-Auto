import { type RepoStatus } from '../lib/ipc'

interface Props {
  repoPath: string | null
  status: RepoStatus | null
  onSelect: () => void
  loading: boolean
}

export default function RepoSelector({ repoPath, status, onSelect, loading }: Props) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gh-surface border border-gh-border rounded-lg">
      <button
        onClick={onSelect}
        disabled={loading}
        className="px-4 py-2 bg-gh-accent/10 text-gh-accent border border-gh-accent/30 rounded-md
                   hover:bg-gh-accent/20 transition-colors text-sm font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {repoPath ? 'Change Repo' : 'Select Repository'}
      </button>

      {repoPath && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-gh-text font-mono text-sm truncate">{repoPath}</span>
          </div>
          {status && (
            <div className="flex items-center gap-3 mt-1 text-xs text-gh-muted">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
                </svg>
                {status.branch}
              </span>
              {status.remote && (
                <span className="text-gh-muted truncate max-w-[200px]">{status.remote}</span>
              )}
              <span>{status.files.length} change{status.files.length !== 1 ? 's' : ''}</span>
              {status.ahead > 0 && <span className="text-gh-green-3">{status.ahead} ahead</span>}
              {status.behind > 0 && <span className="text-yellow-400">{status.behind} behind</span>}
            </div>
          )}
        </div>
      )}

      {!repoPath && (
        <span className="text-gh-muted text-sm">No repository selected</span>
      )}

      {loading && (
        <svg className="animate-spin h-4 w-4 text-gh-accent shrink-0" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </div>
  )
}
