import GuessBar from "./GuessBar";
import Keyboard from "./Keyboard";
import Hints from "./Hints";
import HintButton from "./HintButton";
import ScoreDisplay from "./Scoredisplay";
import Modal from "./Modal";
import '../css/Game.css';
import { useEffect, useState } from "react";

const fakeData: WordData = {
  word: 'DISCIPLINE',
  numOfLetters: 10,
  numOfSyllables: 3, // from "dis*ci*pline" - count the asterisks
  definitions: {
    1: {
      partOfSpeech: ["noun"],
      synonym: ["control", "training", "order", "regulation", "self-control"],
      sentence: [
        "struggled to maintain ________ in the classroom",
        "The troops were praised for their dedication and ________.",
        "lacked the ________ to practice regularly"
      ],
      definition: "control gained by enforcing obedience or order"
    }
  }
};

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

// Scoring constants
const STARTING_SCORE = 1000;
const GUESS_PENALTY = 100;
const HINT_PENALTY = 100;
const MAX_HINTS = 6;

interface GameProps {
    showHelpModal?: boolean;
    onHelpModalClose?: () => void;
}

function Game({ showHelpModal, onHelpModalClose }: GameProps) {
    const [currentGuess, setCurrentGuess] = useState('');
    const [guesses, setGuesses] = useState<string[]>([]);
    const [wordData, setWordData] = useState<WordData>(fakeData);
    const [hints, setHints] = useState<Hint[]>([]);
    const [hintsUnlocked, setHintsUnlocked] = useState(0); // Track how many hints have been revealed
    const [score, setScore] = useState(STARTING_SCORE);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'win' | 'lose' | 'howToPlay' | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load words from file on component mount
    useEffect(() => {
        const loadWords = async () => {
            try {
                const response = await fetch('/uniqueWords.txt');
                const text = await response.text();
                const words = text.split('\n').map(w => w.trim()).filter(w => w.length > 0);
                setAvailableWords(words);
            } catch (error) {
                console.error('Error loading words:', error);
                setAvailableWords(['discipline', 'example', 'knowledge']);
            }
        };
        
        loadWords();
    }, []);

    // Get today's date as a string (YYYY-MM-DD)
    const getTodayString = () => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // "2025-01-27"
    };

    // Get word for today (deterministic - same for all users on same day)
    const getWordForToday = () => {
        if (availableWords.length === 0) return 'discipline';
        
        // Use today's date to calculate which word to use
        // This ensures all users get the same word on the same day
        const today = getTodayString();
        const startDate = new Date('2026-01-27'); // Your game's start date
        const currentDate = new Date(today);
        const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Pick word based on day number (cycles through all words)
        const wordIndex = daysSinceStart % availableWords.length;
        return availableWords[wordIndex];
    };

    // Call it when component mounts AND when words are loaded
    useEffect(() => {
        if (availableWords.length > 0) {
            fetchWordData();
        }
    }, [availableWords.length]); // Only fetch when words are loaded

    const fetchWordData = async () => {
        // Check if we already have today's word cached
        const cachedData = localStorage.getItem('dailyWordData');
        const today = getTodayString();
        
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.date === today) {
                // Still the same day, use cached data
                console.log('Using cached word for today');
                setWordData(parsed.wordData);
                setIsLoading(false);
                return;
            }
        }
        
        // New day or no cache - fetch new word
        setIsLoading(true);
        setError(null);
        
        const apiKey = import.meta.env.VITE_MERRIAM_WEBSTER_API_KEY;
        
        if (!apiKey) {
            console.error('API key not found!');
            setWordData(fakeData);
            setIsLoading(false);
            return;
        }
        
        try {
            const todaysWord = getWordForToday();
            const response = await fetch(
                `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${todaysWord}?key=${apiKey}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch word');
            }

            const data = await response.json();
            console.log('Merriam-Webster Response:', data);
            
            if (typeof data[0] === 'string') {
                throw new Error('Word not found, got suggestions instead');
            }
            
            const entry = data[0];
            
            // Extract syllables
            const syllables = entry.hwi?.hw?.split('*').length - 1 || 0;
            
            // Extract part of speech
            const partOfSpeech = entry.fl ? [entry.fl] : [];
            
            // Extract synonyms - check ALL entries, not just the first one
            const synonyms: string[] = [];
            data.forEach((entryItem: any) => {
                if (entryItem.syns && entryItem.syns.length > 0) {
                    entryItem.syns.forEach((synGroup: any) => {
                        if (synGroup.pt) {
                            synGroup.pt.forEach((item: any) => {
                                if (item[0] === 'text' && typeof item[1] === 'string') {
                                    const matches = item[1].match(/\{sc\}([^{]+)\{\/sc\}/g);
                                    if (matches) {
                                        matches.forEach((match: string) => {
                                            const word = match.replace(/\{sc\}|\{\/sc\}/g, '');
                                            if (word.toLowerCase() !== todaysWord.toLowerCase()) {
                                                synonyms.push(word);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
            
            // If no synonyms found, use stems as fallback (alternate word forms)
            let uniqueSynonyms = [...new Set(synonyms)].slice(0, 5);
            if (uniqueSynonyms.length === 0 && entry.meta?.stems) {
                uniqueSynonyms = entry.meta.stems
                    .filter((stem: string) => stem.toLowerCase() !== todaysWord.toLowerCase())
                    .slice(0, 5);
            }
            
            // Extract example sentences - from ALL definitions, not just the first
            const sentences: string[] = [];
            const wordStems = entry.meta?.stems || [todaysWord];

            // Check all entries in the API response (noun, verb, etc.)
            data.forEach((entryItem: any) => {
                if (entryItem.def) {
                    entryItem.def.forEach((defSection: any) => {
                        if (defSection.sseq) {
                            defSection.sseq.forEach((sense: any) => {
                                sense.forEach((item: any) => {
                                    if (item[1]?.dt) {
                                        item[1].dt.forEach((defItem: any) => {
                                            if (defItem[0] === 'vis' && defItem[1]) {
                                                defItem[1].forEach((example: any) => {
                                                    if (example.t) {
                                                        let cleanText = example.t
                                                            .replace(/\{wi\}/g, '')
                                                            .replace(/\{\/wi\}/g, '')
                                                            .replace(/\{it\}/g, '')
                                                            .replace(/\{\/it\}/g, '')
                                                            .replace(/\{bc\}/g, '')
                                                            .trim();
                                                        
                                                        wordStems.forEach((stem: string) => {
                                                            const regex = new RegExp(`\\b${stem}\\b`, 'gi');
                                                            cleanText = cleanText.replace(regex, '_______');
                                                        });
                                                        
                                                        if (cleanText.length > 10 && cleanText.includes('_______')) {
                                                            sentences.push(cleanText);
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
            
            // Extract definition - IMPROVED VERSION
            let definition = '';
            if (entry.shortdef && entry.shortdef[0]) {
                definition = entry.shortdef[0]
                    .replace(/\s*:\s*such as\s*$/i, '') // Remove trailing ": such as"
                    .replace(/\s*such as\s*$/i, '')      // Remove trailing "such as"
                    .trim();
            }
            
            // If definition is still poor quality or too short, try getting from full definition
            if (!definition || definition.length < 15) {
                if (entry.def && entry.def[0]?.sseq && entry.def[0].sseq[0]?.[0]?.[1]?.dt) {
                    const defText = entry.def[0].sseq[0][0][1].dt
                        .filter((item: any) => item[0] === 'text')
                        .map((item: any) => item[1])
                        .join(' ')
                        .replace(/\{bc\}/g, '')
                        .replace(/\{[^}]+\}/g, '')
                        .replace(/\s*:\s*such as\s*$/i, '')
                        .trim();
                    
                    if (defText.length > definition.length) {
                        definition = defText;
                    }
                }
            }
            
            const transformedData: WordData = {
                word: todaysWord.toUpperCase(),
                numOfLetters: todaysWord.length,
                numOfSyllables: syllables,
                definitions: {
                    1: {
                        partOfSpeech: partOfSpeech,
                        synonym: uniqueSynonyms,
                        sentence: sentences.slice(0, 3), // Take first 3 valid sentences
                        definition: definition
                    }
                }
            };
            
            console.log('Transformed Data:', transformedData);
            
            // Cache the word data with today's date
            localStorage.setItem('dailyWordData', JSON.stringify({
                date: today,
                wordData: transformedData
            }));
            
            setWordData(transformedData);
            
        } catch (error) {
            console.error('Error fetching word:', error);
            setError('Failed to load word. Using fallback.');
            setWordData(fakeData);
        } finally {
            setIsLoading(false);
        }
    };

    // Call when words are loaded
    useEffect(() => {
        if (availableWords.length > 0) {
            fetchWordData();
        }
    }, [availableWords]);

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
                setHints([wordData.numOfLetters])
                break;
            case 2:
                setHints(prev => [...prev, wordData.numOfSyllables])
                break;
            case 3:
                setHints(prev => [...prev, wordData.definitions[1].partOfSpeech])
                break;
            case 4:
                setHints(prev => [...prev, wordData.definitions[1].synonym])
                break;
            case 5:
                setHints(prev => [...prev, wordData.definitions[1].sentence])
                break;
            case 6:
                setHints(prev => [...prev, wordData.definitions[1].definition])
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
        fetchWordData();
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

    if (isLoading) {
        return (
            <div className="game-container">
                <div className="loading-spinner">Loading new word...</div>
            </div>
        );
    }

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


// This is the old working synonym code

 // Extract synonyms - check ALL entries, not just the first one
// const synonymSet = new Set<string>();

// data.forEach((entry: any) => {
//     if (!entry.syns) return;

//     entry.syns.forEach((group: any) => {
//         group.pt.forEach((part: any) => {
//             if (part[0] === "text") {
//                 const text = part[1];

//                 // Extract words inside {sc} ... {/sc}
//                 const matches = [...text.matchAll(/\{sc\}([^{}]+)\{\/sc\}/g)];

//                 matches.forEach(match => {
//                     const synonym = match[1].toLowerCase();

//                     // Ignore the word being defined
//                     if (synonym !== todaysWord.toLowerCase()) {
//                         synonymSet.add(synonym);
//                     }
//                 });
//             }
//         });
//     });
// });

// // Final list: unique + max 5
// const uniqueSynonyms = Array.from(synonymSet).slice(0, 5);