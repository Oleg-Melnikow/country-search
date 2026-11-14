import { ResponseCountry } from '../types/types.js';

export const searchCountries = async (
  query: string,
  signal?: AbortSignal
): Promise<ResponseCountry[]> => {
  throw new Error(`Not implemented ${query} with ${signal} ms`);
};
