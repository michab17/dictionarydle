import '../css/Modal.css';

interface ModalProps {
  isOpen: boolean;
  type: 'win' | 'lose' | 'howToPlay' | null;
  stats?: {
    guesses: number;
    word: string;
    hintsUsed: number;
    score: number;
  };
  onPlayAgain?: () => void;
  onClose: () => void;
}

function Modal({ isOpen, type, stats, onPlayAgain, onClose }: ModalProps) {
  if (!isOpen || !type) return null;

  const getCongratsMessage = (guesses: number) => {
    if (guesses === 1) return "Incredible! Psychic powers detected! 🔮";
    if (guesses <= 3) return "Brilliant! You're a word master! 🌟";
    if (guesses <= 5) return "Well done! You got there! 🎉";
    return "Victory! You persevered! 💪";
  };

  const handleShare = () => {
    if (!stats) return;
    
    const hintEmojis = ['📊', '🔤', '📝', '📖'];
    const hintsDisplay = hintEmojis.slice(0, stats.hintsUsed).join('');
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
        alert('Score copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Score copied to clipboard!');
    }
  };

  const renderWinModal = () => (
    <div className="modal-content win-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <h2 className="modal-title">🎉 Victory! 🎉</h2>
      <p className="modal-message">{getCongratsMessage(stats!.guesses)}</p>
      
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

      <div className="word-reveal">
        <strong>The word was:</strong> {stats!.word}
      </div>

      <div className="modal-actions">
        <button className="btn btn-share" onClick={handleShare}>
          Share Score 📤
        </button>
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again 🔄
        </button>
      </div>
    </div>
  );

  const renderLoseModal = () => (
    <div className="modal-content lose-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <h2 className="modal-title">Game Over</h2>
      <p className="modal-message">Don't worry, you'll get the next one! 💪</p>
      
      <div className="final-score lose">
        <div className="final-score-label">Final Score</div>
        <div className="final-score-value">{stats!.score}</div>
      </div>

      <div className="word-reveal">
        <strong>The word was:</strong> {stats!.word}
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
              <span className="hint-description">Number of letters, syllables & part of speech</span>
            </div>
            <div className="hint-step">
              <span className="hint-number">Hint 2:</span>
              <span className="hint-description">Synonyms</span>
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