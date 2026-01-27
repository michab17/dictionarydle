import GuessBar from "./GuessBar";
import Keyboard from "./Keyboard";
import Hints from "./Hints";
import HintButton from "./HintButton";
import ScoreDisplay from "./Scoredisplay";
import Modal from "./Modal";
import '../css/Game.css';
import { useEffect, useState } from "react";

interface Definition {
  partOfSpeech: string[];
  synonym: string[];
  sentence: string[];
  definition: string;
}

interface WordData {
  word: string;
  numOfLetters: number;
  numOfSyllables: number;
  definitions: {
    [key: number]: Definition;
  };
}

type Hint =
  | number
  | string
  | string[];

let fakeData = {
        word: 'DISCIPLINE',
        numOfLetters: 10,
        numOfSyllables: 3,
        definitions: {
            1:
                {
                    partOfSpeech: ["noun", "verb"],
                    synonym: ["bailiwick", "field", "field of study"],
                    sentence: ["in what __________ is his doctorate?", "What __________ are they studying in?", "That is a lucrative __________"],
                    definition: "a branch of knowledge",
                },
            2:
                {
                    partOfSpeech: ["noun"],
                    synonym: ["correct"],
                    sentence: ["They need some __________", "They lacked the __________ to study regularly", "The troops were praised for their dedication and __________"],
                    definition: "punish in order to gain control or enforce obedience",
                }
        }
    }

// Scoring constants
const STARTING_SCORE = 1000;
const GUESS_PENALTY = 100;
const HINT_PENALTY = 100;
const MAX_HINTS = 4;

interface GameProps {
    showHelpModal?: boolean;
    onHelpModalClose?: () => void;
}

function Game({ showHelpModal, onHelpModalClose }: GameProps) {
    const [currentGuess, setCurrentGuess] = useState('');
    const [guesses, setGuesses] = useState<string[]>([]);
    const [wordData, setWordData] = useState(fakeData);
    const [hints, setHints] = useState<Hint[]>([]);
    const [hintsUnlocked, setHintsUnlocked] = useState(0); // Track how many hints have been revealed
    const [score, setScore] = useState(STARTING_SCORE);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'win' | 'lose' | 'howToPlay' | null>(null);
    const [gameOver, setGameOver] = useState(false);

    // Check if first time user and show how-to-play modal
    useEffect(() => {
        const hasPlayedBefore = localStorage.getItem('hasPlayedDictionarydle');
        if (!hasPlayedBefore) {
            setModalOpen(true);
            setModalType('howToPlay');
            localStorage.setItem('hasPlayedDictionarydle', 'true');
        }
    }, []);

    // Handle external help modal trigger from Header
    useEffect(() => {
        if (showHelpModal) {
            setModalOpen(true);
            setModalType('howToPlay');
        }
    }, [showHelpModal]);

    const handleKeyPress = (key: string) => {
        // Don't allow input if game is over
        if (gameOver) return;

        // Update currentGuess state here
        if (key === 'ENTER') {
            // Don't submit empty guesses
            if (currentGuess.length === 0) return;

            // Check if correct first (before deducting points)
            if (currentGuess === wordData.word) {
                // WIN! Don't deduct points for correct guess
                const newGuesses = [...guesses, currentGuess];
                setGuesses(newGuesses);
                setGameOver(true);
                setModalOpen(true);
                setModalType('win');
                setCurrentGuess('');
                return;
            }

            // Wrong guess - submit and deduct points
            const newGuesses = [...guesses, currentGuess];
            setGuesses(newGuesses);

            // Deduct points for the guess
            const newScore = score - GUESS_PENALTY;
            setScore(newScore);

            if (newScore <= 0) {
                // LOSE - ran out of points
                setScore(0);
                setGameOver(true);
                setModalOpen(true);
                setModalType('lose');
            }

            setCurrentGuess(''); // Clear for next guess
        } else if (key === 'DELETE') {
            // Remove last letter
            setCurrentGuess(currentGuess.slice(0, -1));
        } else {
            // Add letter
            setCurrentGuess(currentGuess + key);
        }
    };

    const handleRequestHint = () => {
        // Don't allow if game is over or all hints used
        if (gameOver || hintsUnlocked >= MAX_HINTS) return;

        // Check if player has enough points
        if (score < HINT_PENALTY) {
            // Not enough points for a hint - game over
            setScore(0);
            setGameOver(true);
            setModalOpen(true);
            setModalType('lose');
            return;
        }

        // Deduct points for the hint
        setScore(score - HINT_PENALTY);

        // Unlock the next hint
        const nextHintIndex = hintsUnlocked + 1;
        setHintsUnlocked(nextHintIndex);
        displayHint(wordData, nextHintIndex);
    };

    const displayHint = (wordData: WordData, hintNumber: number) => {
        switch (hintNumber) {
            case 1:
                setHints([wordData.numOfLetters, wordData.numOfSyllables, wordData.definitions[1].partOfSpeech])
                break;
            case 2:
                setHints(prev => [
                    ...prev,
                    wordData.definitions[1].synonym])
                break;
            case 3:
                setHints(prev => [
                    ...prev, wordData.definitions[1].sentence])
                break;
            case 4:
                setHints(prev => [
                    ...prev, wordData.definitions[1].definition])
                break;
        }
    };

    const handlePlayAgain = () => {
        // Reset game state
        setCurrentGuess('');
        setGuesses([]);
        setHints([]);
        setHintsUnlocked(0);
        setScore(STARTING_SCORE);
        setGameOver(false);
        setModalOpen(false);
        setModalType(null);
        // TODO: Fetch new word data here
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setModalType(null);
        // If closing help modal triggered from Header, notify parent
        if (modalType === 'howToPlay' && onHelpModalClose) {
            onHelpModalClose();
        }
    };

    // Listen for physical keyboard input
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toUpperCase();
            
            if (key === 'ENTER') {
                handleKeyPress('ENTER');
            } else if (key === 'BACKSPACE') {
                handleKeyPress('DELETE');
            } else if (/^[A-Z]$/.test(key)) {
                // Only allow single letters A-Z
                handleKeyPress(key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup: remove listener when component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentGuess, guesses, gameOver, score]); // Re-run when these change

  return (
    <div className="game-container">
        <ScoreDisplay score={score} />
        <GuessBar guesses={guesses} currentGuess={currentGuess} />
        <Keyboard onKeyPress={handleKeyPress} />
        <HintButton 
            onRequestHint={handleRequestHint}
            hintsUnlocked={hintsUnlocked}
            maxHints={MAX_HINTS}
            disabled={gameOver || hintsUnlocked >= MAX_HINTS || score <= HINT_PENALTY}
        />
        <Hints hints={hints} />
        <Modal 
            isOpen={modalOpen}
            type={modalType}
            stats={{
                guesses: guesses.length,
                word: wordData.word,
                hintsUsed: hintsUnlocked,
                score: score
            }}
            onPlayAgain={handlePlayAgain}
            onClose={handleCloseModal}
        />
    </div>
  );

}

export default Game;