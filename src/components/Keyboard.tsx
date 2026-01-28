import '../css/Keyboard.css';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
}

function Keyboard({ onKeyPress }: KeyboardProps) {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'DELETE'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER']
  ];
  
  return (
    <div className="keyboard">
      {rows.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map(key => (
            <button 
              type="button"
              key={key}
              onClick={() => onKeyPress(key)}
              className={key === 'ENTER' || key === 'DELETE' ? 'special-key' : ''}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Keyboard;