// ============================================================
// gitEngine.js — Simulated Git Version Control System
// Runs on top of VirtualFS to simulate Git operations
// ============================================================

export class GitEngine {
  constructor(fs) {
    this.fs = fs;
    this.initialized = false;
    this.HEAD = 'main';
    this.branches = {};
    this.commits = [];
    this.stagingArea = new Set();
    this.workingChanges = new Map(); // file -> 'modified' | 'deleted'
    this.trackedFiles = new Map(); // file -> last committed content
    this.remotes = {};
    this.stashStack = [];
    this.tags = {};
    this.config = {
      'user.name': 'student',
      'user.email': 'student@terminalquest.dev',
    };
    // For simulation of remote repos
    this.remoteCommits = [];
    this.remoteFiles = new Map();
  }

  // ---- Serialization ----
  serialize() {
    return {
      initialized: this.initialized,
      HEAD: this.HEAD,
      branches: { ...this.branches },
      commits: [...this.commits],
      stagingArea: [...this.stagingArea],
      workingChanges: Object.fromEntries(this.workingChanges),
      trackedFiles: Object.fromEntries(this.trackedFiles),
      remotes: { ...this.remotes },
      stashStack: [...this.stashStack],
      tags: { ...this.tags },
      config: { ...this.config },
    };
  }

  static deserialize(data, fs) {
    const git = new GitEngine(fs);
    Object.assign(git, {
      ...data,
      stagingArea: new Set(data.stagingArea),
      workingChanges: new Map(Object.entries(data.workingChanges)),
      trackedFiles: new Map(Object.entries(data.trackedFiles)),
    });
    return git;
  }

  // ---- Helper ----
  _generateHash() {
    return Math.random().toString(16).slice(2, 9);
  }

  _getCurrentBranchCommits() {
    const branchHead = this.branches[this.HEAD];
    if (!branchHead) return [];
    return this.commits.filter(c => {
      // Simple: return all commits up to branch head
      const idx = this.commits.findIndex(x => x.hash === branchHead);
      return this.commits.indexOf(c) <= idx;
    });
  }

  _getFileStatus() {
    const allFiles = this.fs.listAllFiles();
    const statuses = [];

    for (const file of allFiles) {
      const content = this.fs.getFileContent(file);
      const tracked = this.trackedFiles.has(file);
      const staged = this.stagingArea.has(file);

      if (staged) {
        statuses.push({ file, status: 'staged', staged: true });
      } else if (tracked && content !== this.trackedFiles.get(file)) {
        statuses.push({ file, status: 'modified', staged: false });
      } else if (!tracked) {
        statuses.push({ file, status: 'untracked', staged: false });
      }
    }

    // Check for deleted tracked files
    for (const [file] of this.trackedFiles) {
      if (!allFiles.includes(file)) {
        const staged = this.stagingArea.has(file);
        statuses.push({ file, status: 'deleted', staged });
      }
    }

    return statuses;
  }

  // ---- Git Commands ----
  init() {
    if (this.initialized) {
      return { output: `Reinitialized existing Git repository in ${this.fs.pwd()}/.git/` };
    }
    this.initialized = true;
    this.branches = { main: null };
    this.HEAD = 'main';
    return {
      output: `Initialized empty Git repository in ${this.fs.pwd()}/.git/`,
      type: 'success'
    };
  }

