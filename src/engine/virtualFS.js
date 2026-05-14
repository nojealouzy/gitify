// ============================================================
// virtualFS.js — In-Memory Virtual File System
// Simulates a real filesystem for terminal commands
// ============================================================

export class VirtualFS {
  constructor(initialStructure = null) {
    this.root = initialStructure || {
      type: 'dir',
      name: '~',
      children: {},
      parent: null,
    };
    this.cwd = this.root;
    this.cwdPath = ['~'];
  }

  // ---- Serialization ----
  serialize() {
    const serializeNode = (node) => {
      if (node.type === 'file') {
        return { type: 'file', name: node.name, content: node.content || '' };
      }
      const children = {};
      for (const [name, child] of Object.entries(node.children)) {
        children[name] = serializeNode(child);
      }
      return { type: 'dir', name: node.name, children };
    };
    return { tree: serializeNode(this.root), cwdPath: [...this.cwdPath] };
  }

  static deserialize(data) {
    const fs = new VirtualFS();
    const buildNode = (serialized, parent) => {
      if (serialized.type === 'file') {
        return { type: 'file', name: serialized.name, content: serialized.content || '', parent };
      }
      const node = { type: 'dir', name: serialized.name, children: {}, parent };
      for (const [name, child] of Object.entries(serialized.children)) {
        node.children[name] = buildNode(child, node);
      }
      return node;
    };
    fs.root = buildNode(data.tree, null);
    fs.cwdPath = data.cwdPath;
    fs.cwd = fs._resolvePath(data.cwdPath.join('/'));
    return fs;
  }

