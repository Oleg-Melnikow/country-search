import { CountryCard } from '../types/types.js';
import { createDOMElement } from '../utils/domUtils.js';

export const createCountryCardElement = (
  country: CountryCard,
  onSelect: (card: CountryCard) => void
): HTMLElement => {
  const card = createDOMElement('article', {
    className: 'country-card',
    tabIndex: 0,
  });
  card.setAttribute('role', 'button');

  const flag = createDOMElement('img', {
    className: 'country-flag',
    src: country.flagUrl,
    alt: `Флаг ${country.name}`,
    loading: 'lazy',
  });

  const body = createDOMElement('div', { className: 'country-body' });
  const name = createDOMElement('h3', {
    className: 'country-name',
    textContent: country.name,
  });
  const capital = createDOMElement('p', {
    className: 'country-meta',
    textContent: `Столица: ${country.capital}`,
  });
  const region = createDOMElement('p', {
    className: 'country-meta',
    textContent: `Регион: ${country.region}`,
  });
  const population = createDOMElement('p', {
    className: 'country-meta',
    textContent: `Население: ${country.population.toLocaleString('ru-RU')}`,
  });

  body.append(name, capital, region, population);
  card.append(flag, body);

  const handleSelect = (): void => onSelect(country);

  card.addEventListener('click', handleSelect);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  });

  return card;
};
