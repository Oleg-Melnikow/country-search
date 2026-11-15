import { describe, it, expect, beforeEach } from '@jest/globals';
import { createSearchHistory } from '../core/searchHistory.js';

const createMemoryStorage = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
  };
};

describe('createSearchHistory — история запросов в localStorage', () => {
  const STORAGE_KEY = 'country_search_history_test';
  let storage: ReturnType<typeof createMemoryStorage>;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it('возвращает пустой массив при инициализации, если хранилище пустое', () => {
    const history = createSearchHistory({ storageKey: STORAGE_KEY, storage });

    expect(history.getAll()).toEqual([]);
  });

  it('добавляет новые запросы в начало списка и сохраняет их в storage', () => {
    const history = createSearchHistory({ storageKey: STORAGE_KEY, storage });

    history.add('Belarus');
    history.add('Spain');

    expect(history.getAll()).toEqual(['Spain', 'Belarus']);

    // Проверяем, что данные сохранились между экземплярами (персистентность)
    const rehydratedHistory = createSearchHistory({ storageKey: STORAGE_KEY, storage });
    expect(rehydratedHistory.getAll()).toEqual(['Spain', 'Belarus']);
  });

  it('игнорирует пустые строки и очищает лишние пробелы по краям', () => {
    const history = createSearchHistory({ storageKey: STORAGE_KEY, storage });

    history.add('');
    history.add('   ');
    history.add('  Japan  ');

    expect(history.getAll()).toEqual(['Japan']);
  });

  it('перемещает существующий запрос на первое место без дублирования (без учёта регистра)', () => {
    const history = createSearchHistory({ storageKey: STORAGE_KEY, storage });

    history.add('Belarus');
    history.add('Spain');
    history.add('belarus');

    expect(history.getAll()).toEqual(['belarus', 'Spain']);
  });

  it('ограничивает количество сохраняемых запросов значением maxItems', () => {
    const history = createSearchHistory({
      storageKey: STORAGE_KEY,
      maxItems: 3,
      storage,
    });

    history.add('First');
    history.add('Second');
    history.add('Third');
    history.add('Fourth');

    expect(history.getAll()).toEqual(['Fourth', 'Third', 'Second']);
  });

  it('очищает историю при вызове clear()', () => {
    const history = createSearchHistory({ storageKey: STORAGE_KEY, storage });

    history.add('Germany');
    history.clear();

    expect(history.getAll()).toEqual([]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('не падает и возвращает пустой массив, если в storage записан повреждённый JSON', () => {
    storage.setItem(STORAGE_KEY, '{broken_json');

    const history = createSearchHistory({ storageKey: STORAGE_KEY, storage });

    expect(history.getAll()).toEqual([]);
  });
});
