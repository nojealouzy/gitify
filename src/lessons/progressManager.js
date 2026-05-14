// ============================================================
// progressManager.js — Save/Load progress with localStorage
// ============================================================

const STORAGE_KEY = 'terminalquest_progress';

export const defaultProgress = {
  currentLevel: 1,
  completedLevels: [],
  completedObjectives: {},
  totalXP: 0,
  badges: [],
  commandsUsed: 0,
  startedAt: new Date().toISOString(),
};

export function loadProgress() {
  if (typeof window === 'undefined') return { ...defaultProgress };
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { ...defaultProgress };
    return { ...defaultProgress, ...JSON.parse(data) };
  } catch {
    return { ...defaultProgress };
  }
}

export function saveProgress(progress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch { /* ignore */ }
}

export function resetProgress() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  return { ...defaultProgress };
}

export function markObjectiveComplete(progress, levelId, objectiveId, xpReward = 0) {
  const key = `level_${levelId}`;
  if (!progress.completedObjectives[key]) {
    progress.completedObjectives[key] = [];
  }
  if (!progress.completedObjectives[key].includes(objectiveId)) {
    progress.completedObjectives[key].push(objectiveId);
    progress.totalXP += Math.floor(xpReward / 6); // XP per objective
  }
  return progress;
}

export function markLevelComplete(progress, levelId, badge) {
  if (!progress.completedLevels.includes(levelId)) {
    progress.completedLevels.push(levelId);
  }
  if (badge && !progress.badges.includes(badge.id)) {
    progress.badges.push(badge.id);
  }
  progress.currentLevel = Math.max(progress.currentLevel, levelId + 1);
  return progress;
}

export function isLevelUnlocked(progress, levelId) {
  if (levelId === 1) return true;
  return progress.completedLevels.includes(levelId - 1);
}

export function getLevelProgress(progress, levelId, totalObjectives) {
  const key = `level_${levelId}`;
  const completed = progress.completedObjectives[key]?.length || 0;
  return Math.round((completed / totalObjectives) * 100);
}
