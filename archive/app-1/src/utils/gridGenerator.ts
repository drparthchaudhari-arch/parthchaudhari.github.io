import { getRandomWords, getTheme } from '@/data/wordLists';

export interface GeneratedLevel {
  id: number;
  theme: string;
  words: string[];
  grid: string[];
  difficulty: number;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface Position {
  row: number;
  col: number;
}

// Get word count based on difficulty
const getWordCount = (difficulty: number): number => {
  // Level 1: 3 words, increases up to 8 words at high levels
  return Math.min(3 + Math.floor(difficulty / 3), 8);
};

// Get grid size based on difficulty
const getGridSize = (difficulty: number): { rows: number; cols: number } => {
  if (difficulty <= 5) return { rows: 6, cols: 8 };
  if (difficulty <= 15) return { rows: 7, cols: 9 };
  if (difficulty <= 30) return { rows: 8, cols: 10 };
  return { rows: 8, cols: 12 };
};

// Check if position is valid
const isValidPosition = (row: number, col: number, rows: number, cols: number): boolean => {
  return row >= 0 && row < rows && col >= 0 && col < cols;
};

// Get all possible directions (8 directions)
const DIRECTIONS: Position[] = [
  { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
  { row: 0, col: -1 },                      { row: 0, col: 1 },
  { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 }
];

// Try to place a word on the grid
const placeWord = (
  grid: string[][],
  word: string,
  rows: number,
  cols: number,
  occupied: Set<string>
): boolean => {
  const positions: Position[] = [];
  
  // Try random starting positions
  const startPositions: Position[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      startPositions.push({ row: r, col: c });
    }
  }
  
  // Shuffle start positions
  for (let i = startPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [startPositions[i], startPositions[j]] = [startPositions[j], startPositions[i]];
  }
  
  for (const start of startPositions) {
    // Try each direction
    const shuffledDirections = [...DIRECTIONS].sort(() => Math.random() - 0.5);
    
    for (const dir of shuffledDirections) {
      positions.length = 0;
      let valid = true;
      
      for (let i = 0; i < word.length; i++) {
        const row = start.row + dir.row * i;
        const col = start.col + dir.col * i;
        const key = `${row},${col}`;
        
        if (!isValidPosition(row, col, rows, cols) || occupied.has(key)) {
          valid = false;
          break;
        }
        
        // Check if cell has conflicting letter
        if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
          valid = false;
          break;
        }
        
        positions.push({ row, col });
      }
      
      if (valid && positions.length === word.length) {
        // Place the word
        for (let i = 0; i < word.length; i++) {
          const { row, col } = positions[i];
          grid[row][col] = word[i];
          occupied.add(`${row},${col}`);
        }
        return true;
      }
    }
  }
  
  return false;
};

// Generate a level
export const generateLevel = (levelId: number): GeneratedLevel => {
  const difficulty = levelId;
  const { rows, cols } = getGridSize(difficulty);
  const wordCount = getWordCount(difficulty);
  
  // Get words for this level
  const targetWords = getRandomWords(wordCount, difficulty);
  
  // Sort words by length (longest first for better placement)
  const sortedWords = [...targetWords].sort((a, b) => b.length - a.length);
  
  // Initialize empty grid
  const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
  const occupied = new Set<string>();
  const placedWords: string[] = [];
  
  // Try to place each word
  for (const word of sortedWords) {
    if (placeWord(grid, word, rows, cols, occupied)) {
      placedWords.push(word);
    }
  }
  
  // Fill empty cells with random letters
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    }
  }
  
  // Flatten grid to array
  const flatGrid: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      flatGrid.push(grid[r][c]);
    }
  }
  
  return {
    id: levelId,
    theme: getTheme(difficulty),
    words: placedWords,
    grid: flatGrid,
    difficulty
  };
};

// Generate multiple levels
export const generateLevels = (count: number): GeneratedLevel[] => {
  const levels: GeneratedLevel[] = [];
  for (let i = 1; i <= count; i++) {
    levels.push(generateLevel(i));
  }
  return levels;
};

// Get hint for a word (reveal first letter position)
export const getHint = (
  grid: string[],
  words: string[],
  foundWords: string[],
  rows: number,
  cols: number
): { word: string; positions: { row: number; col: number }[] } | null => {
  // Find an unfound word
  const unfoundWords = words.filter(w => !foundWords.includes(w));
  if (unfoundWords.length === 0) return null;
  
  // Pick a random unfound word
  const targetWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
  
  // Search for the word in the grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r * cols + c] === targetWord[0]) {
        // Try all directions
        for (const dir of DIRECTIONS) {
          const positions: { row: number; col: number }[] = [];
          let matched = true;
          
          for (let i = 0; i < targetWord.length; i++) {
            const nr = r + dir.row * i;
            const nc = c + dir.col * i;
            
            if (!isValidPosition(nr, nc, rows, cols) || 
                grid[nr * cols + nc] !== targetWord[i]) {
              matched = false;
              break;
            }
            positions.push({ row: nr, col: nc });
          }
          
          if (matched) {
            return { word: targetWord, positions };
          }
        }
      }
    }
  }
  
  return null;
};
