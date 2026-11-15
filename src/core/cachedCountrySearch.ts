import {
  CachedCountrySearcher,
  CountryFetcher,
  InFlightEntry,
  ResponseCountry,
} from '../types/types.js';

const normalizeCacheKey = (query: string): string => query.trim().toLowerCase();

const createAbortError = (signal?: AbortSignal): unknown =>
  signal?.reason ?? new DOMException('The operation was aborted', 'AbortError');

const raceWithCallerSignal = <T>(
  sharedPromise: Promise<T>,
  callerSignal: AbortSignal | undefined,
  onCallerAbort: () => void
): Promise<T> => {
  if (!callerSignal) {
    return sharedPromise;
  }

  if (callerSignal.aborted) {
    onCallerAbort();
    return Promise.reject(createAbortError(callerSignal));
  }

  return new Promise<T>((resolve, reject) => {
    const handleAbort = (): void => {
      onCallerAbort();
      reject(createAbortError(callerSignal));
    };

    callerSignal.addEventListener('abort', handleAbort, { once: true });

    sharedPromise.then(
      (value) => {
        callerSignal.removeEventListener('abort', handleAbort);
        resolve(value);
      },
      (error: unknown) => {
        callerSignal.removeEventListener('abort', handleAbort);
        reject(error);
      }
    );
  });
};

export const createCachedCountrySearch = (fetcher: CountryFetcher): CachedCountrySearcher => {
  const cache = new Map<string, ResponseCountry[]>();
  const inFlight = new Map<string, InFlightEntry>();

  const getOrCreateInFlightEntry = (key: string, cleanQuery: string): InFlightEntry => {
    const existingEntry = inFlight.get(key);
    if (existingEntry) {
      return existingEntry;
    }

    const internalController = new AbortController();

    const sharedPromise = fetcher(cleanQuery, internalController.signal)
      .then((data) => {
        cache.set(key, data);
        return data;
      })
      .finally(() => {
        if (inFlight.get(key)?.internalController === internalController) {
          inFlight.delete(key);
        }
      });

    const newEntry: InFlightEntry = {
      promise: sharedPromise,
      internalController,
      subscribersCount: 0,
    };

    inFlight.set(key, newEntry);
    return newEntry;
  };

  const subscribeToInFlight = (
    key: string,
    entry: InFlightEntry,
    callerSignal?: AbortSignal
  ): Promise<ResponseCountry[]> => {
    entry.subscribersCount += 1;
    let isUnsubscribed = false;

    const handleCallerAbort = (): void => {
      if (isUnsubscribed) {
        return;
      }
      isUnsubscribed = true;
      entry.subscribersCount -= 1;

      if (entry.subscribersCount <= 0) {
        entry.internalController.abort();
        if (inFlight.get(key) === entry) {
          inFlight.delete(key);
        }
      }
    };

    return raceWithCallerSignal(entry.promise, callerSignal, handleCallerAbort).then((data) => [
      ...data,
    ]);
  };

  const search = (query: string, callerSignal?: AbortSignal): Promise<ResponseCountry[]> => {
    if (callerSignal?.aborted) {
      return Promise.reject(createAbortError(callerSignal));
    }

    const key = normalizeCacheKey(query);
    const cachedData = cache.get(key);

    if (cachedData !== undefined) {
      return Promise.resolve([...cachedData]);
    }

    const entry = getOrCreateInFlightEntry(key, query.trim());
    return subscribeToInFlight(key, entry, callerSignal);
  };

  return {
    search,
    clearCache: () => cache.clear(),
    getCacheSize: () => cache.size,
  };
};
