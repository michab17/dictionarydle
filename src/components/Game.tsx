import GuessBar from "./GuessBar";
import Keyboard from "./Keyboard";
import Hints from "./Hints";
import { useEffect, useState } from "react";

interface Definition {
  partOfSpeech: string[];
  synonym: string[];
  antonym: string[];
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
                    antonym: ["idk", "idk", "idk"],
                    sentence: ["in what __________ is his doctorate?", "What __________ are they studying in?", "That is a lucrative __________"],
                    definition: "a branch of knowledge",
                },
            2:
                {
                    partOfSpeech: ["noun"],
                    synonym: ["correct"],
                    antonym: ["idk"],
                    sentence: ["They need some __________", "They lacked the __________ to study regularly", "The troops were praised for their dedication and __________"],
                    definition: "punish in order to gain control or enforce obedience",
                }
        }
    }

// Data:
// 0. Nothing
// 1. Number of Letters & number of syllables & part or parts of speech
// 2. Synonym & Antonym
// 3. Usage in a sentance
// 4. Definition

function Game() {
    const [currentGuess, setCurrentGuess] = useState('');
    const [guesses, setGuesses] = useState<string[]>([]);
    const [wordData, setWordData] = useState(fakeData);
    const [hints, setHints] = useState<Hint[]>([]);

    const handleKeyPress = (key: string) => {
        // Update currentGuess state here
        if (key === 'ENTER') {
            // Submit the guess
            setGuesses([...guesses, currentGuess]);

            if (currentGuess === wordData.word) {
                console.log("YOU WIN!!!!!!!!!!!!")
            } else {
                const nextGuessCount = guesses.length + 1;
                handleDisplayHint(wordData, nextGuessCount);
                console.log("Hints: " + hints.toString())
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

    const handleDisplayHint = (wordData: WordData, numOfguesses: Number) => {
        switch (numOfguesses) {
            case 1:
                setHints([wordData.numOfLetters, wordData.numOfSyllables, wordData.definitions[1].partOfSpeech])
                break;
            case 2:
                setHints(prev => [
                    ...prev,
                    wordData.definitions[1].synonym,
                    wordData.definitions[1].antonym])
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
    }, [currentGuess, guesses]); // Re-run when these change

  return (
    <>
        <GuessBar guesses={guesses} currentGuess={currentGuess} />
        <Keyboard onKeyPress={handleKeyPress} />
        <Hints hints={hints} />
    </>
  );

}

export default Game;