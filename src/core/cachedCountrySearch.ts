import { ResponseCountry } from '../types/types.js';

export type CountryFetcher = (query: string, signal?: AbortSignal) => Promise<ResponseCountry[]>;

export interface CachedCountrySearcher {
  search: (query: string, signal?: AbortSignal) => Promise<ResponseCountry[]>;
  clearCache: () => void;
  getCacheSize: () => number;
}

export const createCachedCountrySearch = (fetcher: CountryFetcher): CachedCountrySearcher => {
  throw new Error(`Not implemented ${fetcher}`);
};
