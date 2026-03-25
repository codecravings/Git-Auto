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
  error?: string
}

export interface CommitGroup {
  index: number
  files: string[]
  message: string
  date?: string
  patches?: Record<string, string>
}

export interface CommitPlan {
  groups: CommitGroup[]
  mode: 'files' | 'lines'
  totalFiles: number
  error?: string
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

interface GitAPI {
  selectRepo: () => Promise<{ path?: string; error?: string } | null>
  getStatus: (repoPath: string) => Promise<RepoStatus>
  getFileDiff: (repoPath: string, filePath: string, staged: boolean) => Promise<string>
  splitPreview: (params: {
    repoPath: string
    files: string[]
    count: number
    mode: 'files' | 'lines'
    messageTemplate: string
    backdate?: { startDate: string; endDate: string }
  }) => Promise<CommitPlan>
  execute: (params: { repoPath: string; plan: CommitPlan }) => Promise<{ success?: boolean; error?: string }>
  getContributions: (repoPath: string) => Promise<ContributionDay[]>
  onProgress: (callback: (event: ProgressEvent) => void) => () => void
}

declare global {
  interface Window {
    gitAPI: GitAPI
  }
}

export const git = (() => {
  // In browser context, window.gitAPI is available via preload
  if (typeof window !== 'undefined' && window.gitAPI) {
    return window.gitAPI
  }
  // Fallback for dev (should not happen with proper Electron setup)
  return null as unknown as GitAPI
})()

export function getGitAPI(): GitAPI {
  return window.gitAPI
}
