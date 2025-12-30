
export type CharacterClass = 'Warrior' | 'Mage' | 'Rogue' | 'Cleric' | 'Paladin';

export interface Stats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  intelligence: number;
  dexterity: number;
}

export interface Character {
  name: string;
  class: CharacterClass;
  stats: Stats;
  inventory: string[];
  level: number;
  xp: number;
}

export interface ActionOption {
  id: string;
  label: string;
  type: 'action' | 'dialogue' | 'movement';
}

export interface GameScene {
  description: string;
  imagePrompt: string;
  imageUrl?: string;
  options: ActionOption[];
  isGameOver: boolean;
  // Added xp to the partial type to allow statChanges to update character experience
  statChanges?: Partial<Stats & { xp: number }>;
  inventoryChanges?: {
    add?: string[];
    remove?: string[];
  };
}

export interface GameLogEntry {
  type: 'story' | 'player' | 'system';
  content: string;
  timestamp: number;
}