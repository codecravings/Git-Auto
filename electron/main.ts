import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getRepoStatus,
  getFileDiff,
  generateCommitPlan,
  executeCommitPlan,
  getContributionData,
  isGitRepo,
  type CommitPlan,
  type ProgressEvent,
} from './git-operations'
import * as github from './github-operations'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#0d1117',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#161b22',
      symbolColor: '#e6edf3',
      height: 38,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

// --- IPC Handlers ---

ipcMain.handle('git:selectRepo', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Git Repository',
  })
  if (result.canceled || result.filePaths.length === 0) return null

  const dirPath = result.filePaths[0]
  const isRepo = await isGitRepo(dirPath)
  if (!isRepo) {
    return { error: 'Not a git repository' }
  }
  return { path: dirPath }
})

ipcMain.handle('git:getStatus', async (_event, repoPath: string) => {
  try {
    return await getRepoStatus(repoPath)
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('git:getFileDiff', async (_event, repoPath: string, filePath: string, staged: boolean) => {
  try {
    return await getFileDiff(repoPath, filePath, staged)
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('git:splitPreview', async (_event, params: {
  repoPath: string
  files: string[]
  count: number
  mode: 'files' | 'lines'
  messageTemplate: string
  backdate?: { startDate: string; endDate: string }
}) => {
  try {
    // Get diffs for line-level splitting
    let diffs: Map<string, string> | undefined
    if (params.mode === 'lines') {
      diffs = new Map()
      for (const file of params.files) {
        const diff = await getFileDiff(params.repoPath, file, false)
        diffs.set(file, diff)
      }
    }

    const plan = generateCommitPlan(
      params.files,
      params.count,
      params.mode,
      params.messageTemplate,
      params.backdate,
      diffs,
    )

    // Serialize the plan (Maps can't be sent over IPC)
    return {
      groups: plan.groups.map(g => ({
        ...g,
        patches: g.patches ? Object.fromEntries(g.patches) : undefined,
      })),
      mode: plan.mode,
      totalFiles: plan.totalFiles,
    }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('git:execute', async (event, params: {
  repoPath: string
  plan: any
}) => {
  try {
    // Deserialize the plan
    const plan: CommitPlan = {
      ...params.plan,
      groups: params.plan.groups.map((g: any) => ({
        ...g,
        patches: g.patches ? new Map(Object.entries(g.patches)) : undefined,
      })),
    }

    await executeCommitPlan(params.repoPath, plan, (progress: ProgressEvent) => {
      mainWindow?.webContents.send('git:progress', progress)
    })

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('git:getContributions', async (_event, repoPath: string) => {
  try {
    return await getContributionData(repoPath)
  } catch (err: any) {
    return []
  }
})

// --- GitHub IPC Handlers ---

ipcMain.handle('github:login', async (_event, token: string) => {
  try {
    return await github.login(token)
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:logout', async () => {
  await github.logout()
  return { success: true }
})

ipcMain.handle('github:getUser', async () => {
  try {
    return await github.getUser()
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:tryAutoLogin', async () => {
  try {
    return await github.tryAutoLogin()
  } catch {
    return null
  }
})

ipcMain.handle('github:listRepos', async (_event, params?: any) => {
  try {
    return await github.listRepos(params)
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:createRepo', async (_event, params: { name: string; description?: string; isPrivate?: boolean }) => {
  try {
    return await github.createRepo(params)
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:deleteRepo', async (_event, owner: string, repo: string) => {
  try {
    await github.deleteRepo(owner, repo)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:cloneRepo', async (_event, cloneUrl: string, localPath: string) => {
  try {
    const result = await github.cloneRepo(cloneUrl, localPath)
    return { path: result }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:selectCloneDir', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Clone Destination',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return { path: result.filePaths[0] }
})

ipcMain.handle('github:addRemote', async (_event, repoPath: string, name: string, url: string) => {
  try {
    await github.addRemote(repoPath, name, url)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:listRemotes', async (_event, repoPath: string) => {
  try {
    return await github.listRemotes(repoPath)
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('github:removeRemote', async (_event, repoPath: string, name: string) => {
  try {
    await github.removeRemote(repoPath, name)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
})
