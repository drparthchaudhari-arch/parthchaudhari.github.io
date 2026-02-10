import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { Cell, Position } from '@/types/game';
import { generateLevel, getHint } from '@/utils/gridGenerator';
import { RotateCcw, Trophy, ChevronRight, Lightbulb, Eye, EyeOff, Menu, Sparkles, Star, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(() => generateLevel(1));
  const [cells, setCells] = useState<Cell[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundWordPositions, setFoundWordPositions] = useState<Map<string, Position[]>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [wordColors, setWordColors] = useState<Record<string, string>>({});
  const [showWordList, setShowWordList] = useState(true);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintPositions, setHintPositions] = useState<Position[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const { rows, cols } = currentLevel.difficulty <= 5 
    ? { rows: 6, cols: 8 }
    : currentLevel.difficulty <= 15
    ? { rows: 7, cols: 9 }
    : currentLevel.difficulty <= 30
    ? { rows: 8, cols: 10 }
    : { rows: 8, cols: 12 };

  const colors = [
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-cyan-400 to-cyan-600',
    'from-sky-400 to-sky-600',
    'from-blue-400 to-blue-600',
    'from-indigo-400 to-indigo-600',
    'from-violet-400 to-violet-600',
    'from-purple-400 to-purple-600',
    'from-fuchsia-400 to-fuchsia-600',
    'from-pink-400 to-pink-600',
    'from-rose-400 to-rose-600',
    'from-orange-400 to-orange-600',
    'from-amber-400 to-amber-600',
    'from-yellow-400 to-yellow-600',
    'from-lime-400 to-lime-600',
    'from-green-400 to-green-600',
  ];

  // Initialize cells from current level
  useEffect(() => {
    const initialCells: Cell[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        initialCells.push({
          letter: currentLevel.grid[index] || 'A',
          row,
          col,
          isSelected: false,
          isFound: false,
        });
      }
    }
    setCells(initialCells);
    setFoundWords([]);
    setFoundWordPositions(new Map());
    setSelectedPositions([]);
    setCurrentWord('');
    setShowLevelComplete(false);
    setShowHint(false);
    setHintPositions([]);
  }, [currentLevel, rows, cols]);

  // Assign colors to words when level changes
  useEffect(() => {
    const newWordColors: Record<string, string> = {};
    currentLevel.words.forEach((word, index) => {
      newWordColors[word] = colors[index % colors.length];
    });
    setWordColors(newWordColors);
  }, [currentLevel]);

  const getCellIndex = (row: number, col: number) => row * cols + col;

  const getCellFromEvent = (e: React.MouseEvent | React.TouchEvent): Position | null => {
    if (!gridRef.current) return null;
    
    const rect = gridRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as React.MouseEvent).clientY;
    
    if (clientX === undefined || clientY === undefined) return null;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col };
    }
    return null;
  };

  const isAdjacent = (pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCellFromEvent(e);
    if (pos) {
      setIsDragging(true);
      setSelectedPositions([pos]);
      setShowHint(false);
      updateSelection([pos]);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    
    const pos = getCellFromEvent(e);
    if (!pos) return;

    const lastPos = selectedPositions[selectedPositions.length - 1];
    
    // Check if going back to previous cell
    if (selectedPositions.length > 1) {
      const secondLastPos = selectedPositions[selectedPositions.length - 2];
      if (pos.row === secondLastPos.row && pos.col === secondLastPos.col) {
        const newPositions = selectedPositions.slice(0, -1);
        setSelectedPositions(newPositions);
        updateSelection(newPositions);
        return;
      }
    }

    // Check if position is already in selection
    const alreadySelected = selectedPositions.some(
      p => p.row === pos.row && p.col === pos.col
    );
    if (alreadySelected) return;

    // Check if adjacent to last position
    if (isAdjacent(lastPos, pos)) {
      const newPositions = [...selectedPositions, pos];
      setSelectedPositions(newPositions);
      updateSelection(newPositions);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Check if current word is valid
    if (currentWord.length >= 3) {
      const upperWord = currentWord.toUpperCase();
      if (currentLevel.words.includes(upperWord) && !foundWords.includes(upperWord)) {
        // Word found!
        const newFoundWords = [...foundWords, upperWord];
        setFoundWords(newFoundWords);
        
        // Store positions for this word
        const newFoundWordPositions = new Map(foundWordPositions);
        newFoundWordPositions.set(upperWord, [...selectedPositions]);
        setFoundWordPositions(newFoundWordPositions);
        
        // Update score
        const wordScore = upperWord.length * 10 * (1 + streak * 0.1);
        setTotalScore(prev => prev + Math.floor(wordScore));
        setStreak(prev => prev + 1);
        
        // Mark cells as found
        setCells(prev => {
          const newCells = [...prev];
          selectedPositions.forEach(pos => {
            const index = getCellIndex(pos.row, pos.col);
            newCells[index] = { ...newCells[index], isFound: true };
          });
          return newCells;
        });

        // Check if level complete
        if (newFoundWords.length === currentLevel.words.length) {
          setTimeout(() => {
            setShowLevelComplete(true);
            confetti({
              particleCount: 200,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
            });
          }, 300);
        }
      } else {
        setStreak(0);
      }
    }

    // Clear selection
    setSelectedPositions([]);
    updateSelection([]);
  };

  const updateSelection = (positions: Position[]) => {
    setCells(prev => {
      const newCells = prev.map(cell => ({ ...cell, isSelected: false }));
      positions.forEach(pos => {
        const index = getCellIndex(pos.row, pos.col);
        if (!newCells[index].isFound) {
          newCells[index] = { ...newCells[index], isSelected: true };
        }
      });
      return newCells;
    });

    // Build current word
    const word = positions.map(pos => {
      const index = getCellIndex(pos.row, pos.col);
      return cells[index]?.letter || '';
    }).join('');
    setCurrentWord(word);
  };

  const handleNextLevel = () => {
    const nextLevelId = currentLevelId + 1;
    setCurrentLevelId(nextLevelId);
    setCurrentLevel(generateLevel(nextLevelId));
    setHintsUsed(0);
    setStreak(0);
  };

  const handleReset = () => {
    setCells(prev => prev.map(cell => ({ 
      ...cell, 
      isSelected: false, 
      isFound: false 
    })));
    setFoundWords([]);
    setFoundWordPositions(new Map());
    setSelectedPositions([]);
    setCurrentWord('');
    setShowLevelComplete(false);
    setShowHint(false);
    setHintPositions([]);
    setStreak(0);
  };

  const handleUseHint = () => {
    if (showHint) {
      setShowHint(false);
      setHintPositions([]);
      return;
    }
    
    const hint = getHint(currentLevel.grid, currentLevel.words, foundWords, rows, cols);
    if (hint) {
      setHintPositions(hint.positions.slice(0, 2)); // Show first 2 letters
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
      setTotalScore(prev => Math.max(0, prev - 50)); // Penalty for using hint
    }
  };

  const getCellStyle = (cell: Cell): string => {
    // Check if this cell is part of a hint
    const isHint = showHint && hintPositions.some(p => p.row === cell.row && p.col === cell.col);
    
    if (cell.isFound) {
      // Find which word this cell belongs to
      for (const [word, positions] of foundWordPositions) {
        if (positions.some(p => p.row === cell.row && p.col === cell.col)) {
          return `bg-gradient-to-br ${wordColors[word]} text-white shadow-lg scale-105`;
        }
      }
      return 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg';
    }
    if (cell.isSelected) return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg scale-110';
    if (isHint) return 'bg-gradient-to-br from-yellow-300 to-amber-400 text-amber-900 shadow-lg animate-pulse';
    return 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md';
  };

  const progress = (foundWords.length / currentLevel.words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMenu(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                WordVet
              </h1>
              <p className="text-xs text-white/70">Level {currentLevelId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-white">{totalScore.toLocaleString()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 mt-4">
        <div className="flex items-center justify-between text-white/80 text-sm mb-1">
          <span>Progress</span>
          <span>{foundWords.length}/{currentLevel.words.length} words</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-4 pb-40 overflow-y-auto">
        {/* Theme Display */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mb-4"
        >
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 rounded-2xl p-4 text-white shadow-xl">
            <p className="text-xs uppercase tracking-wider opacity-90 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Theme
            </p>
            <h2 className="text-2xl font-bold">{currentLevel.theme}</h2>
          </div>
        </motion.div>

        {/* Current Word Display */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg mb-4"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20 min-h-[70px] flex items-center justify-center">
            <p className={`text-2xl font-bold tracking-widest uppercase ${
              currentWord.length >= 3 && currentLevel.words.includes(currentWord.toUpperCase()) && !foundWords.includes(currentWord.toUpperCase())
                ? 'text-emerald-400'
                : 'text-white'
            }`}>
              {currentWord || <span className="text-white/40">Drag to spell a word...</span>}
            </p>
          </div>
        </motion.div>

        {/* Game Grid */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <div 
            ref={gridRef}
            className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-3 select-none touch-none border border-white/20"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            <div 
              className="grid gap-1.5"
              style={{ 
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
              }}
            >
              {cells.map((cell, index) => (
                <motion.div
                  key={index}
                  layout
                  className={`
                    relative flex items-center justify-center rounded-xl font-bold text-lg
                    transition-all duration-200 cursor-pointer aspect-square
                    ${getCellStyle(cell)}
                  `}
                  whileHover={{ scale: cell.isFound ? 1.05 : 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cell.letter}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Word List Toggle */}
        <div className="w-full max-w-lg mt-6">
          <button
            onClick={() => setShowWordList(!showWordList)}
            className="w-full flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-xl p-3 text-white border border-white/20 hover:bg-white/20 transition-colors"
          >
            <span className="font-semibold flex items-center gap-2">
              Words to Find 
              <span className="text-sm text-white/70">({foundWords.length}/{currentLevel.words.length})</span>
            </span>
            {showWordList ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          
          <AnimatePresence>
            {showWordList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentLevel.words.map((word) => {
                    const isFound = foundWords.includes(word);
                    return (
                      <motion.div
                        key={word}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`
                          px-4 py-2 rounded-xl font-medium transition-all duration-300
                          ${isFound 
                            ? `bg-gradient-to-r ${wordColors[word]} text-white shadow-lg` 
                            : 'bg-white/10 text-white/60 backdrop-blur-sm'
                          }
                        `}
                      >
                        {isFound ? word : '•'.repeat(word.length)}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Controls */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUseHint}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-xl transition-all
              ${showHint 
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' 
                : 'bg-white/20 backdrop-blur-lg text-white hover:bg-white/30 border border-white/30'
              }
            `}
          >
            <Lightbulb className="w-5 h-5" />
            {showHint ? 'Hide Hint' : 'Hint'}
          </motion.button>
        </div>
      </div>

      {/* Ad Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-lg border-t border-white/10 z-20">
        <div className="max-w-lg mx-auto">
          <div className="h-16 flex items-center justify-center">
            <span className="text-white/30 text-sm font-medium">Advertisement Space</span>
          </div>
        </div>
      </div>

      {/* Level Complete Modal */}
      <Dialog open={showLevelComplete} onOpenChange={setShowLevelComplete}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-indigo-900 to-purple-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <p className="text-3xl font-bold">Level Complete!</p>
                <p className="text-white/70 mt-1">Amazing job!</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div className="bg-white/10 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Words Found</span>
                <span className="font-bold">{foundWords.length}/{currentLevel.words.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Hints Used</span>
                <span className="font-bold">{hintsUsed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Streak Bonus</span>
                <span className="font-bold text-yellow-400">x{streak}</span>
              </div>
              <div className="border-t border-white/20 pt-2 flex justify-between">
                <span className="text-white/70">Total Score</span>
                <span className="font-bold text-xl text-emerald-400">{totalScore.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-white/70 mb-2">Theme: <span className="font-semibold text-amber-400">{currentLevel.theme}</span></p>
              <div className="flex flex-wrap gap-1">
                {foundWords.map((word) => (
                  <span key={word} className={`bg-gradient-to-r ${wordColors[word]} text-white text-xs px-2 py-1 rounded`}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleNextLevel}
              className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-4 rounded-xl text-lg"
            >
              Next Level
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Modal */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="sm:max-w-sm bg-gradient-to-br from-indigo-900 to-purple-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-white/70">Current Level</p>
              <p className="text-2xl font-bold">{currentLevelId}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-white/70">Total Score</p>
              <p className="text-2xl font-bold text-emerald-400">{totalScore.toLocaleString()}</p>
            </div>
            <Button 
              onClick={() => { setShowMenu(false); handleReset(); }}
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Level
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
