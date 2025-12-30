
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- CONSTANTS ---
const COLS = 10;
const ROWS = 20;

type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

const PIECES: Record<PieceType, { color: string; shape: number[][] }> = {
  I: { color: '#00f0f0', shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
  J: { color: '#0000f0', shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
  L: { color: '#f0a000', shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
  O: { color: '#f0f000', shape: [[1, 1], [1, 1]] },
  S: { color: '#00f000', shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
  T: { color: '#a000f0', shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
  Z: { color: '#f00000', shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
};

// --- UTILS ---
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

// --- GAME LOGIC ---
const App: React.FC = () => {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<{ type: PieceType; shape: number[][]; pos: { x: number; y: number } } | null>(null);
  const [nextPieceType, setNextPieceType] = useState<PieceType>(getRandomPieceType());
  const [holdPieceType, setHoldPieceType] = useState<PieceType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  function getRandomPieceType(): PieceType {
    const types: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return types[Math.floor(Math.random() * types.length)];
  }

  const spawnPiece = useCallback((typeOverride?: PieceType) => {
    const type = typeOverride || nextPieceType;
    if (!typeOverride) setNextPieceType(getRandomPieceType());
    
    const piece = PIECES[type];
    const newPiece = {
      type,
      shape: piece.shape,
      pos: { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: 0 }
    };

    if (checkCollision(newPiece.shape, newPiece.pos.x, newPiece.pos.y)) {
      setGameOver(true);
    } else {
      setActivePiece(newPiece);
      setCanHold(true);
    }
  }, [nextPieceType]);

  const checkCollision = (shape: number[][], x: number, y: number, currentGrid = grid) => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentGrid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = () => {
    if (!activePiece) return;
    const newShape = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
    if (!checkCollision(newShape, activePiece.pos.x, activePiece.pos.y)) {
      setActivePiece({ ...activePiece, shape: newShape });
    }
  };

  const move = (dx: number, dy: number) => {
    if (!activePiece || gameOver || paused) return false;
    if (!checkCollision(activePiece.shape, activePiece.pos.x + dx, activePiece.pos.y + dy)) {
      setActivePiece({ ...activePiece, pos: { x: activePiece.pos.x + dx, y: activePiece.pos.y + dy } });
      return true;
    }
    if (dy > 0) lockPiece();
    return false;
  };

  const lockPiece = () => {
    if (!activePiece) return;
    const newGrid = [...grid.map(row => [...row])];
    activePiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const gridY = activePiece.pos.y + y;
          const gridX = activePiece.pos.x + x;
          if (gridY >= 0) newGrid[gridY][gridX] = PIECES[activePiece.type].color;
        }
      });
    });

    // Clear lines
    let linesCleared = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== '');
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
    }

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared] * level;
      setScore(s => s + points);
      setLines(l => {
        const newTotal = l + linesCleared;
        if (Math.floor(newTotal / 10) > Math.floor(l / 10)) setLevel(lv => lv + 1);
        return newTotal;
      });
    }

    setGrid(filteredGrid);
    setActivePiece(null);
    spawnPiece();
  };

  const hardDrop = () => {
    if (!activePiece || gameOver || paused) return;
    let y = activePiece.pos.y;
    while (!checkCollision(activePiece.shape, activePiece.pos.x, y + 1)) {
      y++;
    }
    setActivePiece({ ...activePiece, pos: { ...activePiece.pos, y } });
    setTimeout(lockPiece, 0);
  };

  const holdPiece = () => {
    if (!activePiece || !canHold || gameOver || paused) return;
    const currentType = activePiece.type;
    if (holdPieceType) {
      spawnPiece(holdPieceType);
    } else {
      spawnPiece();
    }
    setHoldPieceType(currentType);
    setCanHold(false);
  };

  const getGhostPos = () => {
    if (!activePiece) return 0;
    let y = activePiece.pos.y;
    while (!checkCollision(activePiece.shape, activePiece.pos.x, y + 1)) {
      y++;
    }
    return y;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': move(-1, 0); break;
        case 'ArrowRight': move(1, 0); break;
        case 'ArrowDown': move(0, 1); break;
        case 'ArrowUp': rotate(); break;
        case ' ': hardDrop(); break;
        case 'c': case 'C': holdPiece(); break;
        case 'p': case 'P': setPaused(v => !v); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePiece, grid, gameOver, paused, holdPieceType, canHold]);

  useEffect(() => {
    spawnPiece();
  }, []);

  useInterval(() => {
    if (!paused && !gameOver) move(0, 1);
  }, paused || gameOver ? null : Math.max(100, 1000 - (level - 1) * 100));

  const reset = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setPaused(false);
    setHoldPieceType(null);
    setCanHold(true);
    setNextPieceType(getRandomPieceType());
    spawnPiece();
  };

  // --- RENDER HELPERS ---
  const ghostY = getGhostPos();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* LEFT PANEL: HOLD */}
        <div className="flex flex-col gap-4">
          <div className="neon-border bg-stone-900 p-4 rounded-xl w-32 h-32 flex flex-col items-center">
            <span className="text-[10px] neon-font text-cyan-400 mb-2">Hold</span>
            <div className="flex-1 flex items-center justify-center">
              {holdPieceType && <MiniPiece type={holdPieceType} />}
            </div>
          </div>
          
          <div className="neon-border bg-stone-900 p-4 rounded-xl w-32">
            <div className="flex flex-col gap-2">
              <Stat label="Score" value={score} />
              <Stat label="Level" value={level} />
              <Stat label="Lines" value={lines} />
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="relative neon-border bg-black p-1 rounded-sm">
          <div className="grid grid-cols-10 gap-[1px] bg-stone-800">
            {grid.map((row, y) => row.map((color, x) => {
              let cellColor = color;
              let isGhost = false;
              let isActive = false;

              // Render active piece
              if (activePiece) {
                const py = y - activePiece.pos.y;
                const px = x - activePiece.pos.x;
                if (py >= 0 && py < activePiece.shape.length && px >= 0 && px < activePiece.shape[0].length && activePiece.shape[py][px]) {
                  cellColor = PIECES[activePiece.type].color;
                  isActive = true;
                } else {
                  // Ghost piece
                  const gy = y - ghostY;
                  if (gy >= 0 && gy < activePiece.shape.length && px >= 0 && px < activePiece.shape[0].length && activePiece.shape[gy][px]) {
                    cellColor = 'rgba(255, 255, 255, 0.15)';
                    isGhost = true;
                  }
                }
              }

              return (
                <div 
                  key={`${x}-${y}`} 
                  className="w-6 h-6 md:w-8 md:h-8 cell-glow"
                  style={{ backgroundColor: cellColor || '#0c0a09' }}
                />
              );
            }))}
          </div>

          {/* OVERLAYS */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
              <h2 className="text-3xl neon-font text-red-500 mb-4">Core Failure</h2>
              <p className="text-stone-400 text-sm mb-6">Simulation Terminated</p>
              <button onClick={reset} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white neon-font rounded-lg transition-all">Reboot</button>
            </div>
          )}
          
          {paused && !gameOver && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
              <h2 className="text-2xl neon-font text-cyan-400 animate-pulse">Paused</h2>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: NEXT */}
        <div className="flex flex-col gap-4">
          <div className="neon-border bg-stone-900 p-4 rounded-xl w-32 h-32 flex flex-col items-center">
            <span className="text-[10px] neon-font text-cyan-400 mb-2">Next</span>
            <div className="flex-1 flex items-center justify-center">
              <MiniPiece type={nextPieceType} />
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-2 text-[9px] text-stone-500 uppercase">
             <div><span className="text-cyan-600">Arrows</span> Move</div>
             <div><span className="text-cyan-600">Up</span> Rotate</div>
             <div><span className="text-cyan-600">Space</span> Drop</div>
             <div><span className="text-cyan-600">C</span> Hold</div>
          </div>
        </div>
      </div>
      
      {/* Mobile Controls */}
      <div className="mt-8 grid grid-cols-3 gap-2 md:hidden">
        <ControlButton icon="fa-arrow-left" onClick={() => move(-1, 0)} />
        <ControlButton icon="fa-rotate" onClick={rotate} />
        <ControlButton icon="fa-arrow-right" onClick={() => move(1, 0)} />
        <ControlButton icon="fa-arrow-down" onClick={() => move(0, 1)} />
        <ControlButton icon="fa-angles-down" onClick={hardDrop} />
        <ControlButton icon="fa-box" onClick={holdPiece} />
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex flex-col items-start">
    <span className="text-[8px] neon-font text-stone-600">{label}</span>
    <span className="text-lg neon-font text-white">{value}</span>
  </div>
);

const MiniPiece = ({ type }: { type: PieceType }) => {
  const piece = PIECES[type];
  return (
    <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)` }}>
      {piece.shape.map((row, y) => row.map((val, x) => (
        <div 
          key={`${x}-${y}`} 
          className="w-3 h-3 md:w-4 md:h-4"
          style={{ backgroundColor: val ? piece.color : 'transparent' }}
        />
      )))}
    </div>
  );
};

const ControlButton = ({ icon, onClick }: { icon: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-14 h-14 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
  >
    <i className={`fas ${icon} text-cyan-500`}></i>
  </button>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
