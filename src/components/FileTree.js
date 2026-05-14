'use client';
import styles from './FileTree.module.css';

export default function FileTree({ tree, gitStatuses = [] }) {
  if (!tree) return null;

  const getStatusClass = (name) => {
    const status = gitStatuses.find(s => s.file === name || s.file?.endsWith('/' + name));
    if (!status) return '';
    if (status.staged) return styles.staged;
    if (status.status === 'modified') return styles.modified;
    if (status.status === 'untracked') return styles.untracked;
    return '';
  };

  const renderNode = (node, depth = 0) => {
    if (!node) return null;
    const isDir = node.type === 'dir';
    const icon = isDir ? '📂' : getFileIcon(node.name);
    const statusClass = getStatusClass(node.name);

    return (
      <div key={node.name} className={styles.node}>
        <div
          className={`${styles.nodeLabel} ${statusClass}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={`${styles.name} ${isDir ? styles.dirName : ''}`}>
            {node.name}{isDir ? '/' : ''}
          </span>
          {statusClass && <span className={styles.statusDot}></span>}
        </div>
        {isDir && node.children && (
          <div className={styles.children}>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.fileTree}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>📁</span>
        <span className={styles.headerTitle}>EXPLORER</span>
      </div>
      <div className={styles.treeBody}>
        {tree.children?.map(child => renderNode(child, 0))}
        {(!tree.children || tree.children.length === 0) && (
          <div className={styles.empty}>Empty directory</div>
        )}
      </div>
    </div>
  );
}

function getFileIcon(name) {
  if (name.endsWith('.js')) return '🟨';
  if (name.endsWith('.ts')) return '🔷';
  if (name.endsWith('.html')) return '🟧';
  if (name.endsWith('.css')) return '🟦';
  if (name.endsWith('.py')) return '🐍';
  if (name.endsWith('.md')) return '📝';
  if (name.endsWith('.json')) return '📋';
  if (name.endsWith('.txt')) return '📄';
  if (name.endsWith('.gitignore')) return '🚫';
  if (name.endsWith('.env')) return '🔒';
  return '📄';
}