  status() {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const statuses = this._getFileStatus();
    const lines = [];
    lines.push(`On branch ${this.HEAD}`);

    if (this.commits.length === 0) {
      lines.push('');
      lines.push('No commits yet');
    }

    const staged = statuses.filter(s => s.staged);
    const modified = statuses.filter(s => s.status === 'modified' && !s.staged);
    const untracked = statuses.filter(s => s.status === 'untracked');
    const deleted = statuses.filter(s => s.status === 'deleted' && !s.staged);

    if (staged.length > 0) {
      lines.push('');
      lines.push('Changes to be committed:');
      lines.push('  (use "git restore --staged <file>..." to unstage)');
      for (const s of staged) {
        const label = this.trackedFiles.has(s.file) ? 'modified' : 'new file';
        lines.push(`\t@@green@@${label}:   ${s.file}@@`);
      }
    }

    if (modified.length > 0 || deleted.length > 0) {
      lines.push('');
      lines.push('Changes not staged for commit:');
      lines.push('  (use "git add <file>..." to update what will be committed)');
      for (const s of [...modified, ...deleted]) {
        lines.push(`\t@@red@@${s.status}:   ${s.file}@@`);
      }
    }

    if (untracked.length > 0) {
      lines.push('');
      lines.push('Untracked files:');
      lines.push('  (use "git add <file>..." to include in what will be committed)');
      for (const s of untracked) {
        lines.push(`\t@@red@@${s.file}@@`);
      }
    }

    if (staged.length === 0 && modified.length === 0 && untracked.length === 0 && deleted.length === 0) {
      lines.push('');
      lines.push('nothing to commit, working tree clean');
    }

    return { output: lines.join('\n') };
  }

