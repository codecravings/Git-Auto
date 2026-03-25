interface Props {
  mode: 'files' | 'lines'
  onModeChange: (mode: 'files' | 'lines') => void
  commitCount: number
  onCountChange: (count: number) => void
  backdateEnabled: boolean
  onBackdateToggle: (enabled: boolean) => void
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  messageTemplate: string
  onMessageChange: (template: string) => void
  maxFiles: number
}

const presets = [2, 4, 6, 8, 12, 16]

export default function SplitConfig({
  mode,
  onModeChange,
  commitCount,
  onCountChange,
  backdateEnabled,
  onBackdateToggle,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  messageTemplate,
  onMessageChange,
  maxFiles,
}: Props) {
  return (
    <div className="space-y-4 p-4 bg-gh-surface border border-gh-border rounded-lg">
      {/* Split Mode */}
      <div>
        <label className="text-xs text-gh-muted font-medium uppercase tracking-wider block mb-2">
          Split Mode
        </label>
        <div className="flex gap-1 bg-gh-bg rounded-md p-1">
          <button
            onClick={() => onModeChange('files')}
            className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors
                        ${mode === 'files'
                          ? 'bg-gh-accent/15 text-gh-accent'
                          : 'text-gh-muted hover:text-gh-text'
                        }`}
          >
            By Files
          </button>
          <button
            onClick={() => onModeChange('lines')}
            className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors
                        ${mode === 'lines'
                          ? 'bg-gh-accent/15 text-gh-accent'
                          : 'text-gh-muted hover:text-gh-text'
                        }`}
          >
            By Lines
          </button>
        </div>
      </div>

      {/* Commit Count */}
      <div>
        <label className="text-xs text-gh-muted font-medium uppercase tracking-wider block mb-2">
          Number of Commits
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {presets.map(n => (
            <button
              key={n}
              onClick={() => onCountChange(n)}
              className={`px-3 py-1 rounded text-sm font-mono transition-colors
                          ${commitCount === n
                            ? 'bg-gh-accent text-white'
                            : 'bg-gh-bg text-gh-muted hover:text-gh-text border border-gh-border'
                          }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={Math.max(maxFiles, 20)}
            value={commitCount}
            onChange={e => onCountChange(Number(e.target.value))}
            className="flex-1 accent-gh-accent"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={commitCount}
            onChange={e => onCountChange(Math.max(1, Number(e.target.value)))}
            className="w-16 px-2 py-1 bg-gh-bg border border-gh-border rounded text-sm font-mono text-center text-gh-text"
          />
        </div>
      </div>

      {/* Backdate */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={backdateEnabled}
            onChange={e => onBackdateToggle(e.target.checked)}
            className="w-4 h-4 rounded border-gh-border bg-gh-bg accent-gh-accent"
          />
          <span className="text-xs text-gh-muted font-medium uppercase tracking-wider">
            Backdate Commits
          </span>
        </label>
        {backdateEnabled && (
          <div className="flex gap-3 mt-2">
            <div className="flex-1">
              <label className="text-xs text-gh-muted block mb-1">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={e => onStartDateChange(e.target.value)}
                className="w-full px-2 py-1.5 bg-gh-bg border border-gh-border rounded text-sm text-gh-text"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gh-muted block mb-1">End</label>
              <input
                type="date"
                value={endDate}
                onChange={e => onEndDateChange(e.target.value)}
                className="w-full px-2 py-1.5 bg-gh-bg border border-gh-border rounded text-sm text-gh-text"
              />
            </div>
          </div>
        )}
      </div>

      {/* Commit Message Template */}
      <div>
        <label className="text-xs text-gh-muted font-medium uppercase tracking-wider block mb-2">
          Commit Message Template
        </label>
        <input
          type="text"
          value={messageTemplate}
          onChange={e => onMessageChange(e.target.value)}
          placeholder="Update {n}/{total}"
          className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded text-sm font-mono text-gh-text
                     placeholder:text-gh-muted/50 focus:outline-none focus:border-gh-accent/50"
        />
        <p className="text-[11px] text-gh-muted mt-1">
          Use <code className="text-gh-accent">{'{n}'}</code> for commit number and{' '}
          <code className="text-gh-accent">{'{total}'}</code> for total count
        </p>
      </div>
    </div>
  )
}
