import { useState } from 'react'
import { type GitHubUser } from '../lib/github-ipc'

interface Props {
  user: GitHubUser
  onLogout: () => void
}

export default function UserBadge({ user, onLogout }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gh-bg/50 transition-colors"
      >
        <img
          src={user.avatar_url}
          alt={user.login}
          className="w-5 h-5 rounded-full"
        />
        <span className="text-xs text-gh-muted">{user.login}</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-gh-surface border border-gh-border rounded-lg shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gh-border">
              <p className="text-sm text-gh-text font-medium">{user.name || user.login}</p>
              <p className="text-xs text-gh-muted">{user.login}</p>
            </div>
            <button
              onClick={() => {
                setShowMenu(false)
                onLogout()
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gh-bg/50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
