# ⚡ Gitify — Master Git & GitHub Through Practice

An interactive, gamified, browser-based terminal simulator that teaches you Git and GitHub from zero to expert. Practice real commands in a safe sandbox environment.

🔗 **[Try it live →](https://gitify-app-7e5ac1fc.netlify.app)**

![Gitify Screenshot](https://img.shields.io/badge/License-MIT-green?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

---

## 🎮 What is Gitify?

Most students struggle with terminal commands and Git workflows because they learn by reading, not by doing. **Gitify** solves this by providing a real-feeling terminal right in the browser where you can practice every Git command safely — nothing breaks, nothing is real, you just learn.

### Features

- 🖥️ **Authentic Terminal** — Command history, tab completion, colored output
- 📂 **Live File Explorer** — See your virtual filesystem update in real-time
- 🔀 **Visual Git Graph** — Watch commits, branches, and merges visualized as you type
- 🎯 **Guided Missions** — 8 progressive levels with step-by-step objectives
- 💡 **Built-in Hints** — Stuck? Reveal hints without leaving the terminal
- 🏆 **Gamification** — Earn XP, unlock badges, track your progress
- 💾 **Auto-Save** — Progress is saved locally, pick up where you left off

### 8 Levels — From Zero to Git Expert

| Level | Topic | What You Learn |
|-------|-------|---------------|
| 1 🟢 | Terminal Basics | `pwd`, `ls`, `cd`, `clear` |
| 2 🟡 | File Management | `mkdir`, `touch`, `rm`, `cat`, `echo`, `mv`, `cp` |
| 3 🟠 | Git Fundamentals | `git init`, `add`, `commit`, `log`, `diff`, `status` |
| 4 🔴 | GitHub & Remotes | `remote`, `push`, `pull`, `clone`, `fetch` |
| 5 🟣 | Branching & Merging | `branch`, `checkout`, `switch`, `merge` |
| 6 ⚫ | Undo & History | `stash`, `reset`, `revert`, `tag` |
| 7 🔵 | Collaboration | `config`, fork/PR workflows, code review |
| 8 👑 | Git Grandmaster | `cherry-pick`, `rebase`, advanced operations |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/nojealouzy/gitify.git

# Navigate to the project
cd gitify

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

The static output will be in the `out/` directory, ready to deploy anywhere.

---

## 🏗️ Architecture

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.js           # Landing page with level selector
│   ├── play/page.js      # Main game interface (3-panel layout)
│   ├── layout.js         # Root layout with metadata
│   └── globals.css       # Design system & tokens
├── components/           # React components
│   ├── Terminal.js       # Terminal emulator with cursor & colors
│   ├── FileTree.js       # Visual file explorer
│   ├── GitGraph.js       # Commit history visualization
│   └── MissionPanel.js   # Objectives, hints & progress
├── engine/               # Core simulation engines
│   ├── virtualFS.js      # In-memory virtual file system
│   ├── gitEngine.js      # Simulated Git operations
│   └── commandParser.js  # Command tokenizer & router
└── lessons/              # Curriculum & progress
    ├── levels.js         # All 8 levels with objectives
    └── progressManager.js # localStorage persistence
```

---

## 🤝 Contributing

Contributions are what make open-source amazing! Any contributions you make are **greatly appreciated**.

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Ideas for Contributions

- 🆕 Add new levels (interactive rebase, git bisect, submodules)
- 🌍 Add translations / internationalization
- 🎨 Improve UI/UX and animations
- 🐛 Fix bugs and improve command accuracy
- 📖 Improve documentation and tutorials
- ♿ Accessibility improvements

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details. You are free to use, modify, and distribute this project.

---

## ⭐ Show Your Support

If this project helped you learn Git, give it a **⭐ star** on GitHub!

---

Built with ❤️ for students who want to master Git & GitHub.
