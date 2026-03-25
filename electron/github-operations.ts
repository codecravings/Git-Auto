import { Octokit } from '@octokit/rest'
import { app, safeStorage } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import simpleGit from 'simple-git'

let octokit: Octokit | null = null

const tokenPath = () => path.join(app.getPath('userData'), 'github-token.enc')

export function saveToken(token: string): void {
  const encrypted = safeStorage.encryptString(token)
  fs.writeFileSync(tokenPath(), encrypted)
}

export function loadToken(): string | null {
  try {
    const encrypted = fs.readFileSync(tokenPath())
    return safeStorage.decryptString(encrypted)
  } catch {
    return null
  }
}

export function deleteToken(): void {
  try {
    fs.unlinkSync(tokenPath())
  } catch {}
}

export async function login(token: string) {
  const client = new Octokit({ auth: token })
  const { data: user } = await client.users.getAuthenticated()
  octokit = client
  saveToken(token)
  return {
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    public_repos: user.public_repos,
    html_url: user.html_url,
  }
}

export async function logout() {
  deleteToken()
  octokit = null
}

export async function tryAutoLogin() {
  const token = loadToken()
  if (!token) return null
  try {
    const client = new Octokit({ auth: token })
    const { data: user } = await client.users.getAuthenticated()
    octokit = client
    return {
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      public_repos: user.public_repos,
      html_url: user.html_url,
    }
  } catch {
    deleteToken()
    return null
  }
}

export async function getUser() {
  if (!octokit) throw new Error('Not authenticated')
  const { data: user } = await octokit.users.getAuthenticated()
  return {
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    public_repos: user.public_repos,
    html_url: user.html_url,
  }
}

export async function listRepos(params?: { sort?: 'updated' | 'created' | 'pushed' | 'full_name'; per_page?: number; page?: number }) {
  if (!octokit) throw new Error('Not authenticated')
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: params?.sort || 'updated',
    per_page: params?.per_page || 100,
    page: params?.page || 1,
    affiliation: 'owner,collaborator,organization_member',
  })
  return data.map(r => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    private: r.private,
    html_url: r.html_url,
    clone_url: r.clone_url,
    default_branch: r.default_branch,
    updated_at: r.updated_at,
    language: r.language,
    stargazers_count: r.stargazers_count,
  }))
}

export async function createRepo(params: { name: string; description?: string; isPrivate?: boolean }) {
  if (!octokit) throw new Error('Not authenticated')
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name: params.name,
    description: params.description || '',
    private: params.isPrivate ?? true,
    auto_init: true,
  })
  return {
    id: data.id,
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    private: data.private,
    html_url: data.html_url,
    clone_url: data.clone_url,
    default_branch: data.default_branch,
    updated_at: data.updated_at,
    language: data.language,
    stargazers_count: data.stargazers_count,
  }
}

export async function deleteRepo(owner: string, repo: string) {
  if (!octokit) throw new Error('Not authenticated')
  await octokit.repos.delete({ owner, repo })
}

export async function cloneRepo(cloneUrl: string, localPath: string) {
  const token = loadToken()
  let url = cloneUrl
  if (token && url.startsWith('https://')) {
    url = url.replace('https://', `https://${token}@`)
  }
  const git = simpleGit()
  await git.clone(url, localPath)
  return localPath
}

export async function addRemote(repoPath: string, name: string, url: string) {
  const git = simpleGit(repoPath)
  await git.addRemote(name, url)
}

export async function listRemotes(repoPath: string) {
  const git = simpleGit(repoPath)
  return await git.getRemotes(true)
}

export async function removeRemote(repoPath: string, name: string) {
  const git = simpleGit(repoPath)
  await git.removeRemote(name)
}
