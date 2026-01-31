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
    
    // Validate that we have all required data
    if (partsOfSpeech.size === 0) {
        throw new Error('No parts of speech found');
    }
    
    if (allExamples.length === 0) {
        throw new Error('No example sentences found');
    }
    
    if (allDefinitions.length === 0) {
        throw new Error('No definitions found');
    }
    
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

// Get word with retry logic - tries subsequent words if one fails
async function getValidWord(availableWords, startIndex) {
    const maxRetries = 50; // Try up to 50 words before giving up
    
    for (let i = 0; i < maxRetries; i++) {
        const wordIndex = (startIndex + i) % availableWords.length;
        const word = availableWords[wordIndex];
        
        console.log(`📖 Trying word: ${word}`);
        
        try {
            const wordData = await fetchWordData(word);
            console.log(`✅ Found valid word: ${word}`);
            return wordData;
        } catch (error) {
            console.warn(`⚠️  Word "${word}" failed: ${error.message}`);
            // Continue to next word
        }
    }
    
    throw new Error(`Failed to find a valid word after ${maxRetries} attempts`);
}

// Main function
async function main() {
    try {
        console.log('🎯 Generating daily word...');
        
        // Load words and get today's starting index
        const availableWords = await loadWords();
        const today = getTodayString();
        const startDate = new Date('2026-01-27');
        const currentDate = new Date(today);
        const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const startIndex = daysSinceStart % availableWords.length;
        
        console.log(`📆 Days since start: ${daysSinceStart}`);
        console.log(`🎲 Starting at index: ${startIndex}`);
        
        // Try to get a valid word, starting from today's index
        const wordData = await getValidWord(availableWords, startIndex);
        
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
        console.log(`📝 Word: ${wordData.word}`);
        
    } catch (error) {
        console.error('❌ Error generating daily word:', error);
        process.exit(1);
    }
}

main();