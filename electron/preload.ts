import { contextBridge, ipcRenderer } from 'electron'

export interface GitAPI {
  selectRepo: () => Promise<{ path?: string; error?: string } | null>
  getStatus: (repoPath: string) => Promise<any>
  getFileDiff: (repoPath: string, filePath: string, staged: boolean) => Promise<string>
  splitPreview: (params: {
    repoPath: string
    files: string[]
    count: number
    mode: 'files' | 'lines'
    messageTemplate: string
    backdate?: { startDate: string; endDate: string }
  }) => Promise<any>
  execute: (params: { repoPath: string; plan: any }) => Promise<{ success?: boolean; error?: string }>
  getContributions: (repoPath: string) => Promise<any[]>
  onProgress: (callback: (event: any) => void) => () => void
}

contextBridge.exposeInMainWorld('gitAPI', {
  selectRepo: () => ipcRenderer.invoke('git:selectRepo'),
  getStatus: (repoPath: string) => ipcRenderer.invoke('git:getStatus', repoPath),
  getFileDiff: (repoPath: string, filePath: string, staged: boolean) =>
    ipcRenderer.invoke('git:getFileDiff', repoPath, filePath, staged),
  splitPreview: (params: any) => ipcRenderer.invoke('git:splitPreview', params),
  execute: (params: any) => ipcRenderer.invoke('git:execute', params),
  getContributions: (repoPath: string) => ipcRenderer.invoke('git:getContributions', repoPath),
  onProgress: (callback: (event: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('git:progress', handler)
    return () => ipcRenderer.removeListener('git:progress', handler)
  },
} satisfies GitAPI)

export interface GitHubAPI {
  login: (token: string) => Promise<any>
  logout: () => Promise<any>
  getUser: () => Promise<any>
  tryAutoLogin: () => Promise<any>
  listRepos: (params?: any) => Promise<any>
  createRepo: (params: { name: string; description?: string; isPrivate?: boolean }) => Promise<any>
  deleteRepo: (owner: string, repo: string) => Promise<any>
  cloneRepo: (cloneUrl: string, localPath: string) => Promise<any>
  selectCloneDir: () => Promise<{ path: string } | null>
  addRemote: (repoPath: string, name: string, url: string) => Promise<any>
  listRemotes: (repoPath: string) => Promise<any>
  removeRemote: (repoPath: string, name: string) => Promise<any>
}

contextBridge.exposeInMainWorld('githubAPI', {
  login: (token: string) => ipcRenderer.invoke('github:login', token),
  logout: () => ipcRenderer.invoke('github:logout'),
  getUser: () => ipcRenderer.invoke('github:getUser'),
  tryAutoLogin: () => ipcRenderer.invoke('github:tryAutoLogin'),
  listRepos: (params?: any) => ipcRenderer.invoke('github:listRepos', params),
  createRepo: (params: { name: string; description?: string; isPrivate?: boolean }) =>
    ipcRenderer.invoke('github:createRepo', params),
  deleteRepo: (owner: string, repo: string) => ipcRenderer.invoke('github:deleteRepo', owner, repo),
  cloneRepo: (cloneUrl: string, localPath: string) => ipcRenderer.invoke('github:cloneRepo', cloneUrl, localPath),
  selectCloneDir: () => ipcRenderer.invoke('github:selectCloneDir'),
  addRemote: (repoPath: string, name: string, url: string) =>
    ipcRenderer.invoke('github:addRemote', repoPath, name, url),
  listRemotes: (repoPath: string) => ipcRenderer.invoke('github:listRemotes', repoPath),
  removeRemote: (repoPath: string, name: string) => ipcRenderer.invoke('github:removeRemote', repoPath, name),
} satisfies GitHubAPI)
