type Hint =
  | number
  | string
  | string[];

interface HintsProps {
  hints: Hint[];
}

function Hints({ hints }: HintsProps) {
  const hintLabels = [
    "Number of letters",
    "Number of syllables", 
    "Parts of speech",
    "Synonyms",
    "Antonyms",
    "Word used in a sentence",
    "Definition"
  ];

  const formatHints = (hints: any[]) => {
    return hints.map((hint, index) => {
      // Check if hint is an array (like synonyms, antonyms, sentences)
      if (Array.isArray(hint)) {
        return (
          <div key={index} className="hint-item">
            <strong>{hintLabels[index]}:</strong> {hint.join(', ')}
          </div>
        );
      }
      // Otherwise it's a string or number
      return (
        <div key={index} className="hint-item">
          <strong>{hintLabels[index]}:</strong> {hint}
        </div>
      );
    });
  };

  return (
    <div className="hints-container">
      {hints.length > 0 ? (
        formatHints(hints)
      ) : (
        <p>No hints yet. Start guessing!</p>
      )}
    </div>
  );
}

export default Hints;