interface GuessBarProps {
  guesses: string[];
  currentGuess: string;
}

function GuessBar({ guesses, currentGuess }: GuessBarProps) {
  return (
    <div className="guess-bar">
      <div className="current-guess-display">
        {currentGuess || "Start typing..."}
      </div>
      
      <div className="previous-guesses">
        {guesses.map((guess, index) => (
          <div key={index} className="guess">
            {guess}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuessBar;