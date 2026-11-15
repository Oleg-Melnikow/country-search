import { CountrySearchController, SearchControllerOptions } from '../types/types.js';

export const createCountrySearchController = (
  options?: SearchControllerOptions
): CountrySearchController => {
  throw new Error(`Not implemented ${options?.debounceMs}`);
};
