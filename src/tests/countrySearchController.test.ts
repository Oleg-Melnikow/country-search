import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

import * as apiModule from '../core/searchCountries.js';
import { MOCK_COUNTRIES_BEL } from './mock-data.js';
import { ResponseCountry, SearchState } from '../types/types.js';
import { createCountrySearchController } from '../core/countrySearchController.js';
import { HttpError } from '../utils/httpError.js';
import { flushPromises } from '../utils/flushPromises.js';

const MOCK_RAW_BELARUS: ResponseCountry = MOCK_COUNTRIES_BEL[0];

describe('createCountrySearchController — базовая логика', () => {
  const DEBOUNCE_MS = 300;
  const TIMEOUT_MS = 5000;
  let searchSpy: jest.SpiedFunction<typeof apiModule.searchCountries>;

  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.localStorage?.clear();
    searchSpy = jest.spyOn(apiModule, 'searchCountries');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('инициализируется в состоянии idle с пустыми результатами и без ошибок', () => {
    const controller = createCountrySearchController({
      debounceMs: DEBOUNCE_MS,
      timeoutMs: TIMEOUT_MS,
    });

    const expectedState: SearchState = {
      status: 'idle',
      query: '',
      results: [],
      history: [],
      error: null,
    };

    expect(controller.getState()).toEqual(expectedState);
  });

  it('выполняет поиск после debounce, переводит статус в loading -> success и маппит карточки', async () => {
    searchSpy.mockResolvedValue([MOCK_RAW_BELARUS]);

    const controller = createCountrySearchController({
      debounceMs: DEBOUNCE_MS,
      timeoutMs: TIMEOUT_MS,
    });
    const statuses: string[] = [];
    controller.subscribe((state) => statuses.push(state.status));

    controller.handleInput('Belarus');

    // До истечения debounce запрос ещё не ушёл
    expect(searchSpy).not.toHaveBeenCalled();

    // Проходит время debounce
    jest.advanceTimersByTime(DEBOUNCE_MS);
    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith('Belarus', expect.any(AbortSignal));

    // Дожидаемся завершения промиса searchCountries
    await flushPromises();

    const finalState = controller.getState();
    expect(statuses).toContain('loading');
    expect(finalState.status).toBe('success');
    expect(finalState.error).toBeNull();
    expect(finalState.results).toHaveLength(1);
    expect(finalState.results).toMatchObject([
      {
        name: 'Belarus',
        capital: 'Minsk',
        flagUrl: 'https://flagcdn.com',
        currencies: ['BYN', 'BYR'],
      },
    ]);
  });

  it('переводит состояние в empty, если API вернул пустой массив (семантика 404)', async () => {
    searchSpy.mockResolvedValue([]);

    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });
    controller.handleInput('NonExistentCountry');

    jest.advanceTimersByTime(DEBOUNCE_MS);
    await flushPromises();

    const expectedState: SearchState = {
      status: 'empty',
      query: 'NonExistentCountry',
      results: [],
      history: [],
      error: null,
    };

    expect(controller.getState()).toEqual(expectedState);
  });

  it('сбрасывает состояние в idle и не отправляет запрос, если ввод очищен (пустая строка или пробелы)', () => {
    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });

    controller.handleInput('Bel');
    controller.handleInput('   ');

    jest.advanceTimersByTime(DEBOUNCE_MS);

    expect(searchSpy).not.toHaveBeenCalled();

    const expectedState: SearchState = {
      status: 'idle',
      query: '',
      results: [],
      history: [],
      error: null,
    };

    expect(controller.getState()).toEqual(expectedState);
  });

  it('немедленно отменяет активный запрос (abort) при новом изменении ввода и не переводит AbortError в ошибку UI', async () => {
    let capturedFirstSignal: AbortSignal | undefined;

    searchSpy.mockImplementationOnce((_query, signal) => {
      capturedFirstSignal = signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
    });

    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });

    // Запускаем первый запрос
    controller.handleInput('Bel');
    jest.advanceTimersByTime(DEBOUNCE_MS);
    expect(capturedFirstSignal?.aborted).toBe(false);

    // Пользователь начинает вводить следующую букву — отмена должна сработать НЕМЕДЛЕННО, до нового debounce
    controller.handleInput('Bela');
    expect(capturedFirstSignal?.aborted).toBe(true);

    await flushPromises();

    // Ошибка отмены не должна попасть в error
    expect(controller.getState().error).toBeNull();
    expect(controller.getState().status).not.toBe('error');
  });

  it('различает TimeoutError и устанавливает ошибку с типом timeout', async () => {
    const timeoutError = new DOMException(
      'The operation was aborted due to timeout',
      'TimeoutError'
    );
    searchSpy.mockRejectedValueOnce(timeoutError);

    const controller = createCountrySearchController({
      debounceMs: DEBOUNCE_MS,
      timeoutMs: TIMEOUT_MS,
    });

    controller.handleInput('Belarus');
    jest.advanceTimersByTime(DEBOUNCE_MS);

    await flushPromises();

    const state = controller.getState();
    expect(state.status).toBe('error');
    expect(state.error).toMatchObject({
      type: 'timeout',
    });
  });

  it('обрабатывает HttpError (например 500) как ошибку загрузки с типом http и позволяет повторить запрос через retry()', async () => {
    searchSpy.mockRejectedValueOnce(new HttpError(500, 'Internal Server Error'));

    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });

    controller.handleInput('Belarus');
    jest.advanceTimersByTime(DEBOUNCE_MS);

    await flushPromises();

    expect(controller.getState().status).toBe('error');
    expect(controller.getState().error).toMatchObject({
      type: 'http',
    });

    // Повторный запрос по кнопке retry
    searchSpy.mockResolvedValueOnce([MOCK_RAW_BELARUS]);
    controller.retry();

    await flushPromises();

    expect(searchSpy).toHaveBeenCalledTimes(2);
    expect(controller.getState().status).toBe('success');
    expect(controller.getState().error).toBeNull();
    expect(controller.getState().results).toHaveLength(1);
  });

  it('обрабатывает обрыв сети (TypeError) как ошибку с типом network и позволяет повторить запрос', async () => {
    searchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });

    controller.handleInput('Belarus');
    jest.advanceTimersByTime(DEBOUNCE_MS);

    await flushPromises();

    expect(controller.getState().status).toBe('error');
    expect(controller.getState().error).toMatchObject({
      type: 'network',
    });
  });

  it('немедленно отменяет летящий запрос и сбрасывает список в idle при очистке поля ввода', async () => {
    let capturedSignal: AbortSignal | undefined;

    searchSpy.mockImplementationOnce((_query, signal) => {
      capturedSignal = signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
    });

    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });

    controller.handleInput('Belarus');
    jest.advanceTimersByTime(DEBOUNCE_MS);
    expect(capturedSignal?.aborted).toBe(false);

    // Пользователь полностью очищает поле ввода во время выполнения запроса
    controller.handleInput('');

    expect(capturedSignal?.aborted).toBe(true);
    expect(controller.getState()).toEqual({
      status: 'idle',
      query: '',
      results: [],
      error: null,
      history: [],
    });

    await flushPromises();

    expect(controller.getState().error).toBeNull();
  });

  it('перестаёт уведомлять слушателя после вызова функции отписки unsubscribe', () => {
    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });
    const listener = jest.fn();

    const unsubscribe = controller.subscribe(listener);
    controller.handleInput('Bel');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    controller.handleInput('Belarus');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
