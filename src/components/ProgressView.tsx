import { type ProgressEvent } from '../lib/ipc'

interface Props {
  events: ProgressEvent[]
  isRunning: boolean
}

export default function ProgressView({ events, isRunning }: Props) {
  if (events.length === 0 && !isRunning) return null

  const latest = events[events.length - 1]
  const isDone = latest?.type === 'done'
  const hasError = latest?.type === 'error'
  const progress = latest ? (latest.step / latest.total) * 100 : 0

  return (
    <div className="border border-gh-border rounded-lg overflow-hidden">
      <div className={`px-3 py-2 border-b border-gh-border ${
        isDone ? 'bg-gh-green-1' : hasError ? 'bg-red-900/30' : 'bg-gh-surface'
      }`}>
        <div className="flex items-center gap-2">
          {isRunning && !isDone && !hasError && (
            <svg className="animate-spin h-4 w-4 text-gh-accent" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isDone && (
            <svg className="w-4 h-4 text-gh-green-4" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
            </svg>
          )}
          {hasError && (
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94 6.03 4.97z" />
            </svg>
          )}
          <span className={`text-xs font-medium uppercase tracking-wider ${
            isDone ? 'text-gh-green-4' : hasError ? 'text-red-400' : 'text-gh-muted'
          }`}>
            {isDone ? 'Complete' : hasError ? 'Error' : 'Executing...'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && !isDone && (
        <div className="h-1 bg-gh-bg">
          <div
            className="h-full bg-gh-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Event log */}
      <div className="max-h-[200px] overflow-y-auto">
        {events.map((event, i) => (
          <div
            key={i}
            className={`px-3 py-1.5 text-sm font-mono border-b border-gh-border/50 last:border-0
                        ${event.type === 'error' ? 'text-red-400' :
                          event.type === 'done' ? 'text-gh-green-4' :
                          'text-gh-muted'}`}
          >
            <span className="text-gh-muted/50 mr-2">[{event.step}/{event.total}]</span>
            {event.message}
          </div>
        ))}
      </div>
    </div>
  )
}
