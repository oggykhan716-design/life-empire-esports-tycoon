import { GameState } from '../types/game';

const STORAGE_PREFIX = 'life_empire_esports_save_';
const ACTIVE_SLOT_KEY = 'life_empire_esports_active_slot';

export interface SaveSlotSummary {
  slotId: string;
  characterName: string;
  orgName: string | null;
  week: number;
  year: number;
  countryId: string;
  cashUSD: number;
  savedAt: string;
}

export function saveGameToSlot(state: GameState, slotId = state.saveSlotId): void {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      state: { ...state, saveSlotId: slotId },
    };
    localStorage.setItem(`${STORAGE_PREFIX}${slotId}`, JSON.stringify(payload));
    localStorage.setItem(ACTIVE_SLOT_KEY, slotId);
  } catch (err) {
    console.error('Failed to save game:', err);
  }
}

export function loadGameFromSlot(slotId: string): GameState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch (err) {
    console.error('Failed to load game:', err);
    return null;
  }
}

export function getLastActiveSlotId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SLOT_KEY);
  } catch {
    return null;
  }
}

export function listSaveSlots(): SaveSlotSummary[] {
  const slots = ['slot_1', 'slot_2', 'slot_3'];
  const summaries: SaveSlotSummary[] = [];

  for (const slotId of slots) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const s: GameState = parsed.state;
      if (!s) continue;
      summaries.push({
        slotId,
        characterName: `${s.character.firstName} ${s.character.lastName}`,
        orgName: s.org.founded ? s.org.name : null,
        week: s.week,
        year: s.year,
        countryId: s.character.countryId,
        cashUSD: s.finances.cashUSD + s.finances.bankBalanceUSD,
        savedAt: parsed.savedAt ?? '',
      });
    } catch {
      // skip invalid slot
    }
  }
  return summaries;
}

export function deleteSaveSlot(slotId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${slotId}`);
  } catch (err) {
    console.error('Failed to delete save slot:', err);
  }
}
