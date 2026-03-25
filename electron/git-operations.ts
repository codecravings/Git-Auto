import simpleGit, { SimpleGit, StatusResult, DiffResult } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

export interface FileChange {
  path: string
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked'
  staged: boolean
  diff?: string
}

export interface RepoStatus {
  branch: string
  remote: string | null
  files: FileChange[]
  ahead: number
  behind: number
}

export interface CommitGroup {
  index: number
  files: string[]
  message: string
  date?: string
  patches?: Map<string, string> // filePath -> patch content (for line-level splits)
}

export interface CommitPlan {
  groups: CommitGroup[]
  mode: 'files' | 'lines'
  totalFiles: number
}

export interface ProgressEvent {
  step: number
  total: number
  message: string
  type: 'commit' | 'push' | 'done' | 'error'
}

export interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

function mapStatus(statusCode: string): FileChange['status'] {
  switch (statusCode) {
    case 'M': return 'modified'
    case 'A': return 'added'
    case 'D': return 'deleted'
    case 'R': return 'renamed'
    case '?': return 'untracked'
    default: return 'modified'
  }
}

export async function getRepoStatus(repoPath: string): Promise<RepoStatus> {
  const git = simpleGit(repoPath)

  const [status, branchSummary] = await Promise.all([
    git.status(),
    git.branch(),
  ])

  let remote: string | null = null
  try {
    const remotes = await git.getRemotes(true)
    if (remotes.length > 0) {
      remote = remotes[0].refs.push || remotes[0].refs.fetch || null
    }
  } catch {}

  const files: FileChange[] = []

  // Staged files
  for (const f of status.staged) {
    files.push({ path: f, status: 'modified', staged: true })
  }
  for (const f of status.created) {
    if (status.staged.includes(f)) continue
    files.push({ path: f, status: 'added', staged: status.isClean() ? false : true })
  }
  for (const f of status.deleted) {
    files.push({ path: f, status: 'deleted', staged: status.staged.includes(f) })
  }
  for (const f of status.modified) {
    if (files.some(x => x.path === f)) continue
    files.push({ path: f, status: 'modified', staged: false })
  }
  for (const f of status.not_added) {
    if (files.some(x => x.path === f)) continue
    files.push({ path: f, status: 'untracked', staged: false })
  }
  for (const f of status.renamed) {
    files.push({ path: (f as any).to || f, status: 'renamed', staged: true })
  }

  return {
    branch: status.current || branchSummary.current,
    remote,
    files,
    ahead: status.ahead,
    behind: status.behind,
  }
}

