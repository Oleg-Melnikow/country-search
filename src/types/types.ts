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
