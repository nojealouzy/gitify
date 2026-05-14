'use client';
import styles from './GitGraph.module.css';

export default function GitGraph({ graphData }) {
  if (!graphData || !graphData.commits || graphData.commits.length === 0) {
    return (
      <div className={styles.gitGraph}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>🔀</span>
          <span className={styles.headerTitle}>GIT GRAPH</span>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>⚡</span>
          <span>No commits yet</span>
          <span className={styles.emptyHint}>Run git init & git commit</span>
        </div>
      </div>
    );
  }

  const { commits, branches, HEAD, tags } = graphData;

  // Get unique branches with colors
  const branchColors = {};
  const colorPalette = ['var(--green)', 'var(--purple)', 'var(--blue)', 'var(--orange)', 'var(--cyan)', 'var(--yellow)'];
  let colorIdx = 0;
  Object.keys(branches).forEach(b => {
    branchColors[b] = colorPalette[colorIdx % colorPalette.length];
    colorIdx++;
  });

  // Display commits in reverse order (newest first)
  const displayCommits = [...commits].reverse().slice(0, 20);

  return (
    <div className={styles.gitGraph}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🔀</span>
        <span className={styles.headerTitle}>GIT GRAPH</span>
      </div>

      {/* Branch labels */}
      <div className={styles.branches}>
        {Object.entries(branches).map(([name, hash]) => (
          <span
            key={name}
            className={`${styles.branchLabel} ${name === HEAD ? styles.activeBranch : ''}`}
            style={{ '--branch-color': branchColors[name] }}
          >
            {name === HEAD && <span className={styles.headIndicator}>●</span>}
            {name}
          </span>
        ))}
      </div>

      {/* Commit list */}
      <div className={styles.commitList}>
        {displayCommits.map((commit, i) => {
          const isHead = branches[HEAD] === commit.hash;
          const branchLabels = Object.entries(branches)
            .filter(([, h]) => h === commit.hash)
            .map(([name]) => name);
          const tagLabels = Object.entries(tags || {})
            .filter(([, h]) => h === commit.hash)
            .map(([name]) => name);
          const color = branchColors[commit.branch] || 'var(--text-muted)';

          return (
            <div key={commit.hash} className={styles.commitRow}>
              {/* Graph line */}
              <div className={styles.graphLine}>
                <div className={styles.line} style={{ background: color }}></div>
                <div
                  className={`${styles.commitDot} ${isHead ? styles.headDot : ''} ${commit.isMerge ? styles.mergeDot : ''}`}
                  style={{ borderColor: color, background: isHead ? color : 'var(--bg-panel)' }}
                ></div>
                {i < displayCommits.length - 1 && (
                  <div className={styles.line} style={{ background: color }}></div>
                )}
              </div>

              {/* Commit info */}
              <div className={styles.commitInfo}>
                <div className={styles.commitTop}>
                  <span className={styles.commitHash}>{commit.hash}</span>
                  {branchLabels.map(b => (
                    <span key={b} className={styles.commitBranch} style={{ '--branch-color': branchColors[b] }}>
                      {b === HEAD ? `HEAD → ${b}` : b}
                    </span>
                  ))}
                  {tagLabels.map(t => (
                    <span key={t} className={styles.commitTag}>🏷 {t}</span>
                  ))}
                </div>
                <div className={styles.commitMessage}>
                  {commit.isMerge && <span className={styles.mergeIcon}>⑂</span>}
                  {commit.isRevert && <span className={styles.revertIcon}>↩</span>}
                  {commit.isCherryPick && <span className={styles.cherryIcon}>🍒</span>}
                  {commit.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
