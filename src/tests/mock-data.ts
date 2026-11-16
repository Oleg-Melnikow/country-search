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

export const MOCK_COUNTRY_SPAIN: ResponseCountry = {
  area: 505992,
  cioc: 'ESP',
  flag: '🇪🇸',
  gini: 34.7,
  name: 'Spain',
  flags: {
    png: 'https://flagcdn.com',
    svg: 'https://flagcdn.com',
  },
  latlng: [40, -4],
  region: 'Europe',
  borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
  capital: 'Madrid',
  demonym: 'Spanish',
  languages: [
    {
      name: 'Spanish',
      iso639_1: 'es',
      iso639_2: 'spa',
      nativeName: 'Español',
    },
  ],
  subregion: 'Southern Europe',
  timezones: ['UTC', 'UTC+01:00'],
  alpha2Code: 'ES',
  alpha3Code: 'ESP',
  currencies: [
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
    },
  ],
  nativeName: 'España',
  population: 47351567,
  independent: true,
  numericCode: '724',
  callingCodes: ['34'],
  topLevelDomain: ['.es'],
  populationDensity: 93.58,
};

export const MOCK_COUNTRY_SINGAPORE: ResponseCountry = {
  ...MOCK_COUNTRY_SPAIN,
  name: 'Singapore',
  capital: 'Singapore',
  region: 'Asia',
  population: 5685807,
  area: 710,
  borders: [],
  currencies: [{ code: 'SGD', name: 'Singapore dollar', symbol: '$' }],
  flags: {
    png: 'https://flagcdn.com',
    svg: 'https://flagcdn.com',
  },
};
