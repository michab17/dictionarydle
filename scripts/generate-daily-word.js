import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load available words
async function loadWords() {
    const wordsPath = path.join(__dirname, '../public/uniqueWords.txt');
    const text = await fs.readFile(wordsPath, 'utf-8');
    return text.split('\n').map(w => w.trim()).filter(w => w.length > 0);
}

// Get today's date string in Mountain Time
function getTodayString() {
    const today = new Date();
    // Convert to Mountain Time (America/Denver)
    const mountainTime = new Date(today.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    const year = mountainTime.getFullYear();
    const month = String(mountainTime.getMonth() + 1).padStart(2, '0');
    const day = String(mountainTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get word for today (same logic as your frontend)
function getWordForToday(availableWords) {
    const today = getTodayString();
    const startDate = new Date('2026-01-27');
    const currentDate = new Date(today);
    const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const wordIndex = daysSinceStart % availableWords.length;
    return availableWords[wordIndex];
}

// Fetch word data from Free Dictionary API
async function fetchWordData(word) {
    const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch word');
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
        throw new Error('Word not found');
    }
    
    const entry = data[0];
    
    // Collect all parts of speech, definitions, and examples
    const allDefinitions = [];
    const allExamples = [];
    const partsOfSpeech = new Set();
    
    entry.meanings.forEach(meaning => {
        partsOfSpeech.add(meaning.partOfSpeech);
        
        meaning.definitions.forEach(def => {
            // Add definition
            if (def.definition && def.definition.length >= 15) {
                allDefinitions.push(def.definition);
            }
            
            // Add example if it exists
            if (def.example) {
                // Replace the word with blanks
                let example = def.example;
                const wordVariations = [
                    word,
                    word.toLowerCase(),
                    word.toUpperCase(),
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ];
                
                wordVariations.forEach(variation => {
                    const regex = new RegExp(`\\b${variation}\\b`, 'g');
                    example = example.replace(regex, '_______');
                });
                
                if (example.includes('_______')) {
                    allExamples.push(example);
                }
            }
        });
    });
    
    return {
        word: word.toUpperCase(),
        numOfLetters: word.length,
        definitions: {
            1: {
                partOfSpeech: Array.from(partsOfSpeech).slice(0, 3),
                sentence: allExamples.slice(0, 3),
                definition: allDefinitions.slice(0, 3)
            }
        }
    };
}

// Main function
async function main() {
    try {
        console.log('🎯 Generating daily word...');
        
        // Load words and get today's word
        const availableWords = await loadWords();
        const todaysWord = getWordForToday(availableWords);
        
        console.log(`📖 Today's word: ${todaysWord}`);
        
        // Fetch word data from API
        const wordData = await fetchWordData(todaysWord);
        
        // Create the output object
        const output = {
            date: getTodayString(),
            wordData: wordData
        };
        
        // Write to public directory
        const outputPath = path.join(__dirname, '../public/daily-word.json');
        await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
        
        console.log('✅ Successfully generated daily-word.json');
        console.log(`📅 Date: ${output.date}`);
        
    } catch (error) {
        console.error('❌ Error generating daily word:', error);
        process.exit(1);
    }
}

main();