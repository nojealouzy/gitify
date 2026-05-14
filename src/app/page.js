'use client';

import { useState, useEffect } from 'react';
import { levels, badges } from '@/lessons/levels';
import { loadProgress, isLevelUnlocked, getLevelProgress } from '@/lessons/progressManager';
import styles from './page.module.css';

export default function Home() {
  const [progress, setProgress] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalXP = progress?.totalXP || 0;
  const completedCount = progress?.completedLevels?.length || 0;

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoBadge}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>GITIFY</span>
          </div>
          <h1 className={styles.title}>
            Master <span className="gradient-text">Git & GitHub</span>
            <br />Through Practice
          </h1>
          <p className={styles.subtitle}>
            Stop reading tutorials. Start typing commands. An interactive terminal
            that teaches you everything about Git — from your first <code>git init</code> to
            advanced workflows used by professional developers.
          </p>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>8</span>
              <span className={styles.statLabel}>Levels</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statValue}>50+</span>
              <span className={styles.statLabel}>Commands</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statValue}>100%</span>
              <span className={styles.statLabel}>Free</span>
            </div>
          </div>

          {/* Terminal Preview */}
          <div className={styles.terminalPreview}>
            <div className={styles.previewHeader}>
              <span className={styles.dot} style={{ background: '#f85149' }}></span>
              <span className={styles.dot} style={{ background: '#d29922' }}></span>
              <span className={styles.dot} style={{ background: '#3fb950' }}></span>
              <span className={styles.previewTitle}>gitify — bash</span>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewLine}>
                <span className={styles.pUser}>student</span>
                <span className={styles.pAt}>@</span>
                <span className={styles.pHost}>gitify</span>
                <span className={styles.pColon}>:</span>
                <span className={styles.pPath}>~/my-project</span>
                <span className={styles.pDollar}>$ </span>
                <span className={styles.pCmd}>git status</span>
              </div>
              <div className={styles.previewOutput}>On branch main</div>
              <div className={styles.previewOutput}>Changes to be committed:</div>
              <div className={styles.previewOutputGreen}>&nbsp;&nbsp;new file:&nbsp;&nbsp; index.html</div>
              <div className={styles.previewLine}>
                <span className={styles.pUser}>student</span>
                <span className={styles.pAt}>@</span>
                <span className={styles.pHost}>gitify</span>
                <span className={styles.pColon}>:</span>
                <span className={styles.pPath}>~/my-project</span>
                <span className={styles.pDollar}>$ </span>
                <span className={styles.pCursor}>█</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Level Select */}
      <section className={styles.levelsSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🗺️</span>
          Choose Your Level
        </h2>
        {totalXP > 0 && (
          <div className={styles.progressSummary}>
            <span className={styles.xpTotal}>⚡ {totalXP} XP</span>
            <span className={styles.levelCount}>{completedCount}/8 Levels Complete</span>
          </div>
        )}

        <div className={styles.levelGrid}>
          {levels.map((level) => {
            const unlocked = isLevelUnlocked(progress, level.id);
            const completed = progress?.completedLevels?.includes(level.id);
            const levelProgress = getLevelProgress(progress, level.id, level.objectives.length);
            const badge = badges.find(b => b.level === level.id);

            return (
              <a
                key={level.id}
                href={unlocked ? `/play?level=${level.id}` : '#'}
                className={`${styles.levelCard} ${!unlocked ? styles.locked : ''} ${completed ? styles.completed : ''}`}
                onClick={e => !unlocked && e.preventDefault()}
              >
                <div className={styles.cardTop}>
                  <span className={styles.levelNum}>Level {level.id}</span>
                  {completed && <span className={styles.checkmark}>✅</span>}
                  {!unlocked && <span className={styles.lockIcon}>🔒</span>}
                </div>
                <span className={styles.cardIcon}>{level.icon}</span>
                <h3 className={styles.cardTitle}>{level.title}</h3>
                <p className={styles.cardSubtitle}>{level.subtitle}</p>

                {levelProgress > 0 && !completed && (
                  <div className={styles.cardProgress}>
                    <div className={styles.cardProgressBar}>
                      <div className={styles.cardProgressFill} style={{ width: `${levelProgress}%` }}></div>
                    </div>
                    <span className={styles.cardProgressText}>{levelProgress}%</span>
                  </div>
                )}

                <div className={styles.cardCommands}>
                  {level.commands.slice(0, 3).map(cmd => (
                    <code key={cmd} className={styles.cmdTag}>{cmd}</code>
                  ))}
                  {level.commands.length > 3 && (
                    <code className={styles.cmdTag}>+{level.commands.length - 3}</code>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.xpReward}>⚡ {level.xpReward} XP</span>
                  {badge && <span className={styles.badgePreview}>{badge.icon} {badge.name}</span>}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🖥️</span>
            <h3>Real Terminal Feel</h3>
            <p>Practice in a terminal that looks and behaves like the real thing. Command history, tab completion, colored output.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📊</span>
            <h3>Visual Git Graph</h3>
            <p>See branches, commits, and merges visualized in real-time as you type commands. Understand what Git actually does.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🎮</span>
            <h3>Gamified Learning</h3>
            <p>Earn XP, unlock badges, and progress through 8 levels. From basic navigation to advanced Git workflows.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🛡️</span>
            <h3>Safe Sandbox</h3>
            <p>Experiment freely. Break things. Nothing is real — you can&apos;t mess up any actual repositories. Just learn.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Built with ❤️ for students who want to master Git</p>
        <p className={styles.footerSub}>Gitify — Open Source Learning Platform</p>
      </footer>
    </div>
  );
}
