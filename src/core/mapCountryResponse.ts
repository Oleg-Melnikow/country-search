import { CountryCard, ResponseCountry } from '../types/types.js';

export const mapCountryResponse = (raw: ResponseCountry): CountryCard => {
  throw new Error(`Not implemented ${raw.capital}`);
};
