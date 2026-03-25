import { type ContributionDay } from '../lib/ipc'

interface Props {
  data: ContributionDay[]
  pendingDates?: string[] // Dates from the current plan that will be added
}

const levelColors = [
  'bg-gh-surface',      // 0 - no commits
  'bg-gh-green-1',      // 1
  'bg-gh-green-2',      // 2
  'bg-gh-green-3',      // 3
  'bg-gh-green-4',      // 4
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ContributionGraph({ data, pendingDates }: Props) {
  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-gh-muted text-sm border border-gh-border rounded-lg border-dashed">
        Select a repository to see contribution data
      </div>
    )
  }

  // Build a set of pending dates for highlighting
  const pendingSet = new Set(pendingDates?.map(d => d.split('T')[0]) || [])

  // Build the grid: 53 weeks x 7 days
  const weeks: ContributionDay[][] = []
  let currentWeek: ContributionDay[] = []

  // Pad the first week with empties to align to correct day
  const firstDate = new Date(data[0].date)
  const firstDay = firstDate.getDay()
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: '', count: 0, level: 0 })
  }

  for (const day of data) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  // Month labels
  const monthLabels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    for (const day of week) {
      if (day.date) {
        const month = new Date(day.date).getMonth()
        if (month !== lastMonth) {
          monthLabels.push({ label: months[month], weekIndex: wi })
          lastMonth = month
        }
        break
      }
    }
  })

  const totalCommits = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="p-4 bg-gh-surface border border-gh-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gh-muted font-medium uppercase tracking-wider">
          Contribution Graph
        </span>
        <span className="text-xs text-gh-muted">
          {totalCommits} contribution{totalCommits !== 1 ? 's' : ''} in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex mb-1 ml-8" style={{ gap: '0px' }}>
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="text-[10px] text-gh-muted"
              style={{
                position: 'relative',
                left: `${m.weekIndex * 14}px`,
                marginRight: i < monthLabels.length - 1
                  ? `${(monthLabels[i + 1].weekIndex - m.weekIndex) * 14 - 30}px`
                  : '0',
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-[2px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1">
            <span className="h-[12px] text-[9px] text-gh-muted leading-[12px]"></span>
            <span className="h-[12px] text-[9px] text-gh-muted leading-[12px]">Mon</span>
            <span className="h-[12px] text-[9px] text-gh-muted leading-[12px]"></span>
            <span className="h-[12px] text-[9px] text-gh-muted leading-[12px]">Wed</span>
            <span className="h-[12px] text-[9px] text-gh-muted leading-[12px]"></span>
            <span className="h-[12px] text-[9px] text-gh-muted leading-[12px]">Fri</span>
            <span className="h-[12px] text-[9px] text-gh-muted leading-[12px]"></span>
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => {
                const isPending = pendingSet.has(day.date)
                return (
                  <div
                    key={di}
                    className={`w-[12px] h-[12px] rounded-sm ${
                      day.date === '' ? '' :
                      isPending ? 'bg-gh-accent ring-1 ring-gh-accent/50' :
                      levelColors[day.level]
                    }`}
                    title={day.date ? `${day.date}: ${day.count} commit${day.count !== 1 ? 's' : ''}` : ''}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[10px] text-gh-muted mr-1">Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-[12px] h-[12px] rounded-sm ${color}`} />
        ))}
        <span className="text-[10px] text-gh-muted ml-1">More</span>
      </div>
    </div>
  )
}
