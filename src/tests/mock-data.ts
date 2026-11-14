import { ResponseCountry } from '../types/types.js';

export const MOCK_COUNTRIES_BEL: ResponseCountry[] = [
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
