# Git Auto

A desktop app for managing GitHub repositories, splitting commits, and backdating contributions.

Built with Electron, React, TypeScript, Tailwind CSS, and Vite.

## Features

### GitHub Authentication
- Sign in with a Personal Access Token (PAT)
- Token encrypted locally via OS keychain (`safeStorage`)
- Auto-login on app relaunch (persisted token)
- In-app step-by-step guide for creating a PAT

### Repository Management
- List all your GitHub repos (searchable)
- Create new repos (public/private) directly from the app
- Clone repos to a local folder
- Delete repos with confirmation
- Open any local Git repo via folder picker

### Commit Splitting
- Select which changed files to include
- Split changes across multiple commits by **files** or by **lines**
- Customize commit message template (`{n}`, `{total}` placeholders)
- Preview every commit before executing

### Contribution Backdating
- Backdate commits to any date range
- Randomized timestamps for natural-looking activity
- Live contribution graph preview showing planned commits

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- A [GitHub Personal Access Token](#creating-a-personal-access-token)

### Install & Run

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

Produces a distributable in the `dist/` directory via electron-builder.

## Creating a Personal Access Token

The app needs a GitHub PAT to access your repos. Here's how to create one:

1. Go to [github.com](https://github.com) and click your **profile picture** (top-right) → **Settings**
2. Scroll to the bottom of the left sidebar → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** → **Generate new token (classic)**
5. Give it a name (e.g. `Git Auto`), set an expiration, and check these scopes:
   - **`repo`** — full control of repositories
   - **`delete_repo`** — allows deleting repos from the app
6. Click **Generate token** and **copy it immediately** (GitHub only shows it once)
7. Paste it into the app's sign-in screen

Or use this shortcut link to create a token with the correct scopes pre-selected:

**[Create token on GitHub](https://github.com/settings/tokens/new?scopes=repo,delete_repo&description=Git+Auto)**

Your token is encrypted on disk and never sent anywhere except GitHub's API.

## Project Structure

```
├── electron/
│   ├── main.ts               # Electron main process + IPC handlers
│   ├── preload.ts             # Context bridge (gitAPI, githubAPI)
│   ├── git-operations.ts      # Git operations (status, diff, commit, push)
│   └── github-operations.ts   # GitHub API (auth, repos, clone, remotes)
├── src/
│   ├── App.tsx                # Main app component + step routing
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles
│   ├── lib/
│   │   ├── ipc.ts             # Git IPC types + renderer API
│   │   └── github-ipc.ts      # GitHub IPC types + renderer API
│   └── components/
│       ├── LoginScreen.tsx     # PAT auth + how-to guide
│       ├── Dashboard.tsx       # Repo list, create, clone, delete
│       ├── CreateRepoDialog.tsx# New repo modal
│       ├── UserBadge.tsx       # Title bar user avatar + logout
│       ├── RepoSelector.tsx    # Local repo folder picker
│       ├── ChangesList.tsx     # File changes with diff viewer
│       ├── SplitConfig.tsx     # Commit split settings
│       ├── CommitPreview.tsx   # Preview commits before executing
│       ├── ProgressView.tsx    # Execution progress log
│       └── ContributionGraph.tsx # GitHub-style contribution heatmap
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## App Flow

```
Login → Dashboard → Select/Clone Repo → Configure Splits → Preview → Execute & Push
```

## Tech Stack

| Layer    | Technology          |
| -------- | ------------------- |
| Desktop  | Electron            |
| Frontend | React + TypeScript  |
| Styling  | Tailwind CSS        |
| Bundler  | Vite                |
| Git      | simple-git          |
| GitHub   | @octokit/rest       |

## License

MIT
