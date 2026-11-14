import { ResponseCountry } from '../types/types.js';
import { HttpError } from '../utils/httpError.js';

const BASE_URL = 'https://countries.dev/countries/name';

export const searchCountries = async (
  query: string,
  signal?: AbortSignal
): Promise<ResponseCountry[]> => {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(`${BASE_URL}/${encodedQuery}`, { signal });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(
      response.status,
      `HTTP error! Status: ${response.status}`,
      response.statusText
    );
  }

  const data = (await response.json()) as ResponseCountry[];
  return data;
};
