// ============================================================
// commandParser.js — Parse and execute terminal commands
// Routes input to VirtualFS and GitEngine
// ============================================================

export class CommandParser {
  constructor(fs, git) {
    this.fs = fs;
    this.git = git;
    this.history = [];
    this.historyIndex = -1;
    this.aliases = {
      'll': 'ls -l',
      'la': 'ls -la',
    };
  }

  // Parse raw input into command, args, flags, and redirects
  _parse(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Check for aliases
    const aliasMatch = Object.keys(this.aliases).find(a => trimmed.startsWith(a));
    const resolved = aliasMatch ? trimmed.replace(aliasMatch, this.aliases[aliasMatch]) : trimmed;

    // Handle echo with redirection
    const redirectAppend = resolved.match(/(.+?)\s*>>\s*(.+)/);
    const redirectOverwrite = resolved.match(/(.+?)\s*>\s*(.+)/);

    let commandStr = resolved;
    let redirect = null;
    let appendMode = false;

    if (redirectAppend) {
      commandStr = redirectAppend[1].trim();
      redirect = redirectAppend[2].trim();
      appendMode = true;
    } else if (redirectOverwrite) {
      commandStr = redirectOverwrite[1].trim();
      redirect = redirectOverwrite[2].trim();
    }

    // Tokenize (respect quoted strings)
    const tokens = [];
    let current = '';
    let inQuote = null;

    for (let i = 0; i < commandStr.length; i++) {
      const ch = commandStr[i];
      if (inQuote) {
        if (ch === inQuote) {
          inQuote = null;
        } else {
          current += ch;
        }
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === ' ') {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);

    const command = tokens[0] || '';
    const allArgs = tokens.slice(1);
    const flags = allArgs.filter(a => a.startsWith('-'));
    const args = allArgs.filter(a => !a.startsWith('-'));

    return { command, args, flags, allArgs, redirect, appendMode, raw: input };
  }

  // Execute a parsed command
  execute(input) {
    if (!input.trim()) return { output: '', command: '' };

    // Add to history
    this.history.push(input);
    this.historyIndex = this.history.length;

    const parsed = this._parse(input);
    if (!parsed) return { output: '', command: '' };

    const { command, args, flags, allArgs, redirect, appendMode } = parsed;

    try {
      switch (command) {
        // ---- Terminal basics ----
        case 'pwd':
          return { ...this.fs.pwd() ? { output: this.fs.pwd() } : {}, command };

        case 'ls':
          return this._handleLs(args, flags, command);

        case 'cd':
          return { ...this.fs.cd(args[0]), command };

        case 'mkdir':
          return { ...this.fs.mkdir(args[0], flags), command };

        case 'touch':
          return { ...this.fs.touch(args[0]), command };

        case 'rm':
          return { ...this.fs.rm(args[0], flags), command };

        case 'rmdir':
          return { ...this.fs.rmdir(args[0]), command };

        case 'cat':
          return { ...this.fs.cat(args[0]), command };

        case 'mv':
          return { ...this.fs.mv(args[0], args[1]), command };

        case 'cp':
          return { ...this.fs.cp(args[0], args[1], flags), command };

        case 'echo':
          return { ...this.fs.echo(args, redirect, appendMode), command };

        case 'clear':
          return { output: '__CLEAR__', command };

        case 'whoami':
          return { output: 'student', command };

        case 'date':
          return { output: new Date().toString(), command };

        case 'help':
          return { output: this._getHelp(), command };

        case 'man':
          return { output: this._getManPage(args[0]), command };

        // ---- Git Commands ----
        case 'git':
          return this._handleGit(args, flags, allArgs);

        default:
          return {
            error: `command not found: ${command}\nType 'help' for available commands.`,
            command,
          };
      }
    } catch (e) {
      return { error: `Error: ${e.message}`, command };
    }
  }

  _handleLs(args, flags, command) {
    const result = this.fs.ls(args[0], flags);
    if (result.error) return { ...result, command };

    if (typeof result.output === 'string') return { ...result, command };

    // Format ls output
    const entries = result.output;
    if (entries.length === 0) return { output: '', command };

    const formatted = entries.map(e => {
      if (e.type === 'dir') return `@@blue@@${e.name}/@@`;
      if (e.name.startsWith('.')) return `@@dim@@${e.name}@@`;
      return e.name;
    });

    if (result.long) {
      const lines = entries.map(e => {
        const type = e.type === 'dir' ? 'd' : '-';
        const perms = e.type === 'dir' ? 'rwxr-xr-x' : 'rw-r--r--';
        const size = e.type === 'file' ? (e.content?.length || 0).toString().padStart(5) : '  4096';
        const color = e.type === 'dir' ? '@@blue@@' : '';
        const end = color ? '@@' : '';
        const name = e.type === 'dir' ? `${e.name}/` : e.name;
        return `${type}${perms}  1 student student ${size} May 13 12:00 ${color}${name}${end}`;
      });
      return { output: lines.join('\n'), command };
    }

    return { output: formatted.join('  '), command };
  }

  _handleGit(args, flags, allArgs) {
    const subcommand = args[0];
    const subArgs = args.slice(1);
    const command = `git ${subcommand || ''}`;

    if (!subcommand) {
      return {
        output: 'usage: git <command> [<args>]\n\nCommon commands:\n  init, status, add, commit, log, diff,\n  branch, checkout, switch, merge,\n  remote, push, pull, fetch, clone,\n  stash, reset, revert, rebase, cherry-pick, tag',
        command: 'git'
      };
    }

    switch (subcommand) {
      case 'init':
        return { ...this.git.init(), command };

      case 'status':
        return { ...this.git.status(), command };

      case 'add':
        return { ...this.git.add(subArgs[0] || flags[0]), command };

      case 'commit': {
        // Find -m flag and get message
        const mIdx = allArgs.indexOf('-m');
        const message = mIdx >= 0 ? allArgs[mIdx + 1] : null;
        const commitFlags = flags.filter(f => f !== '-m');
        if (!message && !commitFlags.includes('--allow-empty-message')) {
          return { error: 'error: switch `m\' requires a value', command };
        }
        return { ...this.git.commit(message, commitFlags), command };
      }

      case 'log':
        return { ...this.git.log(flags), command };

      case 'diff':
        return { ...this.git.diff(subArgs[0]), command };

      case 'branch':
        return { ...this.git.branch(subArgs[0], flags), command };

      case 'checkout':
        return { ...this.git.checkout(subArgs[0], flags), command };

      case 'switch':
        return { ...this.git.switch_(subArgs[0], flags), command };

      case 'merge':
        return { ...this.git.merge(subArgs[0]), command };

      case 'remote':
        return { ...this.git.remote(subArgs[0], subArgs[1], subArgs[2]), command };

      case 'push': {
        const pushArgs = subArgs.filter(a => !a.startsWith('-'));
        return { ...this.git.push(pushArgs[0], pushArgs[1], flags), command };
      }

      case 'pull':
        return { ...this.git.pull(subArgs[0], subArgs[1]), command };

      case 'fetch':
        return { ...this.git.fetch(subArgs[0]), command };

      case 'clone':
        return { ...this.git.clone(subArgs[0]), command };

      case 'stash':
        return { ...this.git.stash(subArgs[0]), command };

      case 'reset':
        return { ...this.git.reset(subArgs[0] || flags[flags.length - 1], flags), command };

      case 'revert':
        return { ...this.git.revert(subArgs[0]), command };

      case 'rebase':
        return { ...this.git.rebase(subArgs[0]), command };

      case 'cherry-pick':
        return { ...this.git.cherryPick(subArgs[0]), command };

      case 'tag':
        return { ...this.git.tag(subArgs[0], flags), command };

      case 'config':
        return { ...this.git.configCmd(subArgs[0], subArgs[1]), command };

      default:
        return {
          error: `git: '${subcommand}' is not a git command. See 'git --help'.`,
          command,
        };
    }
  }

  _getHelp() {
    return `@@bold@@Available Commands@@

@@blue@@Navigation:@@
  pwd          Print working directory
  ls           List directory contents
  cd <dir>     Change directory
  clear        Clear terminal

@@blue@@File Management:@@
  mkdir <dir>  Create directory
  touch <file> Create file
  rm <file>    Remove file
  rmdir <dir>  Remove empty directory
  mv <s> <d>   Move/rename
  cp <s> <d>   Copy file/directory
  cat <file>   Display file contents
  echo <text>  Print text (use > or >> to write to file)

@@blue@@Git - Basics:@@
  git init             Initialize repository
  git status           Show working tree status
  git add <file>       Stage changes
  git commit -m "msg"  Record changes
  git log              Show commit history
  git diff             Show changes

@@blue@@Git - Branching:@@
  git branch           List branches
  git branch <name>    Create branch
  git checkout <name>  Switch branch
  git switch <name>    Switch branch
  git merge <branch>   Merge branch

@@blue@@Git - Remote:@@
  git remote add <name> <url>
  git push             Upload to remote
  git pull             Download from remote
  git fetch            Check for updates
  git clone <url>      Clone repository

@@blue@@Git - Advanced:@@
  git stash            Stash changes
  git reset            Reset commits
  git revert <hash>    Revert a commit
  git rebase <branch>  Rebase branch
  git cherry-pick      Pick specific commit
  git tag              Manage tags

@@blue@@Other:@@
  help         Show this help
  man <cmd>    Show manual for command
  whoami       Display current user
  date         Display current date`;
  }

  _getManPage(cmd) {
    const pages = {
      pwd: '@@bold@@PWD(1)@@\n\nNAME\n  pwd - print name of current working directory\n\nSYNOPSIS\n  pwd\n\nDESCRIPTION\n  Print the full filename of the current working directory.',
      ls: '@@bold@@LS(1)@@\n\nNAME\n  ls - list directory contents\n\nSYNOPSIS\n  ls [OPTIONS] [PATH]\n\nOPTIONS\n  -a    Show hidden files\n  -l    Long format listing\n\nDESCRIPTION\n  List information about files in the current directory.',
      cd: '@@bold@@CD(1)@@\n\nNAME\n  cd - change directory\n\nSYNOPSIS\n  cd [DIR]\n\nDESCRIPTION\n  Change the current working directory.\n  Use "cd .." to go up one level.\n  Use "cd ~" to go to home directory.',
      mkdir: '@@bold@@MKDIR(1)@@\n\nNAME\n  mkdir - make directories\n\nSYNOPSIS\n  mkdir [-p] DIRECTORY\n\nOPTIONS\n  -p    Create parent directories as needed\n\nDESCRIPTION\n  Create a new directory.',
      git: '@@bold@@GIT(1)@@\n\nNAME\n  git - the distributed version control system\n\nSYNOPSIS\n  git <command> [<args>]\n\nDESCRIPTION\n  Git is a version control system that tracks changes in your code.\n  Use "help" to see all available git commands.',
    };
    if (!cmd) return 'What manual page do you want?\nUsage: man <command>';
    return pages[cmd] || `No manual entry for ${cmd}`;
  }

  // History navigation
  getPreviousCommand() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return this.history[0] || '';
  }

