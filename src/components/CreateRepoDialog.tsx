import { useState } from 'react'
import { getGitHubAPI, type GitHubRepo } from '../lib/github-ipc'

interface Props {
  onCreated: (repo: GitHubRepo, clonePath?: string) => void
  onClose: () => void
}

export default function CreateRepoDialog({ onCreated, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || loading) return
    setError(null)
    setLoading(true)

    const api = getGitHubAPI()
    try {
      const repo = await api.createRepo({ name: name.trim(), description: description.trim(), isPrivate })
      if ((repo as any).error) {
        setError((repo as any).error)
        return
      }

      // Ask to clone
      const dirResult = await api.selectCloneDir()
      if (dirResult?.path && repo.clone_url) {
        const cloneResult = await api.cloneRepo(repo.clone_url, `${dirResult.path}/${repo.name}`)
        if (cloneResult.error) {
          setError(`Repo created but clone failed: ${cloneResult.error}`)
          return
        }
        onCreated(repo, cloneResult.path)
      } else {
        onCreated(repo)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-gh-surface border border-gh-border rounded-lg shadow-xl">
        <div className="px-4 py-3 border-b border-gh-border">
          <h2 className="text-sm font-semibold text-gh-text">Create New Repository</h2>
        </div>

        <form onSubmit={handleCreate} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-gh-muted font-medium uppercase tracking-wider block mb-1.5">
              Repository Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-awesome-project"
              className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-sm font-mono text-gh-text
                         placeholder:text-gh-muted/40 focus:outline-none focus:border-gh-accent/50"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gh-muted font-medium uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description"
              className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-sm text-gh-text
                         placeholder:text-gh-muted/40 focus:outline-none focus:border-gh-accent/50"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="text-xs text-gh-muted font-medium uppercase tracking-wider block mb-2">
              Visibility
            </label>
            <div className="flex gap-1 bg-gh-bg rounded-md p-1">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors
                            ${isPrivate
                              ? 'bg-gh-accent/15 text-gh-accent'
                              : 'text-gh-muted hover:text-gh-text'
                            }`}
              >
                Private
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors
                            ${!isPrivate
                              ? 'bg-gh-accent/15 text-gh-accent'
                              : 'text-gh-muted hover:text-gh-text'
                            }`}
              >
                Public
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-gh-bg text-gh-muted border border-gh-border rounded-md
                         font-medium text-sm hover:text-gh-text transition-colors
                         disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 py-2.5 bg-gh-accent text-white rounded-md font-medium text-sm
                         hover:bg-gh-accent/90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create & Clone'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
