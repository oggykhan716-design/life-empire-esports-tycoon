import { FICTIONAL_STARTING_TALENTS } from '../data/fictionalPlayers';
import { GameState } from '../types/game';
import { ensurePhoneState } from './events/eventBus';

const STORAGE_PREFIX = 'life_empire_esports_save_';
const SANDBOX_STORAGE_KEY = 'life_empire_esports_sandbox_save';
const ACTIVE_SLOT_KEY = 'life_empire_esports_active_slot';
const DEV_MODE_KEY = 'life_empire_esports_dev_mode';
const DEV_SNAPSHOTS_KEY = 'life_empire_esports_dev_snapshots';

export const SANDBOX_SLOT_ID = 'sandbox_slot';

export function migrateGameState(raw: GameState): GameState {
  let state: GameState = {
    ...raw,
    schemaVersion: raw.schemaVersion ?? 2,
    careerType: raw.careerType ?? (raw.playerCareer && !raw.playerCareer.retired ? 'PLAYER' : 'OWNER'),
    randomSeed: raw.randomSeed ?? 421907,
    day: raw.day ?? 1,
    eventHistory: raw.eventHistory ?? [],
    processedEventIds: raw.processedEventIds ?? [],
  };

  // Seed fictional ecosystem talents if missing from older saves
  const knownIds = new Set([
    ...state.roster.map((p) => p.id),
    ...state.marketPlayers.map((p) => p.id),
  ]);
  const missingTalents = FICTIONAL_STARTING_TALENTS.filter((p) => !knownIds.has(p.id));
  if (missingTalents.length > 0) {
    state = {
      ...state,
      marketPlayers: [...missingTalents, ...state.marketPlayers],
    };
  }

  return ensurePhoneState(state);
}

export interface SaveSlotSummary {
  slotId: string;
  characterName: string;
  orgName: string | null;
  careerLabel?: string;
  week: number;
  year: number;
  countryId: string;
  cashUSD: number;
  savedAt: string;
  isSandbox?: boolean;
}

export interface DevSnapshot {
  id: string;
  label: string;
  createdAt: string;
  week: number;
  year: number;
  state: GameState;
}

export function saveGameToSlot(state: GameState, slotId = state.saveSlotId): void {
  try {
    if (state.isSandbox || slotId === SANDBOX_SLOT_ID) {
      const payload = {
        savedAt: new Date().toISOString(),
        state: { ...state, isSandbox: true, saveSlotId: SANDBOX_SLOT_ID },
      };
      localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(ACTIVE_SLOT_KEY, SANDBOX_SLOT_ID);
      return;
    }

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
    if (slotId === SANDBOX_SLOT_ID) {
      const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state ? migrateGameState(parsed.state) : null;
    }
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ? migrateGameState(parsed.state) : null;
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
      if (!s || s.isSandbox) continue;
      const isPlayerCareer = s.careerType === 'PLAYER' && s.playerCareer && !s.playerCareer.retired;
      summaries.push({
        slotId,
        characterName: `${s.character.firstName} ${s.character.lastName}`,
        orgName: s.org.founded ? s.org.name : null,
        careerLabel: isPlayerCareer
          ? `Pro Player · ${s.playerCareer!.ign} (${s.playerCareer!.rank})`
          : s.org.founded
          ? `CEO of ${s.org.name}`
          : 'Independent · Working Early Career',
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

export function getSandboxSummary(): SaveSlotSummary | null {
  try {
    const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const s: GameState = parsed.state;
    if (!s) return null;
    return {
      slotId: SANDBOX_SLOT_ID,
      characterName: `${s.character.firstName} ${s.character.lastName}`,
      orgName: s.org.founded ? s.org.name : null,
      week: s.week,
      year: s.year,
      countryId: s.character.countryId,
      cashUSD: s.finances.cashUSD + s.finances.bankBalanceUSD,
      savedAt: parsed.savedAt ?? '',
      isSandbox: true,
    };
  } catch {
    return null;
  }
}

export function deleteSaveSlot(slotId: string): void {
  try {
    if (slotId === SANDBOX_SLOT_ID) {
      localStorage.removeItem(SANDBOX_STORAGE_KEY);
      return;
    }
    localStorage.removeItem(`${STORAGE_PREFIX}${slotId}`);
  } catch (err) {
    console.error('Failed to delete save slot:', err);
  }
}

export function getDevModePreference(): boolean {
  try {
    return localStorage.getItem(DEV_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDevModePreference(enabled: boolean): void {
  try {
    localStorage.setItem(DEV_MODE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}

export function listDevSnapshots(): DevSnapshot[] {
  try {
    const raw = localStorage.getItem(DEV_SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDevSnapshot(state: GameState, label: string): DevSnapshot[] {
  try {
    const existing = listDevSnapshots();
    const clonedState = JSON.parse(JSON.stringify(state)) as GameState;
    const snap: DevSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      createdAt: new Date().toISOString(),
      week: state.week,
      year: state.year,
      state: clonedState,
    };
    const next = [snap, ...existing].slice(0, 12);
    localStorage.setItem(DEV_SNAPSHOTS_KEY, JSON.stringify(next));
    return next;
  } catch (err) {
    console.error('Failed to save testing snapshot:', err);
    return listDevSnapshots();
  }
}

export function clearDevSnapshots(): void {
  try {
    localStorage.removeItem(DEV_SNAPSHOTS_KEY);
  } catch {
    // ignore
  }
}
