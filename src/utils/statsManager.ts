export interface GameResult {
  date: string;
  score: number;
  won: boolean;
  guesses: number;
  hintsUsed: number;
}

export interface PlayerStats {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  scoreHistory: GameResult[];
}

const STATS_KEY = 'dictionarydle_stats';
const MAX_HISTORY = 10;

// Get today's date string
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Load stats from localStorage
export function loadStats(): PlayerStats {
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
      scoreHistory: []
    };
  }
  return JSON.parse(stored);
}

// Save stats to localStorage
export function saveStats(stats: PlayerStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Update stats after a game
export function updateStats(result: GameResult): PlayerStats {
  const stats = loadStats();
  const today = getTodayString();
  
  // Check if already played today
  const alreadyPlayedToday = stats.lastPlayedDate === today;
  
  if (alreadyPlayedToday) {
    // Already played today - just update the score if it's better
    const todayIndex = stats.scoreHistory.findIndex(h => h.date === today);
    if (todayIndex !== -1) {
      // Replace if new score is higher
      if (result.score > stats.scoreHistory[todayIndex].score) {
        stats.scoreHistory[todayIndex] = result;
      }
    }
  } else {
    // New day - update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    if (stats.lastPlayedDate === yesterdayString) {
      // Played yesterday - continue streak
      stats.currentStreak++;
    } else if (stats.lastPlayedDate === null) {
      // First game ever
      stats.currentStreak = 1;
    } else {
      // Missed a day - reset streak
      stats.currentStreak = 1;
    }
    
    // Update longest streak
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
    
    // Add to history (keep only last MAX_HISTORY games)
    stats.scoreHistory = [result, ...stats.scoreHistory].slice(0, MAX_HISTORY);
    stats.lastPlayedDate = today;
  }
  
  saveStats(stats);
  return stats;
}