export async function getFileDiff(repoPath: string, filePath: string, staged: boolean): Promise<string> {
  const git = simpleGit(repoPath)
  try {
    if (staged) {
      return await git.diff(['--cached', '--', filePath])
    }
    // Check if it's untracked
    const status = await git.status()
    if (status.not_added.includes(filePath)) {
      const fullPath = path.join(repoPath, filePath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      return `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1,${content.split('\n').length} @@\n${content.split('\n').map(l => '+' + l).join('\n')}`
    }
    return await git.diff(['--', filePath])
  } catch {
    return ''
  }
}

export function splitByFiles(files: string[], n: number): string[][] {
  const groups: string[][] = Array.from({ length: n }, () => [])
  files.forEach((file, i) => {
    groups[i % n].push(file)
  })
  return groups.filter(g => g.length > 0)
}

export function splitByLines(diff: string, n: number): string[] {
  // Parse unified diff into hunks
  const lines = diff.split('\n')
  const headerLines: string[] = []
  const hunks: string[][] = []
  let currentHunk: string[] = []
  let inHeader = true

  for (const line of lines) {
    if (line.startsWith('@@')) {
      inHeader = false
      if (currentHunk.length > 0) {
        hunks.push(currentHunk)
      }
      currentHunk = [line]
    } else if (inHeader) {
      headerLines.push(line)
    } else {
      currentHunk.push(line)
    }
  }
  if (currentHunk.length > 0) {
    hunks.push(currentHunk)
  }

  if (hunks.length === 0) return [diff]

  // Split individual hunks into change groups
  const allChanges: { context: string[]; adds: string[]; removes: string[]; hunkHeader: string }[] = []

  for (const hunk of hunks) {
    const hunkHeader = hunk[0]
    let currentContext: string[] = []
    let currentAdds: string[] = []
    let currentRemoves: string[] = []

    for (let i = 1; i < hunk.length; i++) {
      const line = hunk[i]
      if (line.startsWith('+')) {
        currentAdds.push(line)
      } else if (line.startsWith('-')) {
        currentRemoves.push(line)
      } else {
        // Context line - if we have accumulated changes, flush them
        if (currentAdds.length > 0 || currentRemoves.length > 0) {
          allChanges.push({
            context: [...currentContext],
            adds: [...currentAdds],
            removes: [...currentRemoves],
            hunkHeader,
          })
          currentContext = []
          currentAdds = []
          currentRemoves = []
        }
        currentContext.push(line)
      }
    }
    // Flush remaining
    if (currentAdds.length > 0 || currentRemoves.length > 0) {
      allChanges.push({
        context: [...currentContext],
        adds: [...currentAdds],
        removes: [...currentRemoves],
        hunkHeader,
      })
    }
  }

  if (allChanges.length === 0) return [diff]

  // Distribute change groups across N patches
  const patchGroups: typeof allChanges[] = Array.from({ length: n }, () => [])
  allChanges.forEach((change, i) => {
    patchGroups[i % n].push(change)
  })

  // Reconstruct patches
  const patches: string[] = []
  for (const group of patchGroups) {
    if (group.length === 0) continue
    const patchLines = [...headerLines]
    // Group changes by their original hunk and reconstruct
    for (const change of group) {
      patchLines.push(change.hunkHeader)
      patchLines.push(...change.context)
      patchLines.push(...change.removes)
      patchLines.push(...change.adds)
    }
    patches.push(patchLines.join('\n'))
  }

  return patches.length > 0 ? patches : [diff]
}

function generateDates(startDate: string, endDate: string, count: number): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const range = end.getTime() - start.getTime()

  if (count === 1) {
    // Place in the middle
    return [new Date(start.getTime() + range / 2).toISOString()]
  }

  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const offset = (range * i) / (count - 1)
    const date = new Date(start.getTime() + offset)
    // Add some random minutes to look natural
    date.setMinutes(Math.floor(Math.random() * 60))
    date.setSeconds(Math.floor(Math.random() * 60))
    dates.push(date.toISOString())
  }
  return dates
}

export function generateCommitPlan(
  files: string[],
  count: number,
  mode: 'files' | 'lines',
  messageTemplate: string,
  backdate?: { startDate: string; endDate: string },
  diffs?: Map<string, string>,
): CommitPlan {
  const dates = backdate ? generateDates(backdate.startDate, backdate.endDate, count) : undefined

  if (mode === 'files') {
    const fileGroups = splitByFiles(files, count)
    const groups: CommitGroup[] = fileGroups.map((groupFiles, i) => ({
      index: i,
      files: groupFiles,
      message: messageTemplate
        .replace('{n}', String(i + 1))
        .replace('{total}', String(fileGroups.length)),
      date: dates?.[i],
    }))
    return { groups, mode, totalFiles: files.length }
  }

  // Line-level: for now create groups with patch data
  if (diffs && files.length === 1) {
    const filePath = files[0]
    const diff = diffs.get(filePath) || ''
    const patches = splitByLines(diff, count)
    const groups: CommitGroup[] = patches.map((patch, i) => ({
      index: i,
      files: [filePath],
      message: messageTemplate
        .replace('{n}', String(i + 1))
        .replace('{total}', String(patches.length)),
      date: dates?.[i],
      patches: new Map([[filePath, patch]]),
    }))
    return { groups, mode, totalFiles: 1 }
  }

  // Line-level with multiple files: fall back to file split
  const fileGroups = splitByFiles(files, count)
  const groups: CommitGroup[] = fileGroups.map((groupFiles, i) => ({
    index: i,
    files: groupFiles,
    message: messageTemplate
      .replace('{n}', String(i + 1))
      .replace('{total}', String(fileGroups.length)),
    date: dates?.[i],
  }))
  return { groups, mode: 'files', totalFiles: files.length }
}

