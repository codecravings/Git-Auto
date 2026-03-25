import { type CommitGroup } from '../lib/ipc'

interface Props {
  groups: CommitGroup[]
  mode: 'files' | 'lines'
}

export default function CommitPreview({ groups, mode }: Props) {
  if (groups.length === 0) return null

  return (
    <div className="border border-gh-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gh-surface border-b border-gh-border">
        <span className="text-xs text-gh-muted font-medium uppercase tracking-wider">
          Commit Preview — {groups.length} commit{groups.length !== 1 ? 's' : ''} ({mode} mode)
        </span>
      </div>

      <div className="max-h-[350px] overflow-y-auto divide-y divide-gh-border">
        {groups.map((group, i) => (
          <div key={i} className="p-3 hover:bg-gh-surface/30 transition-colors">
            <div className="flex items-start gap-3">
              {/* Commit number badge */}
              <div className="w-7 h-7 rounded-full bg-gh-accent/15 text-gh-accent flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Message */}
                <p className="text-sm text-gh-text font-medium">{group.message}</p>

                {/* Date */}
                {group.date && (
                  <p className="text-xs text-gh-muted mt-1">
                    {new Date(group.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}

                {/* Files */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {group.files.map(file => (
                    <span
                      key={file}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-gh-bg border border-gh-border text-xs font-mono text-gh-muted"
                    >
                      {file}
                    </span>
                  ))}
                </div>

                {/* Patch preview for line-level splits */}
                {group.patches && Object.keys(group.patches).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gh-accent cursor-pointer hover:underline">
                      View patch
                    </summary>
                    <pre className="mt-1 p-2 bg-gh-bg border border-gh-border rounded text-[11px] font-mono overflow-x-auto max-h-[150px]">
                      {Object.values(group.patches).map((patch, j) => (
                        <div key={j}>
                          {(patch as string).split('\n').map((line, k) => {
                            let color = 'text-gh-muted'
                            if (line.startsWith('+') && !line.startsWith('+++')) color = 'text-gh-green-4'
                            if (line.startsWith('-') && !line.startsWith('---')) color = 'text-red-400'
                            if (line.startsWith('@@')) color = 'text-purple-400'
                            return (
                              <div key={k} className={color}>{line}</div>
                            )
                          })}
                        </div>
                      ))}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
