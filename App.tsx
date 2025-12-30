
import React, { useState, useEffect, useRef } from 'react';
import CharacterCreator from './components/CharacterCreator';
import CharacterSheet from './components/CharacterSheet';
import { Character, GameScene, GameLogEntry, ActionOption } from './types';
import { generateInitialScene, processPlayerAction, generateSceneImage } from './services/geminiService';

const App: React.FC = () => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [scene, setScene] = useState<GameScene | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [customAction, setCustomAction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, loading]);

  const handleCharCreation = async (char: Character) => {
    setCharacter(char);
    setLoading(true);
    try {
      const initialScene = await generateInitialScene(char);
      const imageUrl = await generateSceneImage(initialScene.imagePrompt);
      setScene({ ...initialScene, imageUrl });
      setLogs([{ type: 'story', content: initialScene.description, timestamp: Date.now() }]);
    } catch (err) {
      console.error(err);
      setError("The mists are too thick... (API Error)");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionText: string) => {
    if (!character || loading) return;

    setLoading(true);
    setError(null);
    setLogs(prev => [...prev, { type: 'player', content: actionText, timestamp: Date.now() }]);

    try {
      // Keep track of the last few interactions for context
      const history = logs.slice(-10).map(l => ({
        role: l.type === 'player' ? 'user' as const : 'model' as const,
        text: l.content
      }));
      
      const nextScene = await processPlayerAction(character, actionText, history);
      const imageUrl = await generateSceneImage(nextScene.imagePrompt);
      
      setScene({ ...nextScene, imageUrl });
      setLogs(prev => [...prev, { type: 'story', content: nextScene.description, timestamp: Date.now() }]);

      // Update character state based on scene changes
      if (nextScene.statChanges || nextScene.inventoryChanges) {
        setCharacter(prev => {
          if (!prev) return prev;
          let newChar = { ...prev };
          
          if (nextScene.statChanges) {
            newChar.stats = {
              ...newChar.stats,
              health: Math.max(0, Math.min(newChar.stats.maxHealth, newChar.stats.health + (nextScene.statChanges.health || 0))),
              mana: Math.max(0, Math.min(newChar.stats.maxMana, newChar.stats.mana + (nextScene.statChanges.mana || 0))),
            };
            newChar.xp += nextScene.statChanges.xp || 0;
            if (newChar.xp >= newChar.level * 100) {
              newChar.level += 1;
              newChar.xp = 0;
            }
          }

          if (nextScene.inventoryChanges) {
            const toAdd = nextScene.inventoryChanges.add || [];
            const toRemove = nextScene.inventoryChanges.remove || [];
            newChar.inventory = [...newChar.inventory, ...toAdd].filter(item => !toRemove.includes(item));
          }

          return newChar;
        });
      }

    } catch (err) {
      console.error(err);
      setError("The Dungeon Master seems to be having a moment... Try again.");
    } finally {
      setLoading(false);
      setCustomAction('');
    }
  };

  if (!character) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
        <CharacterCreator onComplete={handleCharCreation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col md:flex-row p-4 gap-6 max-w-7xl mx-auto">
      {/* Sidebar: Stats & Inventory */}
      <aside className="w-full md:w-1/4 shrink-0">
        <CharacterSheet character={character} />
      </aside>

      {/* Main Content: Scene & Chat */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden max-h-[calc(100vh-2rem)]">
        {/* Visualizer */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-amber-900/30 shadow-2xl bg-black">
          {scene?.imageUrl ? (
            <img 
              src={scene.imageUrl} 
              alt="Current Scene" 
              className="w-full h-full object-cover transition-opacity duration-1000"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-900">
              <i className="fas fa-compass-drafting text-stone-700 text-6xl animate-pulse"></i>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent"></div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
                <div className="fantasy-font text-amber-500 animate-pulse">The Story Unfolds...</div>
              </div>
            </div>
          )}
        </div>

        {/* Story Log */}
        <div 
          ref={scrollRef}
          className="flex-1 bg-stone-900/50 border border-stone-800 rounded-xl p-6 overflow-y-auto space-y-4 custom-scrollbar"
        >
          {logs.map((log, idx) => (
            <div key={idx} className={`flex ${log.type === 'player' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-lg leading-relaxed ${
                log.type === 'player' 
                  ? 'bg-amber-600/10 border border-amber-500/20 text-amber-200' 
                  : 'bg-stone-800/50 border border-stone-700 text-stone-300'
              }`}>
                {log.type === 'player' && <div className="text-[10px] uppercase font-bold text-amber-600 mb-1">Your Action</div>}
                <div className="whitespace-pre-wrap">{log.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-800/30 p-4 rounded-lg border border-stone-700 italic text-stone-500">
                The Dungeon Master is scribbling furiously...
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-lg text-center">
              {error}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {scene?.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAction(opt.label)}
                disabled={loading}
                className="rpg-button text-left p-3 rounded-lg text-stone-300 hover:text-amber-400 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-stone-800 group-hover:bg-amber-900/40 rounded transition-colors">
                  {opt.type === 'action' && <i className="fas fa-hand-fist text-sm"></i>}
                  {opt.type === 'dialogue' && <i className="fas fa-comments text-sm"></i>}
                  {opt.type === 'movement' && <i className="fas fa-walking text-sm"></i>}
                </div>
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customAction && handleAction(customAction)}
              placeholder="What will you do? (Type custom action...)"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg py-3 px-4 pr-12 focus:ring-1 focus:ring-amber-500 outline-none text-stone-200"
            />
            <button
              onClick={() => customAction && handleAction(customAction)}
              disabled={!customAction || loading}
              className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-stone-950 rounded transition-colors disabled:opacity-50"
            >
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
