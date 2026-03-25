import { useState } from 'react'
import { type FileChange } from '../lib/ipc'

interface Props {
  files: FileChange[]
  selectedFiles: Set<string>
  onToggleFile: (path: string) => void
  onToggleAll: () => void
  onViewDiff: (path: string) => void
  expandedDiff: { path: string; content: string } | null
}

const statusIcons: Record<FileChange['status'], { label: string; color: string }> = {
  modified: { label: 'M', color: 'text-yellow-400' },
  added: { label: 'A', color: 'text-gh-green-4' },
  deleted: { label: 'D', color: 'text-red-400' },
  renamed: { label: 'R', color: 'text-purple-400' },
  untracked: { label: 'U', color: 'text-gh-green-4' },
}

export default function ChangesList({
  files,
  selectedFiles,
  onToggleFile,
  onToggleAll,
  onViewDiff,
  expandedDiff,
}: Props) {
  if (files.length === 0) {
    return (
      <div className="p-8 text-center text-gh-muted border border-gh-border rounded-lg border-dashed">
        No changes detected. Make some changes to your repo first.
      </div>
    )
  }

  const allSelected = files.every(f => selectedFiles.has(f.path))

  return (
    <div className="border border-gh-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gh-surface border-b border-gh-border">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="w-4 h-4 rounded border-gh-border bg-gh-bg accent-gh-accent"
          />
          <span className="text-xs text-gh-muted font-medium">
            {selectedFiles.size}/{files.length} files selected
          </span>
        </label>
      </div>

      {/* File list */}
      <div className="max-h-[300px] overflow-y-auto">
        {files.map((file) => {
          const icon = statusIcons[file.status]
          const isSelected = selectedFiles.has(file.path)
          const isExpanded = expandedDiff?.path === file.path

          return (
            <div key={file.path}>
              <div
                className={`flex items-center gap-3 px-3 py-1.5 hover:bg-gh-surface/50 transition-colors
                            ${isSelected ? '' : 'opacity-50'}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleFile(file.path)}
                  className="w-4 h-4 rounded border-gh-border bg-gh-bg accent-gh-accent shrink-0"
                />
                <span className={`font-mono text-xs font-bold w-4 text-center ${icon.color}`}>
                  {icon.label}
                </span>
                <button
                  onClick={() => onViewDiff(file.path)}
                  className="flex-1 text-left font-mono text-sm text-gh-text hover:text-gh-accent truncate"
                >
                  {file.path}
                </button>
                {file.staged && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gh-green-1 text-gh-green-4 shrink-0">
                    staged
                  </span>
                )}
              </div>
              {isExpanded && expandedDiff && (
                <div className="mx-3 mb-2 bg-gh-bg border border-gh-border rounded overflow-x-auto">
                  <pre className="p-3 text-xs font-mono leading-5">
                    {expandedDiff.content.split('\n').map((line, i) => {
                      let color = 'text-gh-muted'
                      if (line.startsWith('+') && !line.startsWith('+++')) color = 'text-gh-green-4'
                      if (line.startsWith('-') && !line.startsWith('---')) color = 'text-red-400'
                      if (line.startsWith('@@')) color = 'text-purple-400'
                      return (
                        <div key={i} className={color}>
                          {line}
                        </div>
                      )
                    })}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
