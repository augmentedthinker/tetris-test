
import React, { useState } from 'react';
import { Character, CharacterClass, Stats } from '../types';

interface Props {
  onComplete: (char: Character) => void;
}

const CLASSES: CharacterClass[] = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Paladin'];

const CharacterCreator: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('Warrior');

  const handleStart = () => {
    if (!name.trim()) return;

    let stats: Stats = {
      health: 100, maxHealth: 100,
      mana: 50, maxMana: 50,
      strength: 10, intelligence: 10, dexterity: 10
    };

    let inventory = ['Rations', 'Waterskin', 'Bedroll'];

    switch (selectedClass) {
      case 'Warrior':
        stats.strength = 15; stats.dexterity = 12;
        inventory.push('Rusty Longsword', 'Leather Armor');
        break;
      case 'Mage':
        stats.intelligence = 16; stats.mana = 100; stats.maxMana = 100;
        inventory.push('Gnarled Staff', 'Apprentice Robes');
        break;
      case 'Rogue':
        stats.dexterity = 16; stats.strength = 11;
        inventory.push('Pair of Daggers', 'Dark Cloak');
        break;
      case 'Cleric':
        stats.intelligence = 14; stats.health = 110; stats.maxHealth = 110;
        inventory.push('Mace', 'Holy Symbol');
        break;
      case 'Paladin':
        stats.strength = 14; stats.intelligence = 12; stats.health = 120; stats.maxHealth = 120;
        inventory.push('Broken Shield', 'Heavy Maul');
        break;
    }

    onComplete({
      name,
      class: selectedClass,
      stats,
      inventory,
      level: 1,
      xp: 0
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 bg-stone-900 border border-amber-900/30 rounded-xl shadow-2xl parchment-glow">
      <h1 className="text-4xl text-amber-500 font-bold mb-8 text-center">Begin Your Legend</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest">Hero Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Kaelen of Ironpeak"
            className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg p-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-400 mb-4 uppercase tracking-widest">Choose Your Path</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`p-4 rounded-lg border text-center transition-all ${
                  selectedClass === c 
                    ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(214,158,46,0.2)]' 
                    : 'bg-stone-800 border-stone-700 text-stone-500 hover:border-stone-500'
                }`}
              >
                <div className="text-xl mb-1">
                  {c === 'Warrior' && <i className="fas fa-sword"></i>}
                  {c === 'Mage' && <i className="fas fa-hat-wizard"></i>}
                  {c === 'Rogue' && <i className="fas fa-user-ninja"></i>}
                  {c === 'Cleric' && <i className="fas fa-cross"></i>}
                  {c === 'Paladin' && <i className="fas fa-shield-alt"></i>}
                </div>
                <div className="text-sm font-bold fantasy-font">{c}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:cursor-not-allowed text-stone-900 font-bold text-xl rounded-lg transition-all shadow-lg active:scale-95"
        >
          Embark Into The Unknown
        </button>
      </div>
    </div>
  );
};

export default CharacterCreator;
