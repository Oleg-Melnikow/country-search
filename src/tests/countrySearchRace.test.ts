import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createCountrySearchController } from '../core/countrySearchController.js';
import { createMockResponse } from '../utils/createMockResponse.js';
import { MOCK_COUNTRY_SINGAPORE, MOCK_COUNTRY_SPAIN } from './mock-data.js';

interface ControlledFetchCall {
  url: string;
  signal?: AbortSignal;
  resolve: (response: Response) => void;
  reject: (reason: unknown) => void;
  promise: Promise<Response>;
}

describe('createCountrySearchController — гонка запросов (Race Condition)', () => {
  const DEBOUNCE_MS = 300;
  let capturedCalls: ControlledFetchCall[];

  beforeEach(() => {
    jest.useFakeTimers();
    capturedCalls = [];

    globalThis.fetch = jest.fn<typeof fetch>((input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const signal = init?.signal ?? undefined;

      let resolveFn!: (value: Response) => void;
      let rejectFn!: (reason?: unknown) => void;

      const promise = new Promise<Response>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;

        if (signal) {
          if (signal.aborted) {
            reject(new DOMException('The operation was aborted', 'AbortError'));
            return;
          }

          signal.addEventListener(
            'abort',
            () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            },
            { once: true }
          );
        }
      });

      capturedCalls.push({
        url,
        signal,
        resolve: resolveFn,
        reject: rejectFn,
        promise,
      });

      return promise;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('отменяет ранний запрос (AbortError) и сохраняет в состоянии только результат более позднего запроса при инверсии порядка ответов', async () => {
    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });

    // 1. Пользователь вводит "sp", ждём debounce -> уходит первый сетевой запрос
    controller.handleInput('sp');
    jest.advanceTimersByTime(DEBOUNCE_MS);

    expect(capturedCalls).toHaveLength(1);
    const firstRequest = capturedCalls[0];
    expect(firstRequest.url).toContain('/name/sp');
    expect(firstRequest.signal?.aborted).toBe(false);

    // 2. Пользователь допечатывает "spain" -> первый запрос должен НЕМЕДЛЕННО отмениться
    controller.handleInput('spain');
    expect(firstRequest.signal?.aborted).toBe(true);

    // Убеждаемся, что промис первого fetch действительно отклонён с AbortError
    await expect(firstRequest.promise).rejects.toMatchObject({
      name: 'AbortError',
    });

    // Ждём debounce для "spain" -> уходит второй сетевой запрос
    jest.advanceTimersByTime(DEBOUNCE_MS);
    expect(capturedCalls).toHaveLength(2);
    const secondRequest = capturedCalls[1];
    expect(secondRequest.url).toContain('/name/spain');

    // 3. ИНВЕРСИЯ ПОРЯДКА ОТВЕТОВ:
    // Сначала резолвим второй (поздний) запрос по "spain"
    secondRequest.resolve(createMockResponse([MOCK_COUNTRY_SPAIN], 200));
    await Promise.resolve();
    await Promise.resolve();

    // Затем пытаемся зарезолвить первый (ранний, но медленный) запрос по "sp" с устаревшим списком
    firstRequest.resolve(createMockResponse([MOCK_COUNTRY_SINGAPORE, MOCK_COUNTRY_SPAIN], 200));
    await Promise.resolve();
    await Promise.resolve();

    // 4. Итоговая проверка состояния приложения:
    // В состоянии только результат последнего запроса ("Spain"), без ошибки отмены
    const finalState = controller.getState();
    expect(finalState.status).toBe('success');
    expect(finalState.query).toBe('spain');
    expect(finalState.error).toBeNull();
    expect(finalState.results).toHaveLength(1);
    expect(finalState.results.map((country) => country.name)).toEqual(['Spain']);
  });

  it('не перезаписывает успешный результат позднего запроса ошибкой устаревшего раннего запроса', async () => {
    const controller = createCountrySearchController({ debounceMs: DEBOUNCE_MS });

    // 1. Запускаем первый запрос ("sp")
    controller.handleInput('sp');
    jest.advanceTimersByTime(DEBOUNCE_MS);
    const [firstRequest] = capturedCalls;

    // 2. Вводим "spain" — первый запрос отменяется, запускается второй
    controller.handleInput('spain');
    expect(firstRequest?.signal?.aborted).toBe(true);

    jest.advanceTimersByTime(DEBOUNCE_MS);
    const [, secondRequest] = capturedCalls;

    // 3. Второй запрос успешно завершается
    secondRequest?.resolve(createMockResponse([MOCK_COUNTRY_SPAIN], 200));
    await Promise.resolve();
    await Promise.resolve();

    // 4. Пытаемся отклонить первый запрос серверной ошибкой (имитация запоздалого сбоя)
    firstRequest?.reject(new Error('Late network failure'));
    await Promise.resolve();
    await Promise.resolve();

    // 5. Итоговое состояние остаётся успешным с данными по "Spain"
    const finalState = controller.getState();
    expect(finalState.status).toBe('success');
    expect(finalState.error).toBeNull();
    expect(finalState.results.map((country) => country.name)).toEqual(['Spain']);
  });
});
