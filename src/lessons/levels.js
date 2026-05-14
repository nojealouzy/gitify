// ============================================================
// levels.js — All 8 levels covering everything about Git/GitHub
// ============================================================

export const levels = [
  {
    id: 1,
    title: "Welcome to the Terminal",
    subtitle: "Basic Navigation",
    icon: "🟢",
    narrative: "You've just opened a terminal for the first time. A blinking cursor stares at you. Let's learn to look around.",
    xpReward: 100,
    commands: ['pwd', 'ls', 'cd', 'clear'],
    initialFS: {
      type: 'dir', name: '~', children: {
        'Documents': {
          type: 'dir', name: 'Documents', children: {
            'notes.txt': { type: 'file', name: 'notes.txt', content: 'My first note!' },
            'projects': {
              type: 'dir', name: 'projects', children: {
                'secret.txt': { type: 'file', name: 'secret.txt', content: '🎉 You found the secret file! Great navigation skills!' }
              }
            }
          }
        },
        'Downloads': { type: 'dir', name: 'Downloads', children: {} },
        'Desktop': { type: 'dir', name: 'Desktop', children: {
          'welcome.txt': { type: 'file', name: 'welcome.txt', content: 'Welcome to TerminalQuest!' }
        }}
      }
    },
    objectives: [
      { id: 'pwd', text: 'Find out where you are using pwd', hint: 'Type: pwd', validate: (hist) => hist.some(h => h.command === 'pwd') },
      { id: 'ls', text: 'List files in the current directory', hint: 'Type: ls', validate: (hist) => hist.some(h => h.command === 'ls') },
      { id: 'cd-docs', text: 'Navigate into the Documents folder', hint: 'Type: cd Documents', validate: (hist, fs) => fs.pwd().includes('Documents') },
      { id: 'ls-docs', text: 'List what\'s inside Documents', hint: 'Type: ls', validate: (hist, fs) => fs.pwd().includes('Documents') && hist.filter(h => h.command === 'ls').length >= 2 },
      { id: 'cd-projects', text: 'Go deeper into the projects folder', hint: 'Type: cd projects', validate: (hist, fs) => fs.pwd().includes('projects') },
      { id: 'find-secret', text: 'Read the secret file you found!', hint: 'Type: cat secret.txt', validate: (hist) => hist.some(h => h.command === 'cat' && h.raw?.includes('secret')) },
    ]
  },
  {
    id: 2,
    title: "Building Your Workshop",
    subtitle: "Creating & Managing Files",
    icon: "🟡",
    narrative: "Every developer needs a workspace. Let's build yours from scratch — creating folders, files, and organizing your project.",
    xpReward: 150,
    commands: ['mkdir', 'touch', 'rm', 'rmdir', 'mv', 'cp', 'cat', 'echo'],
    initialFS: {
      type: 'dir', name: '~', children: {
        'old-file.txt': { type: 'file', name: 'old-file.txt', content: 'This file needs to be cleaned up' }
      }
    },
    objectives: [
      { id: 'mkdir-proj', text: 'Create a folder called "my-project"', hint: 'Type: mkdir my-project', validate: (hist, fs) => fs.exists('my-project') },
      { id: 'cd-proj', text: 'Navigate into my-project', hint: 'Type: cd my-project', validate: (hist, fs) => fs.pwd().includes('my-project') },
      { id: 'mkdir-src', text: 'Create a "src" folder inside', hint: 'Type: mkdir src', validate: (hist, fs) => fs.exists('src') },
      { id: 'touch-readme', text: 'Create a README.md file', hint: 'Type: touch README.md', validate: (hist, fs) => fs.exists('README.md') },
      { id: 'echo-write', text: 'Write "Hello World" into README.md', hint: 'Type: echo "Hello World" > README.md', validate: (hist, fs) => { const c = fs.getFileContent('README.md'); return c && c.includes('Hello'); } },
      { id: 'touch-index', text: 'Create src/index.js', hint: 'Type: touch src/index.js', validate: (hist, fs) => fs.exists('src/index.js') },
      { id: 'rm-old', text: 'Go back and remove old-file.txt', hint: 'cd .. then rm old-file.txt', validate: (hist, fs) => !fs.exists('~/old-file.txt') },
    ]
  },
  {
    id: 3,
    title: "Version Control Begins",
    subtitle: "Git Fundamentals",
    icon: "🟠",
    narrative: "Your code disappeared after a bad edit. Never again. Let's learn Git — the time machine for your code.",
    xpReward: 200,
    commands: ['git init', 'git status', 'git add', 'git commit', 'git log', 'git diff'],
    initialFS: {
      type: 'dir', name: '~', children: {
        'my-project': { type: 'dir', name: 'my-project', children: {
          'index.html': { type: 'file', name: 'index.html', content: '<html>\n<body>\n  <h1>My Website</h1>\n</body>\n</html>' },
          'style.css': { type: 'file', name: 'style.css', content: 'body { color: #333; }' }
        }}
      }
    },
    objectives: [
      { id: 'cd-proj', text: 'Navigate into my-project', hint: 'Type: cd my-project', validate: (hist, fs) => fs.pwd().includes('my-project') },
      { id: 'git-init', text: 'Initialize a Git repository', hint: 'Type: git init', validate: (hist, fs, git) => git.initialized },
      { id: 'git-status', text: 'Check the repository status', hint: 'Type: git status', validate: (hist) => hist.some(h => h.command === 'git status') },
      { id: 'git-add', text: 'Stage all files for commit', hint: 'Type: git add .', validate: (hist, fs, git) => git.stagingArea.size > 0 },
      { id: 'git-commit1', text: 'Make your first commit with message "Initial commit"', hint: 'Type: git commit -m "Initial commit"', validate: (hist, fs, git) => git.commits.length >= 1 },
      { id: 'edit-file', text: 'Edit index.html — add a paragraph', hint: 'echo "<p>Welcome!</p>" >> index.html', validate: (hist, fs) => { const c = fs.getFileContent('index.html'); return c && c.includes('Welcome'); } },
      { id: 'git-diff', text: 'See what changed with git diff', hint: 'Type: git diff', validate: (hist) => hist.some(h => h.command === 'git diff') },
      { id: 'git-commit2', text: 'Stage and commit the changes', hint: 'git add . then git commit -m "Add welcome text"', validate: (hist, fs, git) => git.commits.length >= 2 },
      { id: 'git-log', text: 'View your commit history', hint: 'Type: git log --oneline', validate: (hist) => hist.some(h => h.command?.startsWith('git log')) },
    ]
  },
  {
    id: 4,
    title: "Going Online",
    subtitle: "GitHub & Remotes",
    icon: "🔴",
    narrative: "Your code lives only on your computer. Let's put it on GitHub so the world can see it — and so you never lose it.",
    xpReward: 250,
    commands: ['git remote', 'git push', 'git pull', 'git clone', 'git fetch'],
    initialFS: {
      type: 'dir', name: '~', children: {
        'my-app': { type: 'dir', name: 'my-app', children: {
          'app.js': { type: 'file', name: 'app.js', content: 'console.log("Hello GitHub!");' },
          'README.md': { type: 'file', name: 'README.md', content: '# My App\nA cool project' }
        }}
      }
    },
    preInit: (fs, git) => {
      git.init();
      git.add('.');
      git.commit('Initial commit');
    },
    objectives: [
      { id: 'cd-app', text: 'Navigate into my-app', hint: 'Type: cd my-app', validate: (hist, fs) => fs.pwd().includes('my-app') },
      { id: 'remote-add', text: 'Connect to GitHub: add remote "origin"', hint: 'git remote add origin https://github.com/you/my-app.git', validate: (hist, fs, git) => Object.keys(git.remotes).length > 0 },
      { id: 'remote-v', text: 'Verify the remote is set up', hint: 'Type: git remote -v', validate: (hist) => hist.some(h => h.raw?.includes('remote') && h.raw?.includes('-v')) },
      { id: 'push', text: 'Push your code to GitHub', hint: 'git push -u origin main', validate: (hist) => hist.some(h => h.command?.startsWith('git push')) },
      { id: 'cd-home', text: 'Go back to home directory', hint: 'Type: cd ~', validate: (hist, fs) => fs.pwd() === '~' },
      { id: 'clone', text: 'Clone a repository from GitHub', hint: 'git clone https://github.com/example/cool-project.git', validate: (hist) => hist.some(h => h.command?.startsWith('git clone')) },
      { id: 'pull', text: 'Pull latest changes from remote', hint: 'Type: git pull', validate: (hist) => hist.some(h => h.command?.startsWith('git pull')) },
    ]
  },
  {
    id: 5,
    title: "Parallel Universes",
    subtitle: "Branching & Merging",
    icon: "🟣",
    narrative: "The boss wants a new feature, but you can't break the main code. Branches let you work in parallel universes.",
    xpReward: 300,
    commands: ['git branch', 'git checkout', 'git switch', 'git merge'],
    initialFS: {
      type: 'dir', name: '~', children: {
        'webapp': { type: 'dir', name: 'webapp', children: {
          'index.html': { type: 'file', name: 'index.html', content: '<html><body><h1>WebApp</h1></body></html>' },
          'app.js': { type: 'file', name: 'app.js', content: 'function main() {\n  console.log("v1.0");\n}' }
        }}
      }
    },
    preInit: (fs, git) => {
      git.init();
      git.add('.');
      git.commit('Initial release v1.0');
    },
    objectives: [
      { id: 'cd', text: 'Navigate into webapp', hint: 'cd webapp', validate: (hist, fs) => fs.pwd().includes('webapp') },
      { id: 'list-branch', text: 'List all branches', hint: 'git branch', validate: (hist) => hist.some(h => h.command === 'git branch') },
      { id: 'create-branch', text: 'Create a new branch "feature-login"', hint: 'git branch feature-login', validate: (hist, fs, git) => git.branches['feature-login'] !== undefined },
      { id: 'switch-branch', text: 'Switch to the feature branch', hint: 'git checkout feature-login', validate: (hist, fs, git) => git.HEAD === 'feature-login' },
      { id: 'add-feature', text: 'Create a login.html file', hint: 'touch login.html', validate: (hist, fs) => fs.exists('login.html') },
      { id: 'commit-feature', text: 'Commit the new feature', hint: 'git add . && git commit -m "Add login page"', validate: (hist, fs, git) => git.commits.some(c => c.branch === 'feature-login') },
      { id: 'switch-main', text: 'Switch back to main', hint: 'git checkout main', validate: (hist, fs, git) => git.HEAD === 'main' },
      { id: 'merge', text: 'Merge feature-login into main', hint: 'git merge feature-login', validate: (hist) => hist.some(h => h.command === 'git merge') },
      { id: 'delete-branch', text: 'Clean up: delete the feature branch', hint: 'git branch -d feature-login', validate: (hist, fs, git) => git.branches['feature-login'] === undefined },
    ]
  },
  {
    id: 6,
    title: "Time Travel",
    subtitle: "Undo & Advanced History",
    icon: "⚫",
    narrative: "Something went wrong in production. Can you fix it without losing your work? Git lets you travel through time.",
    xpReward: 350,
    commands: ['git stash', 'git reset', 'git revert', 'git rebase', 'git cherry-pick', '.gitignore'],
    initialFS: {
      type: 'dir', name: '~', children: {
        'production-app': { type: 'dir', name: 'production-app', children: {
          'server.js': { type: 'file', name: 'server.js', content: 'const express = require("express");\napp.listen(3000);' },
          'config.js': { type: 'file', name: 'config.js', content: 'module.exports = { port: 3000 };' }
        }}
      }
    },
    preInit: (fs, git) => {
      git.init();
      git.add('.');
      git.commit('Production release');
      fs.writeFile('server.js', 'const express = require("express");\n// BUG: crash on startup\napp.listen(3000);');
      git.add('.');
      git.commit('Add buggy feature');
    },
    objectives: [
      { id: 'cd', text: 'Navigate into production-app', hint: 'cd production-app', validate: (hist, fs) => fs.pwd().includes('production-app') },
      { id: 'log', text: 'Check the commit history', hint: 'git log --oneline', validate: (hist) => hist.some(h => h.command?.startsWith('git log')) },
      { id: 'revert', text: 'Revert the buggy commit (use the hash from log)', hint: 'git revert <hash> — copy the hash of the buggy commit', validate: (hist, fs, git) => git.commits.some(c => c.isRevert) },
      { id: 'stash-save', text: 'Make a change, then stash it for later', hint: 'Edit a file, then: git stash', validate: (hist) => hist.some(h => h.command === 'git stash') },
      { id: 'stash-pop', text: 'Bring back your stashed changes', hint: 'Type: git stash pop', validate: (hist) => hist.some(h => h.raw?.includes('stash pop')) },
      { id: 'tag', text: 'Tag this version as "v1.0"', hint: 'Type: git tag v1.0', validate: (hist, fs, git) => Object.keys(git.tags).length > 0 },
    ]
  },
  {
    id: 7,
    title: "Team Player",
    subtitle: "Collaboration Workflows",
    icon: "🔵",
    narrative: "You're now part of a team. Learn the real-world GitHub workflow that every professional developer uses daily.",
    xpReward: 400,
    commands: ['fork (concept)', 'pull request (concept)', 'git config', 'code review (concept)'],
    initialFS: {
      type: 'dir', name: '~', children: {}
    },
    objectives: [
      { id: 'clone', text: 'Clone the team repository', hint: 'git clone https://github.com/team/project.git', validate: (hist) => hist.some(h => h.command?.startsWith('git clone')) },
      { id: 'config-name', text: 'Set your Git username', hint: 'git config user.name "Your Name"', validate: (hist) => hist.some(h => h.raw?.includes('config') && h.raw?.includes('user.name')) },
      { id: 'config-email', text: 'Set your Git email', hint: 'git config user.email "you@email.com"', validate: (hist) => hist.some(h => h.raw?.includes('config') && h.raw?.includes('user.email')) },
      { id: 'feature-branch', text: 'Create and switch to a feature branch', hint: 'git checkout -b my-feature', validate: (hist, fs, git) => git.HEAD !== 'main' },
      { id: 'make-changes', text: 'Create a new file and commit it', hint: 'touch feature.js, git add ., git commit -m "Add feature"', validate: (hist, fs, git) => git.commits.some(c => c.branch !== 'main') },
      { id: 'push-branch', text: 'Push your feature branch to remote', hint: 'git push -u origin my-feature', validate: (hist) => hist.some(h => h.command?.startsWith('git push')) },
      { id: 'switch-main', text: 'Switch back to main and pull updates', hint: 'git checkout main && git pull', validate: (hist, fs, git) => git.HEAD === 'main' && hist.some(h => h.command?.startsWith('git pull')) },
    ]
  },
  {
    id: 8,
    title: "Git Grandmaster",
    subtitle: "Master-Level Operations",
    icon: "👑",
    narrative: "Final challenge. You now know enough to handle any Git situation a professional developer faces. Prove it.",
    xpReward: 500,
    commands: ['git cherry-pick', 'git rebase', 'git reset --hard', 'git reflog (concept)'],
    initialFS: {
      type: 'dir', name: '~', children: {
        'final-project': { type: 'dir', name: 'final-project', children: {
          'main.py': { type: 'file', name: 'main.py', content: 'print("TerminalQuest Final Level")' }
        }}
      }
    },
    preInit: (fs, git) => {
      git.init();
      git.add('.');
      git.commit('Start final project');
      git.branch('experiment');
      git.checkout('experiment');
      fs.writeFile('experiment.py', 'print("experimental feature")');
      git.add('.');
      git.commit('Add experiment');
      git.checkout('main');
    },
    objectives: [
      { id: 'cd', text: 'Navigate into final-project', hint: 'cd final-project', validate: (hist, fs) => fs.pwd().includes('final-project') },
      { id: 'log-all', text: 'Check commits on all branches', hint: 'git log --oneline, then switch branches and check again', validate: (hist) => hist.filter(h => h.command?.startsWith('git log')).length >= 1 },
      { id: 'cherry', text: 'Cherry-pick the experiment commit into main', hint: 'Find the hash from experiment branch, then: git cherry-pick <hash>', validate: (hist, fs, git) => git.commits.some(c => c.isCherryPick) },
      { id: 'new-branch', text: 'Create a "release" branch', hint: 'git checkout -b release', validate: (hist, fs, git) => git.branches['release'] !== undefined },
      { id: 'tag-release', text: 'Tag it as "v2.0"', hint: 'git tag v2.0', validate: (hist, fs, git) => git.tags['v2.0'] !== undefined },
      { id: 'push-tags', text: 'Push to remote with tags', hint: 'git remote add origin https://github.com/you/final.git then git push', validate: (hist) => hist.some(h => h.command?.startsWith('git push')) },
    ]
  }
];

export const badges = [
  { id: 'navigator', name: 'Navigator', icon: '🧭', description: 'Complete Level 1', level: 1 },
  { id: 'builder', name: 'Builder', icon: '🔨', description: 'Complete Level 2', level: 2 },
  { id: 'tracker', name: 'Version Tracker', icon: '📸', description: 'Complete Level 3', level: 3 },
  { id: 'connected', name: 'Connected', icon: '🌐', description: 'Complete Level 4', level: 4 },
  { id: 'brancher', name: 'Branch Master', icon: '🌿', description: 'Complete Level 5', level: 5 },
  { id: 'timekeeper', name: 'Time Traveler', icon: '⏰', description: 'Complete Level 6', level: 6 },
  { id: 'teamplayer', name: 'Team Player', icon: '🤝', description: 'Complete Level 7', level: 7 },
  { id: 'grandmaster', name: 'Git Grandmaster', icon: '👑', description: 'Complete Level 8', level: 8 },
];
