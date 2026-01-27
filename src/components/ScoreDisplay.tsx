import '../css/ScoreDisplay.css';

interface ScoreDisplayProps {
  score: number;
}

function ScoreDisplay({ score }: ScoreDisplayProps) {
  const getScoreClass = () => {
    if (score >= 700) return 'score-high';
    if (score >= 400) return 'score-medium';
    if (score >= 200) return 'score-low';
    return 'score-critical';
  };

  return (
    <div className="score-display-container">
      <div className={`score-display ${getScoreClass()}`}>
        <span className="score-label">Score:</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-info">
        <span className="info-item">-100 per guess</span>
        <span className="info-separator">•</span>
        <span className="info-item">-100 per hint</span>
      </div>
    </div>
  );
}

export default ScoreDisplay;