  getNextCommand() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    this.historyIndex = this.history.length;
    return '';
  }

  // Tab completion
  getCompletions(partial) {
    const parsed = this._parse(partial);
    if (!parsed) return [];

    const { command, args } = parsed;

    // Command completion
    const allCommands = [
      'pwd', 'ls', 'cd', 'mkdir', 'touch', 'rm', 'rmdir',
      'cat', 'mv', 'cp', 'echo', 'clear', 'help', 'man',
      'git', 'whoami', 'date',
    ];

    if (args.length === 0 && !partial.endsWith(' ')) {
      return allCommands.filter(c => c.startsWith(command));
    }

    // Git subcommand completion
    if (command === 'git' && args.length <= 1 && !partial.endsWith(' ')) {
      const gitCommands = [
        'init', 'status', 'add', 'commit', 'log', 'diff',
        'branch', 'checkout', 'switch', 'merge',
        'remote', 'push', 'pull', 'fetch', 'clone',
        'stash', 'reset', 'revert', 'rebase', 'cherry-pick', 'tag', 'config',
      ];
      const sub = args[0] || '';
      return gitCommands.filter(c => c.startsWith(sub)).map(c => `git ${c}`);
    }

    // File/dir completion
    const lastArg = args[args.length - 1] || '';
    const result = this.fs.ls('', ['-a']);
    if (result.output && Array.isArray(result.output)) {
      const names = result.output.map(e => e.name).filter(n => n !== '.' && n !== '..');
      return names.filter(n => n.startsWith(lastArg));
    }

    return [];
  }
}
