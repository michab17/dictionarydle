import '../css/Modal.css';
import { type PlayerStats } from '../utils/statsManager';

interface ModalProps {
  isOpen: boolean;
  type: 'win' | 'lose' | 'howToPlay' | 'alreadyPlayed' | null;
  stats?: {
    guesses: number;
    word: string;
    hintsUsed: number;
    score: number;
  };
  playerStats?: PlayerStats;
  onPlayAgain?: () => void;
  onClose: () => void;
  onShareSuccess?: () => void;
}

function Modal({ isOpen, type, stats, playerStats, onPlayAgain, onClose, onShareSuccess }: ModalProps) {
  if (!isOpen || !type) return null;

  const handleShare = () => {
    if (!stats) return;
    
    const hints = ['\n1. Letters\n', '2. Parts of Speech\n', '3. Sentence\n', '4. Definition\n'];
    const hintsDisplay = hints.slice(0, stats.hintsUsed).join('');
    const shareText = `Dictionary-dle
Score: ${stats.score} points
${stats.guesses} ${stats.guesses === 1 ? 'guess' : 'guesses'}
Hints used: ${hintsDisplay || 'None! 🎯'}

Play at: [your-url]`;
    
    if (navigator.share) {
      navigator.share({
        text: shareText,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        onShareSuccess?.();
      });
    } else {
      navigator.clipboard.writeText(shareText);
      onShareSuccess?.();
    }
  };

  const formatDateLabel = (dateString: String) => {
    const [_year, month, day] = dateString.split('-');
    return `${parseInt(month)}/${parseInt(day)}`;
  };

  const ScoreChart = () => {
    if (!playerStats || playerStats.scoreHistory.length === 0) return null;

    const maxScore = 1000;
    const history = [...playerStats.scoreHistory].reverse(); // Oldest to newest

    return (
      <div className="score-chart">
        <h4>Recent Performance</h4>
        <div className="chart-container">
          <div className="chart-bars">
            {history.map((game, index) => {
              const heightPercent = (game.score / maxScore) * 100;
              const barClass = game.won ? 'bar-win' : 'bar-loss';
              
              return (
                <div key={index} className="chart-bar-wrapper">
                  <div 
                    className={`chart-bar ${barClass}`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${game.date}: ${game.score} pts`}
                  >
                    <span className="bar-score">{game.score}</span>
                  </div>
                  <div className="bar-label">
                    {formatDateLabel(game.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWinModal = () => (
    <div className="modal-content win-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <h2 className="modal-title">🎉 Victory! 🎉</h2>
      
      {playerStats && (
        <div className="streak-display">
          <div className="streak-item">
            <div className="streak-icon">🔥</div>
            <div className="streak-info">
              <div className="streak-value">{playerStats.currentStreak}</div>
              <div className="streak-label">Day Streak</div>
            </div>
          </div>
          <div className="streak-item">
            <div className="streak-icon">🏆</div>
            <div className="streak-info">
              <div className="streak-value">{playerStats.longestStreak}</div>
              <div className="streak-label">Best Streak</div>
            </div>
          </div>
        </div>
      )}

      <div className="final-score">
        <div className="final-score-label">Final Score</div>
        <div className="final-score-value">{stats!.score}</div>
      </div>

      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{stats!.guesses}</div>
          <div className="stat-label">{stats!.guesses === 1 ? 'Guess' : 'Guesses'}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats!.hintsUsed}</div>
          <div className="stat-label">{stats!.hintsUsed === 1 ? 'Hint' : 'Hints'}</div>
        </div>
      </div>

      <ScoreChart />

      <div className="word-reveal">
        <strong>The word was:</strong> {stats!.word}
      </div>

      <div className="modal-actions">
        <button className="btn btn-share" onClick={handleShare}>
          Share Score
        </button>
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );

  const renderLoseModal = () => (
    <div className="modal-content lose-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <h2 className="modal-title">Game Over</h2>
      <p className="modal-message">Don't worry, you'll get the next one!</p>
      
      {playerStats && (
        <div className="streak-display">
          <div className="streak-item">
            <div className="streak-icon">🔥</div>
            <div className="streak-info">
              <div className="streak-value">{playerStats.currentStreak}</div>
              <div className="streak-label">Day Streak</div>
            </div>
          </div>
          <div className="streak-item">
            <div className="streak-icon">🏆</div>
            <div className="streak-info">
              <div className="streak-value">{playerStats.longestStreak}</div>
              <div className="streak-label">Best Streak</div>
            </div>
          </div>
        </div>
      )}

      <div className="final-score lose">
        <div className="final-score-label">Final Score</div>
        <div className="final-score-value">{stats!.score}</div>
      </div>

      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{stats!.guesses}</div>
          <div className="stat-label">{stats!.guesses === 1 ? 'Guess' : 'Guesses'}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats!.hintsUsed}</div>
          <div className="stat-label">{stats!.hintsUsed === 1 ? 'Hint Used' : 'Hints Used'}</div>
        </div>
      </div>

      <ScoreChart />

      <div className="word-reveal">
        <strong>The word was:</strong> {stats!.word}
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Try Again 🔄
        </button>
      </div>
    </div>
  );

  const renderHowToPlayModal = () => (
    <div className="modal-content howto-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <h2 className="modal-title">How to Play</h2>
      
      <div className="howto-content">
        <section className="howto-section">
          <h3>🎯 Objective</h3>
          <p>Guess the hidden word before your score reaches zero!</p>
        </section>

        <section className="howto-section">
          <h3>💯 Scoring System</h3>
          <ul>
            <li>You start with <strong>1000 points</strong></li>
            <li>Each guess costs <strong>100 points</strong></li>
            <li>Each hint costs <strong>100 points</strong></li>
            <li>The game ends when you guess correctly or run out of points</li>
            <li>Try to finish with the highest score possible!</li>
          </ul>
        </section>

        <section className="howto-section">
          <h3>🎮 How It Works</h3>
          <ul>
            <li>Type your guess using the keyboard (on-screen or physical)</li>
            <li>Press ENTER to submit your guess</li>
            <li>Click the "Get Hint" button when you need help</li>
            <li>Use hints wisely - they're expensive but helpful!</li>
          </ul>
        </section>

        <section className="howto-section">
          <h3>💡 Available Hints</h3>
          <div className="hint-progression">
            <div className="hint-step">
              <span className="hint-number">Hint 1:</span>
              <span className="hint-description">Number of letters,</span>
            </div>
            <div className="hint-step">
              <span className="hint-number">Hint 2:</span>
              <span className="hint-description">Parts of speech</span>
            </div>
            <div className="hint-step">
              <span className="hint-number">Hint 3:</span>
              <span className="hint-description">Word used in a sentence</span>
            </div>
            <div className="hint-step">
              <span className="hint-number">Hint 4:</span>
              <span className="hint-description">Definition</span>
            </div>
          </div>
        </section>

        <section className="howto-section">
          <h3>🔥 Daily Streak</h3>
          <p>Play every day to build your streak! Your streak continues whether you win or lose, as long as you play each day.</p>
        </section>

        <section className="howto-section">
          <h3>✨ Strategy Tips</h3>
          <ul>
            <li>Think carefully before guessing to preserve points</li>
            <li>Use hints strategically - sometimes one hint is all you need</li>
            <li>Pay close attention to each hint's information</li>
            <li>The fewer hints you use, the more guesses you can afford!</li>
          </ul>
        </section>
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Got it! Let's Play 🚀
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {type === 'win' && renderWinModal()}
        {type === 'lose' && renderLoseModal()}
        {type === 'howToPlay' && renderHowToPlayModal()}
      </div>
    </div>
  );
}

export default Modal;