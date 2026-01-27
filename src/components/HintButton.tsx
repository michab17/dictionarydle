import '../css/HintButton.css';

interface HintButtonProps {
  onRequestHint: () => void;
  hintsUnlocked: number;
  maxHints: number;
  disabled: boolean;
}

function HintButton({ onRequestHint, hintsUnlocked, maxHints, disabled}: HintButtonProps) {
  const getButtonText = () => {
    if (hintsUnlocked >= maxHints) {
      return 'All Hints Used';
    }
    return `Get Hint (${hintsUnlocked}/${maxHints}) - 100 pts`;
  };

  const getButtonClass = () => {
    let classes = 'hint-button';
    if (disabled) classes += ' disabled';
    if (hintsUnlocked >= maxHints) classes += ' all-used';
    return classes;
  };

  return (
    <div className="hint-button-container">
      <button 
        className={getButtonClass()}
        onClick={onRequestHint}
        disabled={disabled}
      >
        <span className="hint-icon">💡</span>
        {getButtonText()}
      </button>
      {hintsUnlocked < maxHints && (
        <p className="hint-info">
          Click to reveal the next hint
        </p>
      )}
    </div>
  );
}

export default HintButton;