export async function executeCommitPlan(
  repoPath: string,
  plan: CommitPlan,
  onProgress: (event: ProgressEvent) => void,
): Promise<void> {
  const git = simpleGit(repoPath)
  const total = plan.groups.length + 1 // +1 for push

  // First, unstage everything so we can control what goes into each commit
  try {
    await git.reset(['HEAD'])
  } catch {
    // May fail if there's no HEAD yet (empty repo), that's fine
  }

  for (let i = 0; i < plan.groups.length; i++) {
    const group = plan.groups[i]
    onProgress({
      step: i + 1,
      total,
      message: `Committing ${i + 1}/${plan.groups.length}: ${group.files.join(', ')}`,
      type: 'commit',
    })

    if (group.patches && group.patches.size > 0) {
      // Line-level split: apply patches
      for (const [filePath, patch] of group.patches) {
        const tmpFile = path.join(os.tmpdir(), `git-auto-patch-${Date.now()}.patch`)
        fs.writeFileSync(tmpFile, patch)
        try {
          await git.raw(['apply', '--cached', tmpFile])
        } catch (err) {
          // If patch fails, fall back to staging the whole file
          await git.add(filePath)
        } finally {
          fs.unlinkSync(tmpFile)
        }
      }
    } else {
      // File-level: stage specific files
      for (const file of group.files) {
        await git.add(file)
      }
    }

    // Build commit options
    const commitEnv: Record<string, string> = {}
    if (group.date) {
      commitEnv.GIT_AUTHOR_DATE = group.date
      commitEnv.GIT_COMMITTER_DATE = group.date
    }

    // Commit with optional date override
    if (group.date) {
      await git.env(commitEnv).commit(group.message)
    } else {
      await git.commit(group.message)
    }
  }

  // Push
  onProgress({
    step: total,
    total,
    message: 'Pushing to remote...',
    type: 'push',
  })

  try {
    const remotes = await git.getRemotes()
    if (remotes.length > 0) {
      const status = await git.status()
      await git.push(remotes[0].name, status.current || 'main')
    }
  } catch (err: any) {
    onProgress({
      step: total,
      total,
      message: `Push failed: ${err.message}`,
      type: 'error',
    })
    return
  }

  onProgress({
    step: total,
    total,
    message: 'Done! All commits pushed successfully.',
    type: 'done',
  })
}

export async function getContributionData(repoPath: string): Promise<ContributionDay[]> {
  const git = simpleGit(repoPath)

  try {
    const log = await git.log(['--format=%aI', '--all', '--since=1 year ago'])
    const dateCounts = new Map<string, number>()

    for (const commit of log.all) {
      const date = (commit.hash || '').split('T')[0] // log format gives us the date in hash field
      if (date) {
        dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
      }
    }

    // Also try parsing from raw log
    const rawLog = await git.raw(['log', '--format=%aI', '--all', '--since=1 year ago'])
    for (const line of rawLog.split('\n')) {
      const date = line.trim().split('T')[0]
      if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
      }
    }

    const maxCount = Math.max(...dateCounts.values(), 1)
    const days: ContributionDay[] = []

    // Generate last 365 days
    const now = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = dateCounts.get(dateStr) || 0
      let level: ContributionDay['level'] = 0
      if (count > 0) {
        const ratio = count / maxCount
        if (ratio > 0.75) level = 4
        else if (ratio > 0.5) level = 3
        else if (ratio > 0.25) level = 2
        else level = 1
      }
      days.push({ date: dateStr, count, level })
    }

    return days
  } catch {
    return []
  }
}

export async function isGitRepo(dirPath: string): Promise<boolean> {
  try {
    const git = simpleGit(dirPath)
    return await git.checkIsRepo()
  } catch {
    return false
  }
}

export async function getRemoteBranches(repoPath: string): Promise<string[]> {
  const git = simpleGit(repoPath)
  const branches = await git.branch(['-r'])
  return branches.all
}
