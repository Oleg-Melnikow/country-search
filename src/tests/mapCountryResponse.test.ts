import { describe, it, expect } from '@jest/globals';
import { CountryCard, ResponseCountry } from '../types/types.js';
import { mapCountryResponse } from '../core/mapCountryResponse.js';
import { MOCK_COUNTRIES_BEL } from './mock-data.js';

const MOCK_BELARUS_RAW: ResponseCountry = MOCK_COUNTRIES_BEL[0];

describe('mapCountryResponse', () => {
  it('преобразует ResponseCountry в CountryCard с нужными полями, flagUrl и массивом кодов валют', () => {
    const result: CountryCard = mapCountryResponse(MOCK_BELARUS_RAW);

    expect(result).toEqual({
      name: 'Belarus',
      capital: 'Minsk',
      region: 'Europe',
      population: 9398861,
      area: 207600,
      flagUrl: 'https://flagcdn.com',
      borders: ['LVA', 'LTU', 'POL', 'RUS', 'UKR'],
      currencies: ['BYN', 'BYR'],
      languages: ['Belarusian', 'Russian'],
    });

    expect(Object.keys(result).sort()).toEqual([
      'area',
      'borders',
      'capital',
      'currencies',
      'flagUrl',
      'languages',
      'name',
      'population',
      'region',
    ]);
  });

  it('подставляет "—" для пустой столицы и пустые массивы для островных/полярных территорий', () => {
    const antarcticaRaw: ResponseCountry = {
      ...MOCK_BELARUS_RAW,
      name: 'Antarctica',
      flags: {
        png: 'https://flagcdn.com',
        svg: 'https://flagcdn.com',
      },
      capital: '   ',
      region: 'Polar',
      population: 1000,
      area: 14200000,
      borders: [],
      currencies: [],
      languages: [],
    };

    const result = mapCountryResponse(antarcticaRaw);

    expect(result).toEqual({
      name: 'Antarctica',
      capital: '—',
      region: 'Polar',
      population: 1000,
      area: 14200000,
      flagUrl: 'https://flagcdn.com',
      borders: [],
      currencies: [],
      languages: [],
    });
  });

  it('не мутирует исходный объект ResponseCountry (создаёт копии массивов borders, languages и currencies)', () => {
    const result = mapCountryResponse(MOCK_BELARUS_RAW);

    expect(result.borders).not.toBe(MOCK_BELARUS_RAW.borders);
    expect(result.languages).not.toBe(MOCK_BELARUS_RAW.languages);
    expect(result.languages).not.toBe(MOCK_BELARUS_RAW.languages);
  });

  it('корректно обрабатывает отсутствие опциональных массивов в неполном ответе API (защита рантайма)', () => {
    const partialRaw = {
      ...MOCK_BELARUS_RAW,
      capital: undefined,
      borders: undefined,
      currencies: undefined,
      languages: undefined,
    } as unknown as ResponseCountry;

    const result = mapCountryResponse(partialRaw);

    expect(result.capital).toBe('—');
    expect(result.borders).toEqual([]);
    expect(result.currencies).toEqual([]);
    expect(result.languages).toEqual([]);
  });

  it('отфильтровывает пустые коды валют, если в ответе API попался элемент без code', () => {
    const rawWithEmptyCurrency: ResponseCountry = {
      ...MOCK_BELARUS_RAW,
      currencies: [
        { code: 'BYN', name: 'New Belarusian ruble', symbol: 'Br' },
        { code: '', name: 'Unknown currency', symbol: '' },
      ],
    };

    const result = mapCountryResponse(rawWithEmptyCurrency);

    expect(result.currencies).toEqual(['BYN']);
  });

  it('сохраняет нулевые числовые значения population и area без подмены', () => {
    const uninhabitedRaw: ResponseCountry = {
      ...MOCK_BELARUS_RAW,
      name: 'Bouvet Island',
      population: 0,
      area: 49,
    };

    const result = mapCountryResponse(uninhabitedRaw);

    expect(result.population).toBe(0);
    expect(result.area).toBe(49);
  });
});
