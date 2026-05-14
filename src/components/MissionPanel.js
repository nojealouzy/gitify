'use client';
import { useState } from 'react';
import styles from './MissionPanel.module.css';

export default function MissionPanel({ level, completedObjectives = [], onHintRequest }) {
  const [revealedHints, setRevealedHints] = useState(new Set());

  if (!level) return null;

  const toggleHint = (id) => {
    setRevealedHints(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalObjectives = level.objectives.length;
  const completedCount = completedObjectives.length;
  const progress = Math.round((completedCount / totalObjectives) * 100);
  const allComplete = completedCount === totalObjectives;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🎯</span>
        <span className={styles.headerTitle}>MISSION</span>
        <span className={styles.progressBadge}>{completedCount}/{totalObjectives}</span>
      </div>

      {/* Level info */}
      <div className={styles.levelInfo}>
        <div className={styles.levelTitle}>
          <span className={styles.levelIcon}>{level.icon}</span>
          <span>Level {level.id}: {level.title}</span>
        </div>
        <p className={styles.narrative}>{level.narrative}</p>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
      </div>

      {/* Objectives */}
      <div className={styles.objectives}>
        {level.objectives.map((obj, i) => {
          const completed = completedObjectives.includes(obj.id);
          const isNext = !completed && completedObjectives.length === i;
          const hintRevealed = revealedHints.has(obj.id);

          return (
            <div
              key={obj.id}
              className={`${styles.objective} ${completed ? styles.completed : ''} ${isNext ? styles.active : ''}`}
            >
              <div className={styles.objectiveMain}>
                <span className={styles.checkbox}>
                  {completed ? '✅' : isNext ? '👉' : '⬜'}
                </span>
                <span className={styles.objectiveText}>{obj.text}</span>
              </div>
              {isNext && obj.hint && (
                <button className={styles.hintBtn} onClick={() => toggleHint(obj.id)}>
                  {hintRevealed ? '🙈 Hide Hint' : '💡 Show Hint'}
                </button>
              )}
              {hintRevealed && (
                <div className={styles.hint}>
                  <span className={styles.hintIcon}>💡</span>
                  <code>{obj.hint}</code>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New commands for this level */}
      <div className={styles.commandsSection}>
        <div className={styles.commandsHeader}>
          <span>⌨️</span>
          <span className={styles.commandsTitle}>NEW COMMANDS</span>
        </div>
        <div className={styles.commandsList}>
          {level.commands.map(cmd => (
            <code key={cmd} className={styles.commandBadge}>{cmd}</code>
          ))}
        </div>
      </div>

      {allComplete && (
        <div className={styles.completeMsg}>
          <span className={styles.completeIcon}>🎉</span>
          <span>Level Complete!</span>
          <span className={styles.xpBadge}>+{level.xpReward} XP</span>
        </div>
      )}
    </div>
  );
}
