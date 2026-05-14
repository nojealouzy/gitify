'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VirtualFS } from '@/engine/virtualFS';
import { GitEngine } from '@/engine/gitEngine';
import { CommandParser } from '@/engine/commandParser';
import { levels, badges } from '@/lessons/levels';
import {
  loadProgress, saveProgress, markObjectiveComplete,
  markLevelComplete
} from '@/lessons/progressManager';
import Terminal from '@/components/Terminal';
import FileTree from '@/components/FileTree';
import GitGraph from '@/components/GitGraph';
import MissionPanel from '@/components/MissionPanel';
import styles from './play.module.css';

function PlayContent() {
  const searchParams = useSearchParams();
  const levelId = parseInt(searchParams.get('level') || '1', 10);

  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(null);
  const [completedObjectives, setCompletedObjectives] = useState([]);
  const [fileTree, setFileTree] = useState(null);
  const [gitGraph, setGitGraph] = useState(null);
  const [gitStatuses, setGitStatuses] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [xpPopup, setXpPopup] = useState(null);

  const parserRef = useRef(null);
  const fsRef = useRef(null);
  const gitRef = useRef(null);
  const commandHistoryRef = useRef([]);

  const level = levels.find(l => l.id === levelId) || levels[0];

  // Initialize engines
  useEffect(() => {
    const buildNode = (data, parent = null) => {
      if (data.type === 'file') {
        return { type: 'file', name: data.name, content: data.content || '', parent };
      }
      const node = { type: 'dir', name: data.name, children: {}, parent };
      if (data.children) {
        for (const [key, child] of Object.entries(data.children)) {
          const childData = typeof child === 'object' && child.name ? child : { ...child, name: key };
          node.children[key] = buildNode(childData, node);
        }
      }
      return node;
    };

    const fs = new VirtualFS();
    if (level.initialFS) {
      fs.root = buildNode(level.initialFS);
      fs.cwd = fs.root;
      fs.cwdPath = ['~'];
    }

    const git = new GitEngine(fs);
    if (level.preInit) {
      level.preInit(fs, git);
    }

    const parser = new CommandParser(fs, git);

    fsRef.current = fs;
    gitRef.current = git;
    parserRef.current = parser;
    commandHistoryRef.current = [];

    // Load saved progress
    const p = loadProgress();
    const key = `level_${level.id}`;
    setCompletedObjectives(p.completedObjectives[key] || []);
    setProgress(p);

    // Update visuals
    setFileTree(fs.getFullTree());
    setGitGraph(git.getGraphData());
    setGitStatuses(git.initialized ? git.getStagingInfo().statuses : []);

    setMounted(true);
  }, [levelId, level]);

  const updateVisuals = useCallback(() => {
    if (!fsRef.current || !gitRef.current) return;
    setFileTree(fsRef.current.getFullTree());
    setGitGraph(gitRef.current.getGraphData());
    if (gitRef.current.initialized) {
      setGitStatuses(gitRef.current.getStagingInfo().statuses);
    }
  }, []);

  const handleCommandExecuted = useCallback((result) => {
    commandHistoryRef.current.push(result);
    updateVisuals();

    // Check objectives
    if (!level || !progress) return;

    let newCompleted = [...completedObjectives];
    let xpGained = 0;
    let changed = false;

    for (const obj of level.objectives) {
      if (newCompleted.includes(obj.id)) continue;

      // Only check the next uncompleted objective in order
      const objIndex = level.objectives.indexOf(obj);
      const previousCompleted = objIndex === 0 || newCompleted.includes(level.objectives[objIndex - 1]?.id);
      if (!previousCompleted) break;

      try {
        const valid = obj.validate(
          commandHistoryRef.current,
          fsRef.current,
          gitRef.current
        );
        if (valid) {
          newCompleted.push(obj.id);
          xpGained += Math.floor(level.xpReward / level.objectives.length);
          changed = true;
        }
      } catch (e) {
        // Validation error — skip
      }
    }

    if (changed) {
      setCompletedObjectives(newCompleted);

      // Show XP popup
      if (xpGained > 0) {
        setXpPopup(`+${xpGained} XP`);
        setTimeout(() => setXpPopup(null), 1500);
      }

      // Update progress
      const newProgress = { ...progress };
      newCompleted.forEach(id => {
        markObjectiveComplete(newProgress, level.id, id, level.xpReward);
      });

      // Check if level complete
      if (newCompleted.length === level.objectives.length) {
        const badge = badges.find(b => b.level === level.id);
        markLevelComplete(newProgress, level.id, badge);
        setShowCelebration(true);
        triggerConfetti();
      }

      saveProgress(newProgress);
      setProgress(newProgress);
    }
  }, [level, progress, completedObjectives, updateVisuals]);

  const triggerConfetti = () => {
    const colors = ['#3fb950', '#58a6ff', '#bc8cff', '#f0c000', '#f85149', '#f0883e'];
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      duration: Math.random() * 2 + 3,
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setConfettiPieces([]), 5000);
  };

  if (!mounted || !parserRef.current) {
    return <div className={styles.loading}>Loading Gitify...</div>;
  }

  const nextLevelId = level.id < levels.length ? level.id + 1 : null;

  return (
    <div className={styles.playPage}>
      {/* Confetti */}
      {confettiPieces.length > 0 && (
        <div className={styles.confettiContainer}>
          {confettiPieces.map(p => (
            <div
              key={p.id}
              className={styles.confetti}
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                background: p.color,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
            ></div>
          ))}
        </div>
      )}

      {/* XP Popup */}
      {xpPopup && (
        <div className={styles.xpPopup}>{xpPopup}</div>
      )}

      {/* Top bar */}
      <header className={styles.topBar}>
        <a href="/" className={styles.brand}>
          <span className={styles.brandIcon}>⚡</span>
          <span className={styles.brandText}>GITIFY</span>
        </a>
        <div className={styles.levelIndicator}>
          <span className={styles.levelLabel}>Level {level.id}/8</span>
          <div className={styles.topProgress}>
            <div
              className={styles.topProgressFill}
              style={{ width: `${(completedObjectives.length / level.objectives.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className={styles.topXP}>
          ⚡ {progress?.totalXP || 0} XP
        </div>
      </header>

      {/* Main 3-panel layout */}
      <div className={styles.mainLayout}>
        {/* Left panel — File Tree + Git Graph */}
        <aside className={styles.leftPanel}>
          <div className={styles.fileTreeSection}>
            <FileTree tree={fileTree} gitStatuses={gitStatuses} />
          </div>
          <div className={styles.gitGraphSection}>
            <GitGraph graphData={gitGraph} />
          </div>
        </aside>

        {/* Center — Terminal */}
        <main className={styles.centerPanel}>
          <Terminal
            parser={parserRef.current}
            onCommandExecuted={handleCommandExecuted}
          />
        </main>

        {/* Right panel — Mission */}
        <aside className={styles.rightPanel}>
          <MissionPanel
            level={level}
            completedObjectives={completedObjectives}
          />
        </aside>
      </div>

      {/* Level Complete Overlay */}
      {showCelebration && (
        <div className={styles.overlay}>
          <div className={styles.celebrationCard}>
            <div className={styles.celebIcon}>🎉</div>
            <h2>Level {level.id} Complete!</h2>
            <p className={styles.celebTitle}>{level.title}</p>
            <div className={styles.celebBadge}>
              <span className={styles.celebBadgeIcon}>
                {badges.find(b => b.level === level.id)?.icon}
              </span>
              <span>Badge Earned: {badges.find(b => b.level === level.id)?.name}</span>
            </div>
            <div className={styles.celebXP}>+{level.xpReward} XP</div>
            <div className={styles.celebButtons}>
              {nextLevelId && (
                <a href={`/play?level=${nextLevelId}`} className="btn btn-primary">
                  Next Level →
                </a>
              )}
              <a href="/" className="btn btn-secondary">
                Level Select
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ color: '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading Gitify...</div>}>
      <PlayContent />
    </Suspense>
  );
}
