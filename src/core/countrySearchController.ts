import {
  CountrySearchController,
  SearchControllerOptions,
  SearchState,
  StateListener,
} from '../types/types.js';
import { HttpError } from '../utils/httpError.js';
import { debounce } from './debounce.js';
import { mapCountryResponse } from './mapCountryResponse.js';
import { searchCountries } from './searchCountries.js';

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_TIMEOUT_MS = 5000;

const createCombinedSignal = (
  userSignal: AbortSignal,
  timeoutMs: number
): { signal: AbortSignal; cleanup: () => void } => {
  if (typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function') {
    return {
      signal: AbortSignal.any([userSignal, AbortSignal.timeout(timeoutMs)]),
      cleanup: (): void => {},
    };
  }

  const combinedController = new AbortController();

  const onUserAbort = (): void => {
    combinedController.abort(
      userSignal.reason ?? new DOMException('The operation was aborted', 'AbortError')
    );
  };

  if (userSignal.aborted) {
    onUserAbort();
  } else {
    userSignal.addEventListener('abort', onUserAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    combinedController.abort(
      new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    );
  }, timeoutMs);

  const cleanup = (): void => {
    clearTimeout(timeoutId);
    userSignal.removeEventListener('abort', onUserAbort);
  };

  return { signal: combinedController.signal, cleanup };
};

const isDomExceptionWithName = (error: unknown, name: string): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === name
  );
};

export const createCountrySearchController = (
  options: SearchControllerOptions = {}
): CountrySearchController => {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let state: SearchState = {
    status: 'idle',
    query: '',
    results: [],
    error: null,
  };

  let activeController: AbortController | null = null;
  let lastSubmittedQuery = '';
  let inputVersion = 0;
  const listeners = new Set<StateListener>();

  const setState = (nextState: SearchState): void => {
    state = nextState;
    listeners.forEach((listener) => listener(state));
  };

  const abortActiveRequest = (): void => {
    if (activeController !== null) {
      activeController.abort();
      activeController = null;
    }
  };

  const executeSearch = async (query: string, version: number): Promise<void> => {
    if (version !== inputVersion) {
      return;
    }

    abortActiveRequest();

    const userController = new AbortController();
    activeController = userController;
    lastSubmittedQuery = query;

    setState({
      ...state,
      status: 'loading',
      query,
      error: null,
    });

    const { signal, cleanup } = createCombinedSignal(userController.signal, timeoutMs);

    try {
      const rawCountries = await searchCountries(query, signal);

      if (userController.signal.aborted || version !== inputVersion) {
        return;
      }

      const cards = rawCountries.map(mapCountryResponse);

      setState({
        status: cards.length > 0 ? 'success' : 'empty',
        query,
        results: cards,
        error: null,
      });
    } catch (error: unknown) {
      if (userController.signal.aborted || isDomExceptionWithName(error, 'AbortError')) {
        return;
      }

      if (isDomExceptionWithName(error, 'TimeoutError')) {
        setState({
          ...state,
          status: 'error',
          query,
          error: {
            type: 'timeout',
            message: 'Превышено время ожидания ответа от сервера. Попробуйте ещё раз.',
          },
        });
        return;
      }

      if (error instanceof HttpError) {
        setState({
          ...state,
          status: 'error',
          query,
          error: {
            type: 'http',
            message: `Ошибка сервера (${error.status}). Не удалось загрузить данные.`,
          },
        });
        return;
      }

      setState({
        ...state,
        status: 'error',
        query,
        error: {
          type: 'network',
          message: 'Ошибка сети. Проверьте подключение к интернету и попробуйте снова.',
        },
      });
    } finally {
      cleanup();
      if (activeController === userController) {
        activeController = null;
      }
    }
  };

  const debouncedSearch = debounce((query: string, version: number) => {
    void executeSearch(query, version);
  }, debounceMs);

  const handleInput = (rawQuery: string): void => {
    inputVersion += 1;
    const currentVersion = inputVersion;
    const trimmedQuery = rawQuery.trim();

    abortActiveRequest();

    if (trimmedQuery === '') {
      lastSubmittedQuery = '';
      setState({
        status: 'idle',
        query: '',
        results: [],
        error: null,
      });
      return;
    }

    setState({
      ...state,
      query: rawQuery,
      error: null,
    });

    debouncedSearch(trimmedQuery, currentVersion);
  };

  const retry = (): void => {
    const queryToRetry = lastSubmittedQuery || state.query.trim();
    if (!queryToRetry) {
      return;
    }
    inputVersion += 1;
    void executeSearch(queryToRetry, inputVersion);
  };

  const getState = (): SearchState => state;

  const subscribe = (listener: StateListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    handleInput,
    retry,
    getState,
    subscribe,
  };
};
