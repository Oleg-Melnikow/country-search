import { CountryCard, ResponseCountry } from '../types/types.js';

export const mapCountryResponse = (raw: ResponseCountry): CountryCard => {
  const normalizedCapital = raw.capital?.trim();

  return {
    name: raw.name,
    capital: normalizedCapital ? normalizedCapital : '—',
    region: raw.region,
    population: raw.population,
    area: raw.area,
    flagUrl: raw.flags?.svg || raw.flags?.png || '',
    borders: [...(raw.borders ?? [])],
    currencies: (raw.currencies ?? [])
      .map((currency) => currency.code)
      .filter((code): code is string => Boolean(code)),
    languages: (raw.languages ?? []).map((lang) => lang.name),
  };
};
