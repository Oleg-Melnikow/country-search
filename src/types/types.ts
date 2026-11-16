export interface CountryFlags {
  png: string;
  svg: string;
}

export interface CountryLanguage {
  name: string;
  iso639_1: string;
  iso639_2: string;
  nativeName: string;
}

export interface CountryCurrency {
  code: string;
  name: string;
  symbol: string;
}

export type BaseCountryInfo = Pick<
  ResponseCountry,
  'name' | 'capital' | 'region' | 'population' | 'area' | 'borders'
>;

export interface CountryCard extends BaseCountryInfo {
  flagUrl: string;
  currencies: string[];
  languages: string[];
}

export interface ResponseCountry {
  area: number;
  cioc: string;
  flag: string;
  gini: number;
  name: string;
  flags: CountryFlags;
  latlng: [number, number];
  region: string;
  borders: string[];
  capital: string;
  demonym: string;
  languages: CountryLanguage[];
  subregion: string;
  timezones: string[];
  alpha2Code: string;
  alpha3Code: string;
  currencies: CountryCurrency[];
  nativeName: string;
  population: number;
  independent: boolean;
  numericCode: string;
  callingCodes: string[];
  topLevelDomain: string[];
  populationDensity: number;
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type SearchErrorType = 'timeout' | 'http' | 'network';

export interface SearchErrorInfo {
  type: SearchErrorType;
  message: string;
}

export interface SearchState {
  status: SearchStatus;
  query: string;
  results: CountryCard[];
  error: SearchErrorInfo | null;
  history: string[];
}

export type StateListener = (state: SearchState) => void;

export interface SearchControllerOptions {
  debounceMs?: number;
  timeoutMs?: number;
  cachedSearcher?: CachedCountrySearcher;
  historyManager?: SearchHistoryManager;
}

export interface CountrySearchController {
  handleInput: (query: string) => void;
  retry: () => void;
  getState: () => SearchState;
  subscribe: (listener: StateListener) => () => void;
  selectFromHistory: (historyQuery: string) => void;
  clearHistory: () => void;
}

export type CountryFetcher = (query: string, signal?: AbortSignal) => Promise<ResponseCountry[]>;

export interface CachedCountrySearcher {
  search: (query: string, signal?: AbortSignal) => Promise<ResponseCountry[]>;
  clearCache: () => void;
  getCacheSize: () => number;
}

export interface InFlightEntry {
  promise: Promise<ResponseCountry[]>;
  internalController: AbortController;
  subscribersCount: number;
}

export interface SearchHistoryOptions {
  storageKey?: string;
  maxItems?: number;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export interface SearchHistoryManager {
  add: (query: string) => string[];
  getAll: () => string[];
  clear: () => void;
}

export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
