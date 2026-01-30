import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your API key - we'll use environment variable
const API_KEY = process.env.VITE_MERRIAM_WEBSTER_API_KEY;

// Load available words
async function loadWords() {
    const wordsPath = path.join(__dirname, '../public/uniqueWords.txt');
    const text = await fs.readFile(wordsPath, 'utf-8');
    return text.split('\n').map(w => w.trim()).filter(w => w.length > 0);
}

// Get today's date string
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

// Fetch word data from API
async function fetchWordData(word) {
    const response = await fetch(
        `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${API_KEY}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch word');
    }

    const data = await response.json();
    
    if (typeof data[0] === 'string') {
        throw new Error('Word not found, got suggestions instead');
    }
    
    const entry = data[0];
    
    // Extract syllables
    const syllables = entry.hwi?.hw?.split('*').length - 1 || 1;
    
    // Extract part of speech
    const partOfSpeech = entry.fl ? [entry.fl] : [];
    
    // Extract example sentences
    const sentences = [];
    const wordStems = entry.meta?.stems || [word];

    data.forEach((entryItem) => {
        if (entryItem.def) {
            entryItem.def.forEach((defSection) => {
                if (defSection.sseq) {
                    defSection.sseq.forEach((sense) => {
                        sense.forEach((item) => {
                            if (item[1]?.dt) {
                                item[1].dt.forEach((defItem) => {
                                    if (defItem[0] === 'vis' && defItem[1]) {
                                        defItem[1].forEach((example) => {
                                            if (example.t) {
                                                let cleanText = example.t
                                                    .replace(/\{wi\}/g, '')
                                                    .replace(/\{\/wi\}/g, '')
                                                    .replace(/\{it\}/g, '')
                                                    .replace(/\{\/it\}/g, '')
                                                    .replace(/\{bc\}/g, '')
                                                    .trim();
                                                
                                                wordStems.forEach((stem) => {
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
    
    // Extract definition
    let definition = '';
    if (entry.shortdef && entry.shortdef[0]) {
        definition = entry.shortdef[0]
            .replace(/\s*:\s*such as\s*$/i, '')
            .replace(/\s*such as\s*$/i, '')
            .trim();
    }
    
    if (!definition || definition.length < 15) {
        if (entry.def && entry.def[0]?.sseq && entry.def[0].sseq[0]?.[0]?.[1]?.dt) {
            const defText = entry.def[0].sseq[0][0][1].dt
                .filter((item) => item[0] === 'text')
                .map((item) => item[1])
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
    
    return {
        word: word.toUpperCase(),
        numOfLetters: word.length,
        numOfSyllables: syllables,
        definitions: {
            1: {
                partOfSpeech: partOfSpeech,
                sentence: sentences.slice(0, 3),
                definition: definition
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