  add(fileArg) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };
    if (!fileArg) return { error: 'Nothing specified, nothing added.' };

    if (fileArg === '.' || fileArg === '--all' || fileArg === '-A') {
      const allFiles = this.fs.listAllFiles();
      for (const file of allFiles) {
        this.stagingArea.add(file);
      }
      // Handle deleted files
      for (const [file] of this.trackedFiles) {
        if (!allFiles.includes(file)) {
          this.stagingArea.add(file);
        }
      }
      return { output: '' };
    }

    // Check if it's a directory
    const target = this.fs._resolvePath(fileArg);
    if (target && target.type === 'dir') {
      const prefix = fileArg === '.' ? '' : fileArg;
      const files = this.fs.listAllFiles(target, prefix);
      for (const file of files) {
        this.stagingArea.add(file);
      }
      return { output: '' };
    }

    if (!this.fs.exists(fileArg)) {
      // Check if it's a deleted tracked file
      if (this.trackedFiles.has(fileArg)) {
        this.stagingArea.add(fileArg);
        return { output: '' };
      }
      return { error: `fatal: pathspec '${fileArg}' did not match any files` };
    }

    this.stagingArea.add(fileArg);
    return { output: '' };
  }

  commit(message, flags = []) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    if (!message && !flags.includes('--allow-empty-message')) {
      return { error: 'Aborting commit due to empty commit message.' };
    }

    if (this.stagingArea.size === 0 && !flags.includes('--allow-empty')) {
      return { error: 'nothing to commit, working tree clean\n(use "git add" to track files)' };
    }

    const hash = this._generateHash();
    const allFiles = this.fs.listAllFiles();
    const filesChanged = [...this.stagingArea];

    // Update tracked files
    for (const file of filesChanged) {
      if (allFiles.includes(file)) {
        const content = this.fs.getFileContent(file);
        this.trackedFiles.set(file, content);
      } else {
        // File was deleted
        this.trackedFiles.delete(file);
      }
    }

    const commit = {
      hash,
      message: message || '',
      author: this.config['user.name'],
      email: this.config['user.email'],
      date: new Date().toISOString(),
      branch: this.HEAD,
      parent: this.branches[this.HEAD] || null,
      filesChanged,
    };

    this.commits.push(commit);
    this.branches[this.HEAD] = hash;
    this.stagingArea.clear();
    this.workingChanges.clear();

    const insertions = filesChanged.length;
    return {
      output: `[${this.HEAD} ${hash}] ${message}\n ${insertions} file${insertions !== 1 ? 's' : ''} changed`,
      type: 'success',
      commitHash: hash,
    };
  }

  log(flags = []) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const oneline = flags.includes('--oneline');
    const branchHead = this.branches[this.HEAD];
    if (!branchHead) return { error: 'fatal: your current branch does not have any commits yet' };

    // Get commits for current branch
    const branchCommits = [];
    let currentHash = branchHead;
    while (currentHash) {
      const commit = this.commits.find(c => c.hash === currentHash);
      if (!commit) break;
      branchCommits.push(commit);
      currentHash = commit.parent;
    }

    if (oneline) {
      const lines = branchCommits.map(c => {
        const isHead = c.hash === branchHead;
        return `@@yellow@@${c.hash}@@ ${isHead ? `(@@green@@HEAD -> ${this.HEAD}@@) ` : ''}${c.message}`;
      });
      return { output: lines.join('\n') };
    }

    const lines = [];
    for (const c of branchCommits) {
      const isHead = c.hash === branchHead;
      lines.push(`@@yellow@@commit ${c.hash}@@${isHead ? ` (@@green@@HEAD -> ${this.HEAD}@@)` : ''}`);
      lines.push(`Author: ${c.author} <${c.email}>`);
      lines.push(`Date:   ${new Date(c.date).toLocaleString()}`);
      lines.push('');
      lines.push(`    ${c.message}`);
      lines.push('');
    }

    return { output: lines.join('\n') };
  }

  diff(fileArg) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const statuses = this._getFileStatus();
    const modified = statuses.filter(s => s.status === 'modified' && !s.staged);

    if (fileArg) {
      const entry = modified.find(s => s.file === fileArg);
      if (!entry) return { output: '' };
      return this._generateDiff(entry.file);
    }

    if (modified.length === 0) return { output: '' };

    const lines = [];
    for (const entry of modified) {
      lines.push(this._generateDiff(entry.file));
    }
    return { output: lines.join('\n') };
  }

  _generateDiff(file) {
    const oldContent = this.trackedFiles.get(file) || '';
    const newContent = this.fs.getFileContent(file) || '';

    const lines = [];
    lines.push(`diff --git a/${file} b/${file}`);
    lines.push(`--- a/${file}`);
    lines.push(`+++ b/${file}`);

    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    lines.push(`@@ -1,${oldLines.length} +1,${newLines.length} @@`);
    for (const line of oldLines) {
      if (line && !newLines.includes(line)) {
        lines.push(`@@red@@-${line}@@`);
      }
    }
    for (const line of newLines) {
      if (line && !oldLines.includes(line)) {
        lines.push(`@@green@@+${line}@@`);
      }
    }

    return lines.join('\n');
  }

  branch(name, flags = []) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const deleteFlag = flags.includes('-d') || flags.includes('-D') || flags.includes('--delete');

    if (deleteFlag && name) {
      if (name === this.HEAD) return { error: `error: Cannot delete branch '${name}' checked out` };
      if (!this.branches[name]) return { error: `error: branch '${name}' not found.` };
      delete this.branches[name];
      return { output: `Deleted branch ${name}.` };
    }

    if (!name) {
      // List branches
      const lines = Object.keys(this.branches).sort().map(b => {
        return b === this.HEAD ? `* @@green@@${b}@@` : `  ${b}`;
      });
      return { output: lines.join('\n') };
    }

    if (this.branches[name] !== undefined) {
      return { error: `fatal: A branch named '${name}' already exists.` };
    }

    this.branches[name] = this.branches[this.HEAD] || null;
    return { output: `Created branch '${name}'` };
  }

  checkout(target, flags = []) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const createBranch = flags.includes('-b');

    if (createBranch) {
      if (this.branches[target] !== undefined) {
        return { error: `fatal: A branch named '${target}' already exists.` };
      }
      this.branches[target] = this.branches[this.HEAD] || null;
      this.HEAD = target;
      return { output: `Switched to a new branch '${target}'`, type: 'success' };
    }

    if (this.branches[target] !== undefined) {
      this.HEAD = target;
      return { output: `Switched to branch '${target}'`, type: 'success' };
    }

    // Check if it's a commit hash
    const commit = this.commits.find(c => c.hash.startsWith(target));
    if (commit) {
      return { output: `HEAD is now at ${commit.hash} ${commit.message}` };
    }

    return { error: `error: pathspec '${target}' did not match any file(s) known to git` };
  }

  switch_(target, flags = []) {
    // git switch is similar to git checkout for branches
    return this.checkout(target, flags);
  }

  merge(branchName) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };
    if (!branchName) return { error: 'fatal: no branch specified' };
    if (!this.branches[branchName] && this.branches[branchName] !== null) {
      return { error: `merge: ${branchName} - not something we can merge` };
    }

    if (this.branches[branchName] === this.branches[this.HEAD]) {
      return { output: 'Already up to date.' };
    }

    // Simulate fast-forward or merge commit
    const branchHead = this.branches[branchName];
    const hash = this._generateHash();

    const commit = {
      hash,
      message: `Merge branch '${branchName}' into ${this.HEAD}`,
      author: this.config['user.name'],
      email: this.config['user.email'],
      date: new Date().toISOString(),
      branch: this.HEAD,
      parent: this.branches[this.HEAD],
      mergeParent: branchHead,
      filesChanged: [],
      isMerge: true,
    };

    this.commits.push(commit);
    this.branches[this.HEAD] = hash;

    return {
      output: `Merge made by the 'ort' strategy.\nMerge branch '${branchName}' into ${this.HEAD}`,
      type: 'success',
    };
  }

  remote(subcommand, name, url) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    if (!subcommand || subcommand === '-v') {
      if (Object.keys(this.remotes).length === 0) return { output: '' };
      const lines = Object.entries(this.remotes).map(([n, u]) => `${n}\t${u} (fetch)\n${n}\t${u} (push)`);
      return { output: lines.join('\n') };
    }

    if (subcommand === 'add') {
      if (!name || !url) return { error: 'usage: git remote add <name> <url>' };
      if (this.remotes[name]) return { error: `error: remote ${name} already exists.` };
      this.remotes[name] = url;
      return { output: '' };
    }

    if (subcommand === 'remove' || subcommand === 'rm') {
      if (!this.remotes[name]) return { error: `error: No such remote: '${name}'` };
      delete this.remotes[name];
      return { output: '' };
    }

    return { error: `error: Unknown subcommand: ${subcommand}` };
  }

  push(remoteName = 'origin', branchName, flags = []) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const branch = branchName || this.HEAD;
    const setUpstream = flags.includes('-u') || flags.includes('--set-upstream');

    if (!this.remotes[remoteName] && !setUpstream) {
      return { error: `fatal: '${remoteName}' does not appear to be a git repository` };
    }

    if (!this.remotes[remoteName]) {
      return { error: `fatal: '${remoteName}' does not appear to be a git repository\nfatal: Could not read from remote repository.` };
    }

    const lines = [];
    lines.push(`Enumerating objects: ${this.commits.length}, done.`);
    lines.push('Counting objects: 100% done.');
    lines.push('Writing objects: 100% done.');
    lines.push(`To ${this.remotes[remoteName]}`);
    lines.push(` * [new branch]      ${branch} -> ${branch}`);
    if (setUpstream) {
      lines.push(`Branch '${branch}' set up to track remote branch '${branch}' from '${remoteName}'.`);
    }

    return { output: lines.join('\n'), type: 'success' };
  }

  pull(remoteName = 'origin', branchName) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    if (!this.remotes[remoteName]) {
      return { error: `fatal: '${remoteName}' does not appear to be a git repository` };
    }

    return {
      output: `From ${this.remotes[remoteName]}\nAlready up to date.`,
      type: 'success',
    };
  }

  fetch(remoteName = 'origin') {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    if (!this.remotes[remoteName]) {
      return { error: `fatal: '${remoteName}' does not appear to be a git repository` };
    }

    return { output: `From ${this.remotes[remoteName]}\nAlready up to date.` };
  }

  clone(url) {
    if (!url) return { error: 'fatal: You must specify a repository to clone.' };

    const repoName = url.split('/').pop()?.replace('.git', '') || 'repo';

    // Simulate cloning
    this.fs.mkdir(repoName);
    this.fs.cd(repoName);
    this.initialized = true;
    this.branches = { main: null };
    this.HEAD = 'main';
    this.remotes = { origin: url };

    // Create some simulated files from "remote"
    this.fs.writeFile('README.md', `# ${repoName}\n\nWelcome to this project!\n`);
    this.fs.writeFile('.gitignore', 'node_modules/\n.env\n');

    // Auto-commit
    const hash = this._generateHash();
    this.trackedFiles.set('README.md', this.fs.getFileContent('README.md'));
    this.trackedFiles.set('.gitignore', this.fs.getFileContent('.gitignore'));

    const commit = {
      hash,
      message: 'Initial commit',
      author: 'remote-author',
      email: 'author@github.com',
      date: new Date().toISOString(),
      branch: 'main',
      parent: null,
      filesChanged: ['README.md', '.gitignore'],
    };

    this.commits.push(commit);
    this.branches.main = hash;

    const lines = [];
    lines.push(`Cloning into '${repoName}'...`);
    lines.push('remote: Enumerating objects: 3, done.');
    lines.push('remote: Counting objects: 100% (3/3), done.');
    lines.push('Receiving objects: 100% (3/3), done.');

    return { output: lines.join('\n'), type: 'success' };
  }

  stash(subcommand) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    if (!subcommand || subcommand === 'push') {
      const statuses = this._getFileStatus();
      const modified = statuses.filter(s => s.status === 'modified' || s.staged);
      if (modified.length === 0) return { output: 'No local changes to save' };

      this.stashStack.push({
        staged: [...this.stagingArea],
        changes: Object.fromEntries(this.workingChanges),
        trackedSnapshot: Object.fromEntries(this.trackedFiles),
      });

      this.stagingArea.clear();
      this.workingChanges.clear();

      // Restore files to last committed state
      for (const [file, content] of this.trackedFiles) {
        this.fs.writeFile(file, content);
      }

      return { output: `Saved working directory and index state WIP on ${this.HEAD}` };
    }

    if (subcommand === 'list') {
      if (this.stashStack.length === 0) return { output: '' };
      const lines = this.stashStack.map((_, i) => `stash@{${i}}: WIP on ${this.HEAD}`);
      return { output: lines.join('\n') };
    }

    if (subcommand === 'pop') {
      if (this.stashStack.length === 0) return { error: 'error: No stash entries found.' };
      const stash = this.stashStack.pop();
      this.stagingArea = new Set(stash.staged);
      return { output: `Dropped refs/stash@{0}` };
    }

    if (subcommand === 'drop') {
      if (this.stashStack.length === 0) return { error: 'error: No stash entries found.' };
      this.stashStack.pop();
      return { output: `Dropped refs/stash@{0}` };
    }

    return { error: `error: unknown subcommand: ${subcommand}` };
  }

  reset(target, flags = []) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const hard = flags.includes('--hard');
    const soft = flags.includes('--soft');

    if (target === 'HEAD~1' || target === 'HEAD^') {
      const branchHead = this.branches[this.HEAD];
      const headCommit = this.commits.find(c => c.hash === branchHead);
      if (!headCommit || !headCommit.parent) {
        return { error: 'fatal: ambiguous argument: unknown revision' };
      }

      this.branches[this.HEAD] = headCommit.parent;

      if (hard) {
        this.stagingArea.clear();
        // Restore files to parent commit state
        return { output: `HEAD is now at ${headCommit.parent}` };
      } else if (soft) {
        // Keep staging area
        return { output: `HEAD is now at ${headCommit.parent}` };
      }

      this.stagingArea.clear();
      return { output: `Unstaged changes after reset:\nM\t${headCommit.filesChanged.join('\nM\t')}` };
    }

    // Reset specific file from staging
    if (target && !hard && !soft) {
      if (this.stagingArea.has(target)) {
        this.stagingArea.delete(target);
        return { output: `Unstaged changes after reset:\nM\t${target}` };
      }
    }

    return { output: '' };
  }

  revert(commitHash) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const commit = this.commits.find(c => c.hash.startsWith(commitHash));
    if (!commit) return { error: `fatal: bad revision '${commitHash}'` };

    const hash = this._generateHash();
    const revertCommit = {
      hash,
      message: `Revert "${commit.message}"`,
      author: this.config['user.name'],
      email: this.config['user.email'],
      date: new Date().toISOString(),
      branch: this.HEAD,
      parent: this.branches[this.HEAD],
      filesChanged: commit.filesChanged,
      isRevert: true,
    };

    this.commits.push(revertCommit);
    this.branches[this.HEAD] = hash;

    return {
      output: `[${this.HEAD} ${hash}] Revert "${commit.message}"\n 1 file changed`,
      type: 'success',
    };
  }

  rebase(targetBranch) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    if (!this.branches[targetBranch] && this.branches[targetBranch] !== null) {
      return { error: `fatal: invalid upstream '${targetBranch}'` };
    }

    if (targetBranch === this.HEAD) {
      return { output: 'Current branch is up to date.' };
    }

    return {
      output: `Successfully rebased and updated refs/heads/${this.HEAD}.`,
      type: 'success',
    };
  }

  cherryPick(commitHash) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    const commit = this.commits.find(c => c.hash.startsWith(commitHash));
    if (!commit) return { error: `fatal: bad object ${commitHash}` };

    const hash = this._generateHash();
    const newCommit = {
      hash,
      message: commit.message,
      author: this.config['user.name'],
      email: this.config['user.email'],
      date: new Date().toISOString(),
      branch: this.HEAD,
      parent: this.branches[this.HEAD],
      filesChanged: commit.filesChanged,
      isCherryPick: true,
    };

    this.commits.push(newCommit);
    this.branches[this.HEAD] = hash;

    return {
      output: `[${this.HEAD} ${hash}] ${commit.message}\n 1 file changed`,
      type: 'success',
    };
  }

  tag(name, flags = []) {
    if (!this.initialized) return { error: 'fatal: not a git repository (or any of the parent directories): .git' };

    if (!name) {
      if (Object.keys(this.tags).length === 0) return { output: '' };
      return { output: Object.keys(this.tags).sort().join('\n') };
    }

    const deleteFlag = flags.includes('-d');
    if (deleteFlag) {
      if (!this.tags[name]) return { error: `error: tag '${name}' not found.` };
      delete this.tags[name];
      return { output: `Deleted tag '${name}'` };
    }

    if (this.tags[name]) return { error: `fatal: tag '${name}' already exists` };
    this.tags[name] = this.branches[this.HEAD];
    return { output: `Created tag '${name}'` };
  }

  configCmd(key, value) {
    if (!key) {
      const lines = Object.entries(this.config).map(([k, v]) => `${k}=${v}`);
      return { output: lines.join('\n') };
    }
    if (value) {
      this.config[key] = value;
      return { output: '' };
    }
    return { output: this.config[key] || '' };
  }

  // Get data for git graph visualization
  getGraphData() {
    return {
      commits: [...this.commits],
      branches: { ...this.branches },
      HEAD: this.HEAD,
      tags: { ...this.tags },
    };
  }

  // Get staging area info for visualization
  getStagingInfo() {
    return {
      staged: [...this.stagingArea],
      statuses: this._getFileStatus(),
    };
  }
}