  // ---- Path Resolution ----
  _resolvePath(pathStr) {
    if (!pathStr) return this.cwd;

    let parts;
    let current;

    if (pathStr.startsWith('~') || pathStr.startsWith('/')) {
      current = this.root;
      parts = pathStr.replace(/^~\/?/, '').split('/').filter(Boolean);
    } else {
      current = this.cwd;
      parts = pathStr.split('/').filter(Boolean);
    }

    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (current.parent) current = current.parent;
        continue;
      }
      if (current.type !== 'dir' || !current.children[part]) {
        return null;
      }
      current = current.children[part];
    }
    return current;
  }

  _getAbsolutePath(node) {
    const parts = [];
    let current = node;
    while (current) {
      parts.unshift(current.name);
      current = current.parent;
    }
    if (parts[0] === '~') return parts.join('/');
    return parts.join('/');
  }

  _updateCwdPath() {
    const parts = [];
    let current = this.cwd;
    while (current) {
      parts.unshift(current.name);
      current = current.parent;
    }
    this.cwdPath = parts;
  }

  // ---- Commands ----
  pwd() {
    return this.cwdPath.join('/').replace(/^~/, '~');
  }

  ls(pathStr = '', flags = []) {
    const target = pathStr ? this._resolvePath(pathStr) : this.cwd;
    if (!target) return { error: `ls: cannot access '${pathStr}': No such file or directory` };
    if (target.type === 'file') return { output: [target.name] };

    let entries = Object.keys(target.children).sort();
    const showAll = flags.includes('-a') || flags.includes('--all');
    const showLong = flags.includes('-l');

    const result = [];
    if (showAll) {
      result.push({ name: '.', type: 'dir' });
      result.push({ name: '..', type: 'dir' });
    }

    for (const name of entries) {
      if (!showAll && name.startsWith('.')) continue;
      const child = target.children[name];
      result.push({
        name,
        type: child.type,
        content: child.type === 'file' ? child.content : null,
      });
    }

    return { output: result, long: showLong };
  }

  cd(pathStr) {
    if (!pathStr || pathStr === '~') {
      this.cwd = this.root;
      this.cwdPath = ['~'];
      return { output: '' };
    }

    const target = this._resolvePath(pathStr);
    if (!target) return { error: `cd: no such file or directory: ${pathStr}` };
    if (target.type !== 'dir') return { error: `cd: not a directory: ${pathStr}` };

    this.cwd = target;
    this._updateCwdPath();
    return { output: '' };
  }

  mkdir(pathStr, flags = []) {
    if (!pathStr) return { error: 'mkdir: missing operand' };

    const parts = pathStr.split('/').filter(Boolean);
    const recursive = flags.includes('-p');

    let current;
    if (pathStr.startsWith('~') || pathStr.startsWith('/')) {
      current = this.root;
    } else {
      current = this.cwd;
    }

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '.' || part === '~') continue;
      if (part === '..') {
        if (current.parent) current = current.parent;
        continue;
      }

      if (current.children[part]) {
        if (current.children[part].type === 'dir') {
          current = current.children[part];
          continue;
        }
        return { error: `mkdir: cannot create directory '${pathStr}': File exists` };
      }

      if (i < parts.length - 1 && !recursive) {
        return { error: `mkdir: cannot create directory '${pathStr}': No such file or directory` };
      }

      const newDir = { type: 'dir', name: part, children: {}, parent: current };
      current.children[part] = newDir;
      current = newDir;
    }
    return { output: '' };
  }

  touch(filename) {
    if (!filename) return { error: 'touch: missing file operand' };

    const parts = filename.split('/');
    const name = parts.pop();
    const dirPath = parts.join('/');
    const parent = dirPath ? this._resolvePath(dirPath) : this.cwd;

    if (!parent) return { error: `touch: cannot touch '${filename}': No such file or directory` };
    if (parent.type !== 'dir') return { error: `touch: cannot touch '${filename}': Not a directory` };

    if (!parent.children[name]) {
      parent.children[name] = { type: 'file', name, content: '', parent };
    }
    return { output: '' };
  }

  rm(pathStr, flags = []) {
    if (!pathStr) return { error: 'rm: missing operand' };

    const recursive = flags.includes('-r') || flags.includes('-rf') || flags.includes('-R');
    const force = flags.includes('-f') || flags.includes('-rf');

    const parts = pathStr.split('/');
    const name = parts.pop();
    const dirPath = parts.join('/');
    const parent = dirPath ? this._resolvePath(dirPath) : this.cwd;

    if (!parent || !parent.children[name]) {
      if (force) return { output: '' };
      return { error: `rm: cannot remove '${pathStr}': No such file or directory` };
    }

    const target = parent.children[name];
    if (target.type === 'dir' && !recursive) {
      return { error: `rm: cannot remove '${pathStr}': Is a directory` };
    }

    delete parent.children[name];
    return { output: '' };
  }

  rmdir(pathStr) {
    if (!pathStr) return { error: 'rmdir: missing operand' };

    const target = this._resolvePath(pathStr);
    if (!target) return { error: `rmdir: failed to remove '${pathStr}': No such file or directory` };
    if (target.type !== 'dir') return { error: `rmdir: failed to remove '${pathStr}': Not a directory` };
    if (Object.keys(target.children).length > 0) {
      return { error: `rmdir: failed to remove '${pathStr}': Directory not empty` };
    }

    const parent = target.parent;
    if (parent) {
      delete parent.children[target.name];
    }
    return { output: '' };
  }

  cat(pathStr) {
    if (!pathStr) return { error: 'cat: missing file operand' };

    const target = this._resolvePath(pathStr);
    if (!target) return { error: `cat: ${pathStr}: No such file or directory` };
    if (target.type === 'dir') return { error: `cat: ${pathStr}: Is a directory` };

    return { output: target.content || '' };
  }

  mv(source, dest) {
    if (!source || !dest) return { error: 'mv: missing operand' };

    const srcParts = source.split('/');
    const srcName = srcParts.pop();
    const srcDirPath = srcParts.join('/');
    const srcParent = srcDirPath ? this._resolvePath(srcDirPath) : this.cwd;

    if (!srcParent || !srcParent.children[srcName]) {
      return { error: `mv: cannot stat '${source}': No such file or directory` };
    }

    const srcNode = srcParent.children[srcName];
    const destTarget = this._resolvePath(dest);

    if (destTarget && destTarget.type === 'dir') {
      srcNode.parent = destTarget;
      srcNode.name = srcName;
      destTarget.children[srcName] = srcNode;
      delete srcParent.children[srcName];
    } else {
      const destParts = dest.split('/');
      const destName = destParts.pop();
      const destDirPath = destParts.join('/');
      const destParent = destDirPath ? this._resolvePath(destDirPath) : this.cwd;

      if (!destParent) {
        return { error: `mv: cannot move '${source}' to '${dest}': No such file or directory` };
      }

      srcNode.parent = destParent;
      srcNode.name = destName;
      destParent.children[destName] = srcNode;
      delete srcParent.children[srcName];
    }

    return { output: '' };
  }

  cp(source, dest, flags = []) {
    if (!source || !dest) return { error: 'cp: missing operand' };

    const recursive = flags.includes('-r') || flags.includes('-R');
    const srcNode = this._resolvePath(source);

    if (!srcNode) return { error: `cp: cannot stat '${source}': No such file or directory` };
    if (srcNode.type === 'dir' && !recursive) {
      return { error: `cp: -r not specified; omitting directory '${source}'` };
    }

    const deepCopy = (node, parent) => {
      if (node.type === 'file') {
        return { type: 'file', name: node.name, content: node.content, parent };
      }
      const copy = { type: 'dir', name: node.name, children: {}, parent };
      for (const [name, child] of Object.entries(node.children)) {
        copy.children[name] = deepCopy(child, copy);
      }
      return copy;
    };

    const destTarget = this._resolvePath(dest);

    if (destTarget && destTarget.type === 'dir') {
      const copy = deepCopy(srcNode, destTarget);
      destTarget.children[srcNode.name] = copy;
    } else {
      const destParts = dest.split('/');
      const destName = destParts.pop();
      const destDirPath = destParts.join('/');
      const destParent = destDirPath ? this._resolvePath(destDirPath) : this.cwd;

      if (!destParent) {
        return { error: `cp: cannot copy '${source}' to '${dest}': No such file or directory` };
      }

      const copy = deepCopy(srcNode, destParent);
      copy.name = destName;
      destParent.children[destName] = copy;
    }

    return { output: '' };
  }

  echo(args, redirect = null, appendMode = false) {
    const text = args.join(' ');

    if (!redirect) {
      return { output: text };
    }

    const target = this._resolvePath(redirect);
    if (target && target.type === 'dir') {
      return { error: `bash: ${redirect}: Is a directory` };
    }

    if (target) {
      target.content = appendMode ? (target.content || '') + text + '\n' : text + '\n';
    } else {
      const parts = redirect.split('/');
      const name = parts.pop();
      const dirPath = parts.join('/');
      const parent = dirPath ? this._resolvePath(dirPath) : this.cwd;
      if (!parent) return { error: `bash: ${redirect}: No such file or directory` };
      parent.children[name] = { type: 'file', name, content: text + '\n', parent };
    }
    return { output: '' };
  }

  // Write content to a file (used by the lesson system to pre-populate files)
  writeFile(pathStr, content) {
    const parts = pathStr.split('/').filter(Boolean);
    const fileName = parts.pop();
    let current = pathStr.startsWith('~') ? this.root : this.cwd;

    // Navigate/create directories
    for (const part of parts) {
      if (part === '~') continue;
      if (!current.children[part]) {
        current.children[part] = { type: 'dir', name: part, children: {}, parent: current };
      }
      current = current.children[part];
    }

    current.children[fileName] = { type: 'file', name: fileName, content, parent: current };
  }

  // Get the full file tree as a nested structure (for the FileTree component)
  getTree(node = null) {
    const target = node || this.cwd;
    if (target.type === 'file') {
      return { name: target.name, type: 'file' };
    }
    return {
      name: target.name,
      type: 'dir',
      children: Object.entries(target.children)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, child]) => this.getTree(child)),
    };
  }

  getFullTree() {
    return this.getTree(this.root);
  }

  // Check if a path exists
  exists(pathStr) {
    return this._resolvePath(pathStr) !== null;
  }

  // Get file content
  getFileContent(pathStr) {
    const node = this._resolvePath(pathStr);
    if (!node || node.type !== 'dir') return node?.content || '';
    return null;
  }

  // List all files recursively (for git operations)
  listAllFiles(node = null, prefix = '') {
    const target = node || this.cwd;
    const files = [];
    if (target.type === 'file') {
      return [prefix + target.name];
    }
    for (const [name, child] of Object.entries(target.children)) {
      if (name === '.git') continue; // Skip .git directory in listings
      const path = prefix ? `${prefix}/${name}` : name;
      if (child.type === 'file') {
        files.push(path);
      } else {
        files.push(...this.listAllFiles(child, path));
      }
    }
    return files.sort();
  }
}
