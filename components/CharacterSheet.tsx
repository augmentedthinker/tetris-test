
import React from 'react';
import { Character } from '../types';

interface Props {
  character: Character;
}

const CharacterSheet: React.FC<Props> = ({ character }) => {
  const hpPercent = (character.stats.health / character.stats.maxHealth) * 100;
  const manaPercent = (character.stats.mana / character.stats.maxMana) * 100;

  return (
    <div className="bg-stone-900/80 border border-stone-700 p-6 rounded-lg backdrop-blur-sm sticky top-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold fantasy-font text-amber-500 mb-1">{character.name}</h2>
        <div className="text-sm text-stone-400 uppercase tracking-widest">Level {character.level} {character.class}</div>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <div className="flex justify-between text-xs mb-1 uppercase text-stone-300">
            <span>Health</span>
            <span>{character.stats.health} / {character.stats.maxHealth}</span>
          </div>
          <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600 transition-all duration-500" 
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1 uppercase text-stone-300">
            <span>Mana</span>
            <span>{character.stats.mana} / {character.stats.maxMana}</span>
          </div>
          <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500" 
              style={{ width: `${manaPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="text-center p-2 bg-stone-800/50 rounded border border-stone-700">
          <div className="text-[10px] uppercase text-stone-500">STR</div>
          <div className="text-lg font-bold text-amber-200">{character.stats.strength}</div>
        </div>
        <div className="text-center p-2 bg-stone-800/50 rounded border border-stone-700">
          <div className="text-[10px] uppercase text-stone-500">INT</div>
          <div className="text-lg font-bold text-amber-200">{character.stats.intelligence}</div>
        </div>
        <div className="text-center p-2 bg-stone-800/50 rounded border border-stone-700">
          <div className="text-[10px] uppercase text-stone-500">DEX</div>
          <div className="text-lg font-bold text-amber-200">{character.stats.dexterity}</div>
        </div>
      </div>

      <div className="border-t border-stone-700 pt-6">
        <h3 className="text-sm font-bold fantasy-font text-amber-500 uppercase mb-3 flex items-center gap-2">
          <i className="fas fa-backpack text-xs"></i> Inventory
        </h3>
        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {character.inventory.length > 0 ? (
            character.inventory.map((item, idx) => (
              <li key={idx} className="text-sm text-stone-400 flex items-center gap-2 bg-stone-800/30 p-2 rounded">
                <i className="fas fa-scroll text-[10px] text-stone-600"></i>
                {item}
              </li>
            ))
          ) : (
            <li className="text-sm text-stone-600 italic">Inventory is empty...</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CharacterSheet;
