import { describe, it, expect, jest } from '@jest/globals';
import { ResponseCountry } from '../types/types.js';
import { CountryFetcher, createCachedCountrySearch } from '../core/cachedCountrySearch.js';
import { MOCK_COUNTRY_SPAIN } from './mock-data.js';

describe('createCachedCountrySearch — кэш и дедупликация in-flight запросов', () => {
  it('кэширует успешный результат и при повторном запросе возвращает его без вызова fetcher', async () => {
    const fetcher = jest.fn<CountryFetcher>().mockResolvedValue([MOCK_COUNTRY_SPAIN]);
    const cachedSearch = createCachedCountrySearch(fetcher);

    const firstResult = await cachedSearch.search('Spain');
    const secondResult = await cachedSearch.search('  spain  '); // Проверка нормализации ключа (регистр и пробелы)

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual([MOCK_COUNTRY_SPAIN]);
    expect(secondResult).toEqual([MOCK_COUNTRY_SPAIN]);
    expect(cachedSearch.getCacheSize()).toBe(1);
  });

  it('не кэширует отклонённые запросы (ошибки сети или 500), позволяя повторить запрос', async () => {
    const fetcher = jest
      .fn<CountryFetcher>()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([MOCK_COUNTRY_SPAIN]);

    const cachedSearch = createCachedCountrySearch(fetcher);

    await expect(cachedSearch.search('Spain')).rejects.toThrow('Network error');
    expect(cachedSearch.getCacheSize()).toBe(0);

    const retryResult = await cachedSearch.search('Spain');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(retryResult).toEqual([MOCK_COUNTRY_SPAIN]);
  });

  it('дедуплицирует одновременные одинаковые запросы (in-flight) в один вызов fetcher', async () => {
    let resolveFetch!: (value: ResponseCountry[]) => void;
    const fetcher = jest.fn<CountryFetcher>(
      () =>
        new Promise<ResponseCountry[]>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const cachedSearch = createCachedCountrySearch(fetcher);

    const promise1 = cachedSearch.search('Spain');
    const promise2 = cachedSearch.search('spain');

    // Сетевой запрос должен уйти только один раз
    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch([MOCK_COUNTRY_SPAIN]);

    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect(res1).toEqual([MOCK_COUNTRY_SPAIN]);
    expect(res2).toEqual([MOCK_COUNTRY_SPAIN]);
  });

  it('при отмене сигнала одного из подписчиков in-flight запроса не роняет промис для второго подписчика', async () => {
    let resolveFetch!: (value: ResponseCountry[]) => void;
    let capturedInternalSignal: AbortSignal | undefined;

    const fetcher = jest.fn<CountryFetcher>((_query, signal) => {
      capturedInternalSignal = signal;
      return new Promise<ResponseCountry[]>((resolve, reject) => {
        resolveFetch = resolve;
        signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
    });

    const cachedSearch = createCachedCountrySearch(fetcher);

    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const promise1 = cachedSearch.search('Spain', controller1.signal);
    const promise2 = cachedSearch.search('Spain', controller2.signal);

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Первый вызывающий отменяет свой запрос
    controller1.abort();

    // Первый промис отклоняется с AbortError, но внутренний сетевой запрос НЕ прерывается!
    await expect(promise1).rejects.toMatchObject({ name: 'AbortError' });
    expect(capturedInternalSignal?.aborted).toBe(false);

    // Сетевой запрос успешно завершается для второго вызывающего
    resolveFetch([MOCK_COUNTRY_SPAIN]);
    const res2 = await promise2;
    expect(res2).toEqual([MOCK_COUNTRY_SPAIN]);
  });

  it('отменяет общий внутренний запрос только тогда, когда ВСЕ подписчики вызвали abort()', async () => {
    let capturedInternalSignal: AbortSignal | undefined;

    const fetcher = jest.fn<CountryFetcher>((_query, signal) => {
      capturedInternalSignal = signal;
      return new Promise<ResponseCountry[]>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
    });

    const cachedSearch = createCachedCountrySearch(fetcher);

    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const promise1 = cachedSearch.search('Spain', controller1.signal);
    const promise2 = cachedSearch.search('Spain', controller2.signal);

    controller1.abort();
    expect(capturedInternalSignal?.aborted).toBe(false);

    // Второй (последний) подписчик тоже отменяет запрос
    controller2.abort();
    expect(capturedInternalSignal?.aborted).toBe(true);

    await expect(promise1).rejects.toMatchObject({ name: 'AbortError' });
    await expect(promise2).rejects.toMatchObject({ name: 'AbortError' });
    expect(cachedSearch.getCacheSize()).toBe(0);
  });
});
