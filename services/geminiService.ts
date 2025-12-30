
import { Character, GameScene } from "../types";

/**
 * Pollinations AI Service
 * Replaces Gemini API with Pollinations for text (story) and image generation.
 */

const TEXT_API_URL = 'https://text.pollinations.ai/';

const SYSTEM_PROMPT = `You are a world-class Tabletop RPG Dungeon Master. 
Your goal is to lead a dark high-fantasy adventure. 
You must ALWAYS respond with a valid JSON object matching this schema:
{
  "description": "Atmospheric and detailed description (max 3 paragraphs).",
  "imagePrompt": "A detailed visual prompt for an image generator. Focus on lighting and style. No text.",
  "options": [
    {"id": "1", "label": "Action name", "type": "action|dialogue|movement"}
  ],
  "isGameOver": false,
  "statChanges": {"health": 0, "mana": 0, "xp": 0},
  "inventoryChanges": {"add": [], "remove": []}
}
If a player takes damage or finds items, reflect it in statChanges or inventoryChanges.`;

async function fetchAetherisNarrative(userPrompt: string, history: any[] = []): Promise<GameScene> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userPrompt }
  ];

  const response = await fetch(TEXT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      seed: Math.floor(Math.random() * 1000000),
      model: 'openai' // Pollinations uses high-quality models for this alias
    })
  });

  if (!response.ok) throw new Error('Pollinations Text API failed');

  const text = await response.text();
  
  // Attempt to extract JSON from the response (sometimes AI wraps it in markdown)
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("The DM's scroll is unreadable (JSON Parse Error)");
  }
}

export async function generateInitialScene(character: Character): Promise<GameScene> {
  const prompt = `Start a new adventure for ${character.name}, a Level ${character.level} ${character.class}. 
  Stats: STR ${character.stats.strength}, INT ${character.stats.intelligence}, DEX ${character.stats.dexterity}.
  Set the scene in a mysterious, dangerous location.`;

  return fetchAetherisNarrative(prompt);
}

export async function processPlayerAction(
  character: Character,
  action: string,
  history: { role: 'user' | 'model', text: string }[]
): Promise<GameScene> {
  const formattedHistory = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.text
  }));

  const prompt = `Player Action: "${action}"
  Character: ${character.name} (${character.class})
  HP: ${character.stats.health}/${character.stats.maxHealth}
  Inventory: ${character.inventory.join(', ')}
  Describe what happens next and update the world state.`;

  return fetchAetherisNarrative(prompt, formattedHistory);
}

export async function generateSceneImage(prompt: string): Promise<string> {
  const seed = Math.floor(Math.random() * 1000000);
  const width = 1280;
  const height = 720;
  
  // Pollinations image generation via URL
  const enhancedPrompt = encodeURIComponent(`High quality dark fantasy digital art, cinematic lighting, epic composition, detailed textures, masterpiece, no text: ${prompt}`);
  
  const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;
  
  // We return the URL directly. In App.tsx, this will be used as the <img> src.
  // We do a quick pre-fetch check to ensure it's "ready", though Pollinations generates on the fly.
  return imageUrl;
}
