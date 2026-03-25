export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  html_url: string
  error?: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string | null
  default_branch: string
  updated_at: string | null
  language: string | null
  stargazers_count: number
  error?: string
}

interface GitHubAPI {
  login: (token: string) => Promise<GitHubUser>
  logout: () => Promise<{ success: boolean }>
  getUser: () => Promise<GitHubUser>
  tryAutoLogin: () => Promise<GitHubUser | null>
  listRepos: (params?: { sort?: string; per_page?: number; page?: number }) => Promise<GitHubRepo[]>
  createRepo: (params: { name: string; description?: string; isPrivate?: boolean }) => Promise<GitHubRepo>
  deleteRepo: (owner: string, repo: string) => Promise<{ success?: boolean; error?: string }>
  cloneRepo: (cloneUrl: string, localPath: string) => Promise<{ path?: string; error?: string }>
  selectCloneDir: () => Promise<{ path: string } | null>
  addRemote: (repoPath: string, name: string, url: string) => Promise<{ success?: boolean; error?: string }>
  listRemotes: (repoPath: string) => Promise<any[]>
  removeRemote: (repoPath: string, name: string) => Promise<{ success?: boolean; error?: string }>
}

declare global {
  interface Window {
    githubAPI: GitHubAPI
  }
}

export function getGitHubAPI(): GitHubAPI {
  return window.githubAPI
}
