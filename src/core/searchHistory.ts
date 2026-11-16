import { SearchHistoryManager, SearchHistoryOptions, StorageAdapter } from '../types/types.js';

const DEFAULT_STORAGE_KEY = 'country_search_history';
const DEFAULT_MAX_ITEMS = 6;

const resolveBrowserStorage = (): StorageAdapter | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseHistoryJson = (rawJson: string | null, limit: number): string[] => {
  if (!rawJson || limit <= 0) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawJson);
    return isStringArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
};

const buildUpdatedHistory = (currentItems: string[], newQuery: string, limit: number): string[] => {
  if (limit <= 0) {
    return [];
  }

  const normalizedNew = newQuery.toLowerCase();
  const withoutDuplicates = currentItems.filter((item) => item.toLowerCase() !== normalizedNew);

  return [newQuery, ...withoutDuplicates].slice(0, limit);
};

export const createSearchHistory = (options: SearchHistoryOptions = {}): SearchHistoryManager => {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const maxItems = Math.max(0, Math.floor(options.maxItems ?? DEFAULT_MAX_ITEMS));
  const storage = options.storage ?? resolveBrowserStorage();

  const safeExecute = <T>(action: (adapter: StorageAdapter) => T, fallback: T): T => {
    if (!storage) {
      return fallback;
    }

    try {
      return action(storage);
    } catch {
      return fallback;
    }
  };

  const getAll = (): string[] => {
    const raw = safeExecute((adapter) => adapter.getItem(storageKey), null);
    return parseHistoryJson(raw, maxItems);
  };

  const add = (rawQuery: string): string[] => {
    const cleanQuery = rawQuery.trim();
    const currentItems = getAll();

    if (!cleanQuery) {
      return currentItems;
    }

    const updatedItems = buildUpdatedHistory(currentItems, cleanQuery, maxItems);
    safeExecute((adapter) => {
      adapter.setItem(storageKey, JSON.stringify(updatedItems));
    }, undefined);

    return updatedItems;
  };

  const clear = (): void => {
    safeExecute((adapter) => {
      adapter.removeItem(storageKey);
    }, undefined);
  };

  return {
    add,
    getAll,
    clear,
  };
};
