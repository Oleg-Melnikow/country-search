import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ResponseCountry } from '../types/types.js';
import { createMockResponse } from '../utils/createMockResponse.js';
import { searchCountries } from '../core/searchCountries.js';
import { HttpError } from '../utils/httpError.js';

const MOCK_COUNTRIES_BEL: ResponseCountry[] = [
  {
    area: 207600,
    cioc: 'BLR',
    flag: '🇧🇾',
    gini: 25.3,
    name: 'Belarus',
    flags: {
      png: 'https://flagcdn.com',
      svg: 'https://flagcdn.com',
    },
    latlng: [1, 1],
    region: 'Europe',
    borders: ['LVA', 'LTU', 'POL', 'RUS', 'UKR'],
    capital: 'Minsk',
    demonym: 'Belarusian',
    languages: [
      {
        name: 'Belarusian',
        iso639_1: 'be',
        iso639_2: 'bel',
        nativeName: 'беларуская мова',
      },
      {
        name: 'Russian',
        iso639_1: 'ru',
        iso639_2: 'rus',
        nativeName: 'Русский',
      },
    ],
    subregion: 'Eastern Europe',
    timezones: ['UTC+03:00'],
    alpha2Code: 'BY',
    alpha3Code: 'BLR',
    currencies: [
      {
        code: 'BYN',
        name: 'New Belarusian ruble',
        symbol: 'Br',
      },
      {
        code: 'BYR',
        name: 'Old Belarusian ruble',
        symbol: 'Br',
      },
    ],
    nativeName: 'Белару́сь',
    population: 9398861,
    independent: true,
    numericCode: '112',
    callingCodes: ['375'],
    topLevelDomain: ['.by'],
    populationDensity: 45.27,
  },
];

describe('searchCountries', () => {
  const mockFetch = jest.fn<typeof fetch>();

  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('формирует путь /name/{query}, передаёт AbortSignal и возвращает список стран', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue(createMockResponse(MOCK_COUNTRIES_BEL, 200));

    const result = await searchCountries('Bel', controller.signal);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/name/Bel'), {
      signal: controller.signal,
    });
    expect(result).toEqual(MOCK_COUNTRIES_BEL);
  });

  it('корректно кодирует пробелы и спецсимволы в поисковом запросе', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue(createMockResponse([], 200));

    await searchCountries('United States', controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/name/United%20States'), {
      signal: controller.signal,
    });
  });

  it('корректно работает без передачи необязательного параметра signal', async () => {
    mockFetch.mockResolvedValue(createMockResponse(MOCK_COUNTRIES_BEL, 200));

    const result = await searchCountries('Bel');

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/name/Bel'), {
      signal: undefined,
    });
    expect(result).toEqual(MOCK_COUNTRIES_BEL);
  });

  it('возвращает пустой массив [], если сервер вернул 404 (совпадений не найдено)', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue(createMockResponse({ message: 'Not Found' }, 404));

    const result = await searchCountries('UnknownCountry123', controller.signal);

    expect(result).toEqual([]);
  });

  it('выбрасывает HttpError со статусом 500 при серверной ошибке (response.ok === false)', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue(createMockResponse({ message: 'Server Error' }, 500));

    const promise = searchCountries('Belarus', controller.signal);

    await expect(promise).rejects.toThrow(HttpError);
    await expect(promise).rejects.toMatchObject({
      name: 'HttpError',
      status: 500,
    });
  });

  it('выбрасывает HttpError при других неуспешных HTTP-статусах (например, 400)', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue(createMockResponse({ message: 'Bad Request' }, 400));

    const promise = searchCountries('Belarus', controller.signal);

    await expect(promise).rejects.toThrow(HttpError);
    await expect(promise).rejects.toMatchObject({
      name: 'HttpError',
      status: 400,
    });
  });

  it('пробрасывает SyntaxError, если сервер вернул 200 OK с невалидным JSON', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue(createMockResponse('<html>Not JSON</html>', 200));

    await expect(searchCountries('Belarus', controller.signal)).rejects.toThrow(SyntaxError);
  });

  it('пробрасывает AbortError при отмене запроса через AbortSignal', async () => {
    const controller = new AbortController();
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    mockFetch.mockRejectedValue(abortError);

    await expect(searchCountries('Belarus', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('пробрасывает TimeoutError при срабатывании таймаута сигнала', async () => {
    const timeoutSignal = AbortSignal.timeout(1000);
    const timeoutError = new DOMException(
      'The operation was aborted due to timeout',
      'TimeoutError'
    );
    mockFetch.mockRejectedValue(timeoutError);

    await expect(searchCountries('Belarus', timeoutSignal)).rejects.toMatchObject({
      name: 'TimeoutError',
    });
  });
});
